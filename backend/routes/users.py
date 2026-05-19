"""User stats — progression data for dashboard UI."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from routes.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from datetime import datetime
import os
import logging

from utils.economics import next_bonus_milestone, bonuses_earned_count, BONUS_MILESTONES
from utils.streak import streak_multiplier, streak_tier_label
from utils.trust import trust_tier, withdrawal_delay_hours, withdrawal_limits_usd
from utils.push import is_valid_expo_token

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/users", tags=["users"])

mongo_url = os.environ.get('MONGO_URL')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'vara_db')]


class PushTokenPayload(BaseModel):
    push_token: str
    platform: str | None = None  # "android" | "ios"
    timezone: str | None = None  # IANA tz, e.g. "Asia/Manila"


@router.post("/push-token")
async def register_push_token(
    payload: PushTokenPayload,
    current_user: dict = Depends(get_current_user),
):
    """Register/update an Expo push token for the authenticated user."""
    if not is_valid_expo_token(payload.push_token):
        raise HTTPException(status_code=400, detail="Invalid Expo push token format")

    update_fields = {
        "push_token": payload.push_token,
        "push_token_updated_at": datetime.utcnow(),
    }
    if payload.platform:
        update_fields["push_token_platform"] = payload.platform
    if payload.timezone:
        update_fields["timezone"] = payload.timezone

    await db.users.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$set": update_fields},
    )
    logger.info(f"Push token registered for {current_user.get('email')} ({payload.platform})")
    return {"success": True}


@router.delete("/push-token")
async def unregister_push_token(current_user: dict = Depends(get_current_user)):
    """Remove the user's push token (called on logout)."""
    await db.users.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$unset": {"push_token": "", "push_token_platform": ""}},
    )
    return {"success": True}


class AdRewardPayload(BaseModel):
    network: str | None = None  # "admob"
    amount: int | None = None   # Network-reported reward amount (informational)


# Anti-fraud caps for the rewarded-video bonus.
REWARDED_BONUS_AMOUNT = 0.05            # $0.05 per ad
REWARDED_DAILY_CAP = 20                  # max 20 ads/user/day → $1.00 ceiling
REWARDED_MIN_INTERVAL_SECS = 25          # avoid double-credit if user spams the button


@router.post("/ad-reward")
async def claim_ad_reward(
    payload: AdRewardPayload,
    current_user: dict = Depends(get_current_user),
):
    """Credit the user $0.05 for watching a rewarded video ad.

    Server-enforced caps: 20/day per user, 25s minimum between credits.
    """
    user_id = ObjectId(current_user["_id"])
    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)

    # Daily cap check
    daily_count = await db.ad_rewards.count_documents({
        "user_id": str(user_id),
        "created_at": {"$gte": today_start},
    })
    if daily_count >= REWARDED_DAILY_CAP:
        raise HTTPException(
            status_code=429,
            detail=f"Daily rewarded-ad limit reached ({REWARDED_DAILY_CAP}/day). Come back tomorrow!",
        )

    # Throttle: no double-credit within 25 seconds
    latest = await db.ad_rewards.find_one(
        {"user_id": str(user_id)},
        sort=[("created_at", -1)],
    )
    if latest and (now - latest["created_at"]).total_seconds() < REWARDED_MIN_INTERVAL_SECS:
        raise HTTPException(
            status_code=429,
            detail="Please wait a few seconds before claiming another reward.",
        )

    # Credit the user
    await db.users.update_one(
        {"_id": user_id},
        {"$inc": {
            "earnings": REWARDED_BONUS_AMOUNT,
            "total_earned": REWARDED_BONUS_AMOUNT,
            "ad_rewards_earned": REWARDED_BONUS_AMOUNT,
        }},
    )

    # Audit ledger
    await db.ad_rewards.insert_one({
        "user_id": str(user_id),
        "amount": REWARDED_BONUS_AMOUNT,
        "network": payload.network or "admob",
        "network_amount": payload.amount,
        "created_at": now,
    })

    logger.info(f"Ad reward: ${REWARDED_BONUS_AMOUNT} → {current_user.get('email')}")

    refreshed = await db.users.find_one({"_id": user_id})
    return {
        "success": True,
        "amount": REWARDED_BONUS_AMOUNT,
        "new_balance": refreshed.get("earnings", 0.0),
        "daily_remaining": REWARDED_DAILY_CAP - daily_count - 1,
    }


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
