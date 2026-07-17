"""User stats — progression data for dashboard UI."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from routes.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from datetime import datetime
import os
import logging

from utils.economics import (
    next_bonus_milestone,
    next_super_bonus_milestone,
    bonuses_earned_count,
    super_bonuses_earned_count,
    BONUS_INTERVAL,
    BONUS_AMOUNT,
    SUPER_BONUS_INTERVAL,
    SUPER_BONUS_AMOUNT,
    MIN_CASH_OUT,
    REFERRAL_GOAL,
    REFERRAL_BONUS,
    TASK_REWARD,
)
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

# Compliance kill-switch — set REWARDED_ADS_ENABLED=true on Render only when
# the app is out of Closed Testing AND AdMob has approved a compliant reward
# model (i.e. rewarded ads no longer credit withdrawable cash).
#
# Google AdMob policy prohibits crediting rewarded ads with real-world
# compensation (cash, cash-equivalents, gift cards, crypto). Because the
# `earnings` field on the User document is the same balance used for cash
# withdrawal, crediting it from a rewarded ad is a policy violation.
# Default: disabled.
REWARDED_ADS_ENABLED = os.environ.get("REWARDED_ADS_ENABLED", "false").lower() == "true"


def log_ad_reward_compliance_state() -> None:
    """Emit the compliance kill-switch state to the app log.

    Called from server.py's @app.on_event('startup') so it lands in Render/
    supervisor logs (module-import-time logging is dropped before uvicorn
    installs its handlers).
    """
    logger.info(
        f"[SAMSON compliance] REWARDED_ADS_ENABLED={REWARDED_ADS_ENABLED} "
        f"(reward endpoint {'ACTIVE' if REWARDED_ADS_ENABLED else 'DISABLED - returns 410 Gone'})"
    )


@router.post("/ad-reward")
async def claim_ad_reward(
    payload: AdRewardPayload,
    current_user: dict = Depends(get_current_user),
):
    """Credit the user for watching a rewarded video ad.

    Guarded by REWARDED_ADS_ENABLED compliance kill-switch. While disabled
    (default), returns HTTP 410 Gone with a clear AdMob-policy message so
    the mobile client can render the correct state.

    Server-enforced caps when enabled: 20/day per user, 25s minimum between
    credits.
    """
    if not REWARDED_ADS_ENABLED:
        logger.info(
            f"ad-reward rejected (compliance): user={current_user.get('email')} "
            f"network={payload.network!r}"
        )
        raise HTTPException(
            status_code=410,
            detail=(
                "Rewarded ad crediting is temporarily disabled to comply with "
                "Google AdMob's incentivized-traffic policy. No cash reward will "
                "be credited for this ad view."
            ),
        )

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
    """Legacy progression stats endpoint (kept for backwards compatibility)."""
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
        },
    }


@router.get("/me/dashboard")
async def get_dashboard(current_user: dict = Depends(get_current_user)):
    """Single endpoint returning all data needed for the new dashboard.

    Spec-aligned response with cards: balance, today's earnings, next bonus,
    super bonus, daily goal, streak, account status, referrals progress.
    """
    user = await db.users.find_one({"_id": ObjectId(current_user["_id"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user_id = user["_id"]
    tasks_completed = user.get("tasks_completed", 0)
    streak = user.get("current_streak", 0)
    trust = user.get("trust_score", 50)

    # Balance & cash-out
    available_balance = round(user.get("earnings", 0.0), 2)
    lifetime_earnings = round(user.get("total_earned", 0.0), 2)
    total_withdrawn = round(user.get("total_withdrawn", 0.0), 2)
    next_cash_out_remaining = round(max(0.0, MIN_CASH_OUT - available_balance), 2)

    # Today's earnings — reset to 0 if daily_earnings_date is not today
    now = datetime.utcnow()
    today = datetime(now.year, now.month, now.day)
    daily_date = user.get("daily_earnings_date")
    if daily_date and daily_date.date() == today.date():
        todays_earnings = round(user.get("daily_earnings_today", 0.0), 2)
        todays_tasks = user.get("daily_tasks_today", 0)
    else:
        todays_earnings = 0.0
        todays_tasks = 0

    # Bonus progress (within current 5-task cycle)
    bonus = next_bonus_milestone(tasks_completed)
    super_bonus = next_super_bonus_milestone(tasks_completed)

    # Streak & tomorrow's multiplier (streak+1 if completed at least 1 task today, else streak)
    tomorrows_streak = streak + 1 if todays_tasks == 0 else streak
    tomorrows_multiplier = streak_multiplier(tomorrows_streak)

    # Account status
    account_verified = bool(user.get("email"))  # If they have email + account, they're verified
    instant_cashout = trust >= 75

    # Referrals: count of QUALIFIED referrals (referred users who completed at least 1 task)
    qualified_referrals = await db.users.count_documents({
        "referred_by_user_id": str(user_id),
        "tasks_completed": {"$gte": 1},
    })
    referrals_complete = qualified_referrals >= REFERRAL_GOAL
    referral_bonus_paid = bool(user.get("referral_goal_bonus_paid", False))

    # Award the $10 referral bonus if not already paid
    if referrals_complete and not referral_bonus_paid:
        await db.users.update_one(
            {"_id": user_id},
            {
                "$inc": {
                    "earnings": REFERRAL_BONUS,
                    "total_earned": REFERRAL_BONUS,
                    "referral_earnings": REFERRAL_BONUS,
                },
                "$set": {"referral_goal_bonus_paid": True},
            },
        )
        available_balance += REFERRAL_BONUS
        lifetime_earnings += REFERRAL_BONUS
        referral_bonus_paid = True

    return {
        "balance": {
            "available": available_balance,
            "lifetime_earnings": lifetime_earnings,
            "total_withdrawn": total_withdrawn,
            "next_cash_out_remaining": next_cash_out_remaining,
            "min_cash_out": MIN_CASH_OUT,
        },
        "today": {
            "earnings": todays_earnings,
            "tasks_completed": todays_tasks,
            "goal_tasks": 5,
            "goal_reward": round(5 * TASK_REWARD, 2),
        },
        "next_bonus": {
            "amount": bonus["amount"],
            "cycle_size": bonus["cycle_size"],
            "in_cycle": bonus["in_cycle"],
            "remaining": bonus["remaining"],
            "threshold": bonus["threshold"],
        },
        "super_bonus": {
            "amount": super_bonus["amount"],
            "cycle_size": super_bonus["cycle_size"],
            "in_cycle": super_bonus["in_cycle"],
            "remaining": super_bonus["remaining"],
            "threshold": super_bonus["threshold"],
        },
        "streak": {
            "current": streak,
            "longest": user.get("longest_streak", 0),
            "current_multiplier": streak_multiplier(streak),
            "tomorrows_multiplier": tomorrows_multiplier,
            "completed_task_today": todays_tasks > 0,
        },
        "account_status": {
            "verified": account_verified,
            "instant_cash_out_eligible": instant_cashout,
            "trust_score": trust,
            "trust_tier": trust_tier(trust),
        },
        "referrals": {
            "qualified_count": qualified_referrals,
            "goal": REFERRAL_GOAL,
            "bonus_amount": REFERRAL_BONUS,
            "bonus_paid": referral_bonus_paid,
            "referral_code": user.get("referral_code"),
        },
        "totals": {
            "tasks_completed": tasks_completed,
            "bonuses_earned": bonuses_earned_count(tasks_completed),
            "super_bonuses_earned": super_bonuses_earned_count(tasks_completed),
        },
        "rewards": {
            "task_reward": TASK_REWARD,
            "bonus_amount": BONUS_AMOUNT,
            "bonus_interval": BONUS_INTERVAL,
            "super_bonus_amount": SUPER_BONUS_AMOUNT,
            "super_bonus_interval": SUPER_BONUS_INTERVAL,
            "min_cash_out": MIN_CASH_OUT,
            "rewarded_video_bonus": 0.05,
        },
    }
