from fastapi import APIRouter, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/stats", tags=["stats"])

mongo_url = os.environ.get('MONGO_URL')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'vara_db')]

# Configurable seed base so the "total paid out" counter doesn't start at $0 on launch.
# Set via env var; defaults to 0 for strict real-number display.
TOTAL_PAID_OUT_BASE = float(os.environ.get("TOTAL_PAID_OUT_BASE", "0"))


@router.get("/total-paid-out")
async def total_paid_out():
    """Public trust counter: total USD paid out to users."""
    try:
        pipeline = [
            {"$match": {"status": {"$in": ["approved", "completed"]}}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
        ]
        result = await db.withdrawal_requests.aggregate(pipeline).to_list(1)
        real_total = result[0]["total"] if result else 0.0
        total = round(TOTAL_PAID_OUT_BASE + real_total, 2)
        return {"total_paid_out": total, "currency": "USD"}
    except Exception as e:
        logger.error(f"Error computing total paid out: {str(e)}")
        return {"total_paid_out": round(TOTAL_PAID_OUT_BASE, 2), "currency": "USD"}


@router.get("/recent-withdrawals")
async def recent_withdrawals(limit: int = 10):
    """Public feed of recent withdrawals for trust/social proof. Emails are masked."""
    try:
        limit = max(1, min(limit, 50))
        withdrawals = await db.withdrawal_requests.find(
            {"status": {"$in": ["approved", "completed"]}}
        ).sort("created_at", -1).to_list(limit)
        
        feed = []
        for w in withdrawals:
            # Lookup user email for masking
            user_email = None
            from bson import ObjectId
            try:
                u = await db.users.find_one({"_id": ObjectId(w["user_id"])})
                user_email = u.get("email") if u else None
            except Exception:
                pass
            
            masked = "anonymous"
            if user_email and "@" in user_email:
                local, domain = user_email.split("@", 1)
                masked = (local[:2] + "***@" + domain) if len(local) > 2 else ("***@" + domain)
            
            feed.append({
                "masked_email": masked,
                "amount": round(float(w.get("amount", 0)), 2),
                "method": w.get("method", ""),
                "created_at": w.get("created_at").isoformat() if w.get("created_at") else None,
            })
        return {"recent_withdrawals": feed}
    except Exception as e:
        logger.error(f"Error fetching recent withdrawals: {str(e)}")
        return {"recent_withdrawals": []}
