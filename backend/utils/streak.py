"""Daily streak tracking + multiplier."""
from datetime import datetime, timedelta, date
from typing import Optional, Tuple

# Tiered multipliers: keep in sync with frontend
STREAK_TIERS = [
    (14, 1.5),
    (7, 1.25),
    (3, 1.1),
]


def streak_multiplier(streak_days: int) -> float:
    """Return the reward multiplier for a given consecutive-day streak."""
    for threshold, mult in STREAK_TIERS:
        if streak_days >= threshold:
            return mult
    return 1.0


def streak_tier_label(streak_days: int) -> str:
    if streak_days >= 14:
        return "blazing"
    if streak_days >= 7:
        return "hot"
    if streak_days >= 3:
        return "warming"
    return "none"


def _as_date(value) -> Optional[date]:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    return None


def update_streak_on_activity(
    last_active_date,
    current_streak: int,
    longest_streak: int,
    today: Optional[date] = None,
) -> Tuple[int, int, bool]:
    """Called when a user performs an earning action (e.g. task completion).

    Returns (new_current_streak, new_longest_streak, is_new_day)
    """
    if today is None:
        today = datetime.utcnow().date()
    last = _as_date(last_active_date)

    if last is None:
        new_streak = 1
        return new_streak, max(longest_streak, new_streak), True

    if last == today:
        # Already counted today; streak unchanged
        return current_streak, longest_streak, False

    if last == today - timedelta(days=1):
        new_streak = current_streak + 1
    else:
        # Gap — reset to 1
        new_streak = 1

    return new_streak, max(longest_streak, new_streak), True
