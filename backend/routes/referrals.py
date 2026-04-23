from fastapi import APIRouter, HTTPException, Depends
from routes.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/referrals", tags=["referrals"])

mongo_url = os.environ.get('MONGO_URL')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'vara_db')]

REFERRAL_CAP = 10.0  # $10 max lifetime earnings per referred user
REFERRAL_PCT = 0.10


@router.get("/me")
async def get_my_referral_info(current_user: dict = Depends(get_current_user)):
    """Return the current user's referral code, stats, and recent payouts."""
    try:
        user_id = ObjectId(current_user["_id"])
        user = await db.users.find_one({"_id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Recent payouts credited to this user
        payouts = await db.referral_payouts.find(
            {"referrer_user_id": str(user_id)}
        ).sort("created_at", -1).to_list(20)
        
        for p in payouts:
            p["_id"] = str(p["_id"])
            # Don't leak full emails — mask
            email = p.get("referred_email", "")
            if email and "@" in email:
                local, domain = email.split("@", 1)
                p["referred_email"] = (local[:2] + "***@" + domain) if len(local) > 2 else ("***@" + domain)
        
        return {
            "referral_code": user.get("referral_code"),
            "referred_count": user.get("referred_count", 0),
            "referral_earnings": round(user.get("referral_earnings", 0.0), 4),
            "cap_per_referral": REFERRAL_CAP,
            "pct": REFERRAL_PCT,
            "recent_payouts": payouts,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching referral info: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch referral info")


@router.get("/validate/{code}")
async def validate_referral_code(code: str):
    """Check if a referral code is valid (used on signup form)."""
    code = code.strip().upper()
    referrer = await db.users.find_one({"referral_code": code})
    if not referrer:
        return {"valid": False}
    return {"valid": True, "referrer_name": referrer.get("name", "a VARA user")}
