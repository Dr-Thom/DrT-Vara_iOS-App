"""
Background notification scheduler.

Runs two recurring jobs:
  • Daily streak reminder — every hour on the hour, find users whose local time is
    18:00 (their stored timezone or UTC fallback), have an active streak ≥ 1, and
    haven't completed a task today. Ping them.
  • Weekly Super Bonus reset — Mondays 09:00 UTC, broadcast a "new week!" push to
    everyone who hasn't qualified yet.

Single-process design (works fine on this single FastAPI worker).
"""
from __future__ import annotations
import logging
from datetime import datetime, timedelta, timezone

import pytz
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from utils.push import send_push

logger = logging.getLogger(__name__)


async def daily_streak_reminder_job(db) -> None:
    """Hourly: find users whose local hour == 18 with an at-risk streak."""
    now_utc = datetime.now(timezone.utc)

    # Yesterday cutoff for "haven't been active today"
    today_utc = datetime(now_utc.year, now_utc.month, now_utc.day, tzinfo=timezone.utc)

    cursor = db.users.find(
        {
            "push_token": {"$exists": True, "$ne": None},
            "current_streak": {"$gte": 1},
        },
        {"push_token": 1, "current_streak": 1, "timezone": 1, "last_active_date": 1},
    )

    tokens_to_send: list[tuple[str, int]] = []  # (token, streak_days)
    async for u in cursor:
        tz_name = u.get("timezone") or "UTC"
        try:
            tz = pytz.timezone(tz_name)
        except Exception:
            tz = pytz.UTC

        local = now_utc.astimezone(tz)
        if local.hour != 18:  # only at 6pm local
            continue

        # Skip if already active today (UTC date comparison – good enough)
        last = u.get("last_active_date")
        if last and last.replace(tzinfo=timezone.utc) >= today_utc:
            continue

        tokens_to_send.append((u["push_token"], int(u.get("current_streak", 0))))

    if not tokens_to_send:
        return

    # Group by streak days so the body matches; usually small set
    grouped: dict[int, list[str]] = {}
    for tok, days in tokens_to_send:
        grouped.setdefault(days, []).append(tok)

    total_sent = 0
    for days, toks in grouped.items():
        result = await send_push(
            db,
            tokens=toks,
            title=f"🔥 Don't break your {days}-day streak!",
            body="Complete just 1 task today to keep your streak alive.",
            data={"type": "streak_reminder", "streak_days": days, "deepLink": "vara://tasks"},
        )
        total_sent += result.get("sent", 0)
    logger.info(f"Streak reminders fired: {total_sent} delivered")


async def weekly_super_bonus_reset_job(db) -> None:
    """Monday 09:00 UTC: nudge users to chase the weekly $5 super bonus."""
    cursor = db.users.find(
        {"push_token": {"$exists": True, "$ne": None}},
        {"push_token": 1},
    )
    tokens: list[str] = [u["push_token"] async for u in cursor if u.get("push_token")]
    if not tokens:
        return
    result = await send_push(
        db,
        tokens=tokens,
        title="🚀 New week — $5 Super Bonus is back!",
        body="Invite 3 friends who complete 1 task this week to unlock $5.",
        data={"type": "weekly_super_bonus", "deepLink": "vara://referrals"},
    )
    logger.info(f"Weekly super bonus blast: {result}")


def start_scheduler(db) -> AsyncIOScheduler:
    """Create + start the scheduler. Returns it so caller can shut it down."""
    sched = AsyncIOScheduler(timezone="UTC")

    sched.add_job(
        daily_streak_reminder_job,
        trigger="cron",
        minute=0,  # every hour on the hour
        args=[db],
        id="streak_reminder_hourly",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
    )
    sched.add_job(
        weekly_super_bonus_reset_job,
        trigger="cron",
        day_of_week="mon",
        hour=9,
        minute=0,
        args=[db],
        id="weekly_super_bonus_reset",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
    )

    sched.start()
    logger.info("Notification scheduler started (streak hourly, weekly Mon 09:00 UTC)")
    return sched
