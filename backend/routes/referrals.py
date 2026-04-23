from fastapi import APIRouter, HTTPException, Depends
from routes.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/referrals", tags=["referrals"])

mongo_url = os.environ.get('MONGO_URL')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'vara_db')]

REFERRAL_CAP = 10.0  # $10 max lifetime earnings per referred user
REFERRAL_PCT = 0.10


def _mask_email(email: str) -> str:
    if not email or "@" not in email:
        return "anonymous"
    local, domain = email.split("@", 1)
    return (local[:2] + "***@" + domain) if len(local) > 2 else ("***@" + domain)


def _mask_name(name: str, email: str) -> str:
    """Prefer a trimmed name, fall back to masked email."""
    if name and name.strip() and name.lower() not in ("user", "admin"):
        return name.strip()
    return _mask_email(email)


@router.get("/me")
async def get_my_referral_info(current_user: dict = Depends(get_current_user)):
    """Return the current user's referral code, stats, and recent payouts."""
    try:
        user_id = ObjectId(current_user["_id"])
        user = await db.users.find_one({"_id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        payouts = await db.referral_payouts.find(
            {"referrer_user_id": str(user_id)}
        ).sort("created_at", -1).to_list(20)
        
        for p in payouts:
            p["_id"] = str(p["_id"])
            p["referred_email"] = _mask_email(p.get("referred_email", ""))
        
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


@router.get("/leaderboard")
async def leaderboard(period: str = "month", limit: int = 10, current_user: dict = Depends(get_current_user)):
    """Top referrers by earnings. period='month' (default) or 'all'."""
    limit = max(1, min(limit, 50))

    match_stage = {}
    if period == "month":
        now = datetime.now(timezone.utc)
        start_of_month = datetime(now.year, now.month, 1, tzinfo=timezone.utc).replace(tzinfo=None)
        match_stage = {"created_at": {"$gte": start_of_month}}

    pipeline = []
    if match_stage:
        pipeline.append({"$match": match_stage})
    pipeline.extend([
        {"$group": {
            "_id": "$referrer_user_id",
            "total_earned": {"$sum": "$amount"},
            "unique_referreds": {"$addToSet": "$referred_user_id"},
            "payouts": {"$sum": 1},
        }},
        {"$project": {
            "_id": 1,
            "total_earned": 1,
            "referral_count": {"$size": "$unique_referreds"},
            "payouts": 1,
        }},
        {"$sort": {"total_earned": -1}},
        {"$limit": limit},
    ])

    try:
        rows = await db.referral_payouts.aggregate(pipeline).to_list(limit)
    except Exception as e:
        logger.error(f"Leaderboard aggregation failed: {e}")
        rows = []

    # Hydrate user info + compute caller's rank
    leaderboard_out = []
    caller_id = str(current_user["_id"])
    caller_in_top = False

    for rank, row in enumerate(rows, start=1):
        referrer_id = row["_id"]
        try:
            u = await db.users.find_one({"_id": ObjectId(referrer_id)})
        except Exception:
            u = None
        display = _mask_name(u.get("name") if u else None, u.get("email") if u else "")
        is_you = (referrer_id == caller_id)
        if is_you:
            caller_in_top = True
        leaderboard_out.append({
            "rank": rank,
            "display_name": display,
            "total_earned": round(row["total_earned"], 2),
            "referral_count": row["referral_count"],
            "is_you": is_you,
        })

    # If caller not in top-N, compute their position separately
    you_row = None
    if not caller_in_top:
        caller_pipeline = []
        if match_stage:
            caller_pipeline.append({"$match": match_stage})
        caller_pipeline.extend([
            {"$match": {"referrer_user_id": caller_id}},
            {"$group": {
                "_id": "$referrer_user_id",
                "total_earned": {"$sum": "$amount"},
                "unique_referreds": {"$addToSet": "$referred_user_id"},
            }},
        ])
        caller_agg = await db.referral_payouts.aggregate(caller_pipeline).to_list(1)
        if caller_agg:
            caller_total = caller_agg[0]["total_earned"]
            # Count how many referrers earned strictly more
            rank_pipeline = []
            if match_stage:
                rank_pipeline.append({"$match": match_stage})
            rank_pipeline.extend([
                {"$group": {"_id": "$referrer_user_id", "total": {"$sum": "$amount"}}},
                {"$match": {"total": {"$gt": caller_total}}},
                {"$count": "ahead"},
            ])
            ahead_agg = await db.referral_payouts.aggregate(rank_pipeline).to_list(1)
            ahead = ahead_agg[0]["ahead"] if ahead_agg else 0
            you_row = {
                "rank": ahead + 1,
                "display_name": current_user.get("name") or _mask_email(current_user.get("email", "")),
                "total_earned": round(caller_total, 2),
                "referral_count": len(caller_agg[0]["unique_referreds"]),
                "is_you": True,
            }

    return {
        "period": period,
        "leaderboard": leaderboard_out,
        "you": you_row,  # populated only if you're outside top-N
    }
