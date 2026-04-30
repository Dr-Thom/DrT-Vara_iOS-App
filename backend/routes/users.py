"""User stats — progression data for dashboard UI."""
from fastapi import APIRouter, Depends
from routes.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os

from utils.economics import next_bonus_milestone, bonuses_earned_count, BONUS_MILESTONES
from utils.streak import streak_multiplier, streak_tier_label
from utils.trust import trust_tier, withdrawal_delay_hours, withdrawal_limits_usd

router = APIRouter(prefix="/api/users", tags=["users"])

mongo_url = os.environ.get('MONGO_URL')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'vara_db')]


@router.get("/me/stats")
async def get_my_stats(current_user: dict = Depends(get_current_user)):
    """Progression stats for the dashboard: trust, streak, next milestone."""
    user = await db.users.find_one({"_id": ObjectId(current_user["_id"])})
    if not user:
        return {}

    tasks_completed = user.get("tasks_completed", 0)
    streak = user.get("current_streak", 0)
    trust = user.get("trust_score", 50)

    next_milestone = next_bonus_milestone(tasks_completed)

    min_w, max_w = withdrawal_limits_usd(trust)

    return {
        "trust": {
            "score": trust,
            "tier": trust_tier(trust),
            "withdrawal_delay_hours": withdrawal_delay_hours(trust),
            "min_withdrawal": min_w,
            "max_daily_withdrawal": max_w,
        },
        "streak": {
            "current": streak,
            "longest": user.get("longest_streak", 0),
            "multiplier": streak_multiplier(streak),
            "tier": streak_tier_label(streak),
        },
        "bonuses": {
            "earned_count": bonuses_earned_count(tasks_completed),
            "next": next_milestone,
            "ladder": [{"threshold": t, "amount": a} for t, a in BONUS_MILESTONES],
        },
    }
