from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from routes.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
from datetime import datetime

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
    """Request withdrawal (mock for testing)"""
    try:
        user_id = ObjectId(current_user["_id"])
        user = await db.users.find_one({"_id": user_id})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        current_earnings = user.get("earnings", 0.0)
        
        # Minimum withdrawal is $5.00
        if withdrawal.amount < 5.0:
            raise HTTPException(status_code=400, detail="Minimum withdrawal is $5.00 USD")
        
        if withdrawal.amount > current_earnings:
            raise HTTPException(status_code=400, detail="Insufficient balance")
        
        # Create withdrawal request
        withdrawal_doc = {
            "user_id": str(user_id),
            "amount": withdrawal.amount,
            "method": withdrawal.method,
            "account_details": withdrawal.account_details,
            "status": "pending",
            "created_at": datetime.utcnow(),
            "processed_at": None
        }
        
        result = await db.withdrawal_requests.insert_one(withdrawal_doc)
        withdrawal_id = str(result.inserted_id)
        
        # For testing purposes, auto-approve
        await db.withdrawal_requests.update_one(
            {"_id": result.inserted_id},
            {"$set": {"status": "approved", "processed_at": datetime.utcnow()}}
        )
        
        # Deduct from user balance and track withdrawal
        await db.users.update_one(
            {"_id": user_id},
            {
                "$inc": {
                    "earnings": -withdrawal.amount,
                    "total_withdrawn": withdrawal.amount
                }
            }
        )
        
        logger.info(f"User {user['email']} requested withdrawal of ${withdrawal.amount} via {withdrawal.method}")
        
        return WithdrawalResponse(
            success=True,
            message=f"Withdrawal request approved! ${withdrawal.amount} will be sent to your {withdrawal.method} account.",
            withdrawal_id=withdrawal_id,
            amount=withdrawal.amount,
            status="approved"
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
