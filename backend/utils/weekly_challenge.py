"""Weekly referral challenge: Invite 3 qualified friends this week → $5 super bonus.

A referred user is "qualified" for a given week when the referrer receives their
FIRST referral payout from that friend during the week. When the qualifying count
hits 3, the referrer is credited a $5 super bonus (once per week).
"""
from datetime import datetime, timedelta, timezone
from typing import Optional
import logging
from bson import ObjectId

logger = logging.getLogger(__name__)

SUPER_BONUS_AMOUNT = 5.0
SUPER_BONUS_TARGET = 3  # Number of qualified friends needed per week


def week_start_utc(now: Optional[datetime] = None) -> datetime:
    """Return Monday 00:00 UTC for the given datetime (or now). Naive UTC datetime."""
    if now is None:
        now = datetime.now(timezone.utc)
    if now.tzinfo is not None:
        now = now.replace(tzinfo=None)
    start = datetime(now.year, now.month, now.day) - timedelta(days=now.weekday())
    return start


def week_end_utc(start: datetime) -> datetime:
    """Return end of week (Sunday 23:59:59.999999) given the week_start."""
    return start + timedelta(days=7) - timedelta(microseconds=1)


async def record_qualifying_referral(db, referrer_user_id: str, referred_user_id: str) -> dict:
    """Called from pay_referrer() whenever a referrer is paid. Adds the referred user
    to the referrer's weekly challenge set (dedup). If the count reaches the target
    and the super bonus hasn't been paid this week, credit it and mark paid.

    Returns: {
        'qualified_count': int,
        'super_bonus_paid_now': bool,
        'super_bonus_amount': float
    }
    """
    week_start = week_start_utc()
    filter_q = {"referrer_user_id": referrer_user_id, "week_start": week_start}

    # Atomically add the friend to the qualified set
    doc = await db.weekly_referral_challenges.find_one_and_update(
        filter_q,
        {
            "$addToSet": {"qualified_referreds": referred_user_id},
            "$setOnInsert": {
                "referrer_user_id": referrer_user_id,
                "week_start": week_start,
                "super_bonus_paid": False,
                "created_at": datetime.utcnow(),
            },
        },
        upsert=True,
        return_document=True,
    )
    if not doc:
        # In case find_one_and_update returned None (very rare); re-fetch
        doc = await db.weekly_referral_challenges.find_one(filter_q)

    qualified_count = len(doc.get("qualified_referreds", []))
    bonus_paid_now = False

    # Check if we just crossed the threshold
    if qualified_count >= SUPER_BONUS_TARGET and not doc.get("super_bonus_paid"):
        # Atomic "set if not paid" to avoid double-credit under concurrency
        result = await db.weekly_referral_challenges.update_one(
            {**filter_q, "super_bonus_paid": False},
            {"$set": {"super_bonus_paid": True, "super_bonus_paid_at": datetime.utcnow()}},
        )
        if result.modified_count == 1:
            # Credit the super bonus to the referrer
            await db.users.update_one(
                {"_id": ObjectId(referrer_user_id)},
                {"$inc": {
                    "earnings": SUPER_BONUS_AMOUNT,
                    "total_earned": SUPER_BONUS_AMOUNT,
                    "referral_earnings": SUPER_BONUS_AMOUNT,
                    "super_bonuses_earned": 1,
                }}
            )
            bonus_paid_now = True
            logger.info(
                f"Super bonus ${SUPER_BONUS_AMOUNT} credited to {referrer_user_id} "
                f"for week {week_start.isoformat()}"
            )

    return {
        "qualified_count": qualified_count,
        "super_bonus_paid_now": bonus_paid_now,
        "super_bonus_amount": SUPER_BONUS_AMOUNT,
    }


async def get_current_challenge(db, user_id: str) -> dict:
    """Return the current week's challenge status for a user."""
    week_start = week_start_utc()
    week_end = week_end_utc(week_start)
    doc = await db.weekly_referral_challenges.find_one(
        {"referrer_user_id": user_id, "week_start": week_start}
    )
    qualified_count = len(doc.get("qualified_referreds", [])) if doc else 0
    paid = bool(doc.get("super_bonus_paid")) if doc else False

    return {
        "target": SUPER_BONUS_TARGET,
        "super_bonus_amount": SUPER_BONUS_AMOUNT,
        "qualified_count": min(qualified_count, SUPER_BONUS_TARGET),
        "raw_qualified_count": qualified_count,
        "completed": paid,
        "week_start": week_start.isoformat() + "Z",
        "week_end": week_end.isoformat() + "Z",
    }
