from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from routes.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
from datetime import datetime, timedelta

from utils.trust import (
    trust_tier,
    withdrawal_delay_hours,
    withdrawal_limits_usd,
    TRUST_PER_SUCCESSFUL_WITHDRAWAL,
    clamp_trust,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/withdrawal", tags=["withdrawal"])

# Get database connection
mongo_url = os.environ.get('MONGO_URL')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'vara_db')]

class WithdrawalRequest(BaseModel):
    amount: float
    method: str  # "gcash", "paypal", "bank"
    account_details: str

class WithdrawalResponse(BaseModel):
    success: bool
    message: str
    withdrawal_id: str
    amount: float
    status: str

@router.post("/request", response_model=WithdrawalResponse)
async def request_withdrawal(
    withdrawal: WithdrawalRequest,
    current_user: dict = Depends(get_current_user)
):
    """Request withdrawal. Trust tier determines delay + daily max."""
    try:
        user_id = ObjectId(current_user["_id"])
        user = await db.users.find_one({"_id": user_id})

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        current_earnings = user.get("earnings", 0.0)
        trust = user.get("trust_score", 50)
        min_w, max_daily = withdrawal_limits_usd(trust)
        delay_hrs = withdrawal_delay_hours(trust)
        tier_label = trust_tier(trust)

        # Enforce minimum
        if withdrawal.amount < min_w:
            raise HTTPException(
                status_code=400,
                detail=f"Minimum withdrawal is ${min_w:.2f} USD"
            )

        # Enforce balance
        if withdrawal.amount > current_earnings:
            raise HTTPException(status_code=400, detail="Insufficient balance")

        # Enforce daily limit based on trust tier
        since = datetime.utcnow() - timedelta(hours=24)
        pipeline = [
            {"$match": {
                "user_id": str(user_id),
                "created_at": {"$gte": since},
                "status": {"$in": ["pending", "approved", "completed"]},
            }},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
        ]
        result = await db.withdrawal_requests.aggregate(pipeline).to_list(1)
        withdrawn_last_24h = result[0]["total"] if result else 0.0
        if withdrawn_last_24h + withdrawal.amount > max_daily:
            remaining = max(0, max_daily - withdrawn_last_24h)
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Daily withdrawal limit reached. Your '{tier_label}' tier caps you at "
                    f"${max_daily:.2f}/24h. You can withdraw ${remaining:.2f} more right now. "
                    f"Complete more tasks to grow your trust score."
                )
            )

        # Create withdrawal request
        now = datetime.utcnow()
        eta = now + timedelta(hours=delay_hrs) if delay_hrs > 0 else now
        status = "pending" if delay_hrs > 0 else "approved"

        withdrawal_doc = {
            "user_id": str(user_id),
            "amount": withdrawal.amount,
            "method": withdrawal.method,
            "account_details": withdrawal.account_details,
            "status": status,
            "trust_tier_at_request": tier_label,
            "delay_hours": delay_hrs,
            "estimated_payout_at": eta,
            "created_at": now,
            "processed_at": now if status == "approved" else None,
        }

        result = await db.withdrawal_requests.insert_one(withdrawal_doc)
        withdrawal_id = str(result.inserted_id)

        # Deduct from balance + track withdrawn + award trust for successful withdrawal
        trust_gain = TRUST_PER_SUCCESSFUL_WITHDRAWAL
        new_trust = clamp_trust(trust + trust_gain)
        await db.users.update_one(
            {"_id": user_id},
            {
                "$inc": {
                    "earnings": -withdrawal.amount,
                    "total_withdrawn": withdrawal.amount,
                },
                "$set": {"trust_score": new_trust},
            }
        )

        logger.info(
            f"User {user['email']} withdrew ${withdrawal.amount} via {withdrawal.method} "
            f"(trust={trust}→{new_trust}, status={status}, ETA={eta.isoformat()})"
        )

        if delay_hrs == 0:
            message = f"Withdrawal approved! ${withdrawal.amount:.2f} processing now."
        else:
            message = (
                f"Withdrawal request received. Your '{tier_label}' trust tier has a "
                f"{delay_hrs}h hold — payout by {eta.strftime('%b %d, %I:%M %p UTC')}."
            )

        return WithdrawalResponse(
            success=True,
            message=message,
            withdrawal_id=withdrawal_id,
            amount=withdrawal.amount,
            status=status,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Withdrawal error: {str(e)}")
        raise HTTPException(status_code=500, detail="Withdrawal request failed")

@router.get("/history")
async def get_withdrawal_history(current_user: dict = Depends(get_current_user)):
    """Get withdrawal history for user"""
    try:
        withdrawals = await db.withdrawal_requests.find({
            "user_id": current_user["_id"]
        }).sort("created_at", -1).to_list(100)
        
        for w in withdrawals:
            w["_id"] = str(w["_id"])
        
        return withdrawals
        
    except Exception as e:
        logger.error(f"Error fetching withdrawal history: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch withdrawal history")
