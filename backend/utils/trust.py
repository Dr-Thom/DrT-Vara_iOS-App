"""Trust score system.

Starts at 50. Rises with positive actions (task completion, streaks, withdrawals).
Falls with negative signals (failed verification — future: VPN, multi-account, etc).

Tiers control withdrawal delay and access to premium tasks.
"""
from typing import Tuple

DEFAULT_TRUST_SCORE = 50
MIN_TRUST_SCORE = 0
MAX_TRUST_SCORE = 100

# Positive events
TRUST_PER_TASK = 1
TRUST_PER_7DAY_STREAK = 5
TRUST_PER_SUCCESSFUL_WITHDRAWAL = 2

# Negative events
TRUST_FAILED_WITHDRAWAL = -10
TRUST_FRAUD_FLAG = -20


def trust_tier(score: int) -> str:
    """Return 'trusted' | 'building' | 'low'."""
    if score >= 75:
        return "trusted"
    if score >= 50:
        return "building"
    return "low"


def withdrawal_delay_hours(score: int) -> int:
    """Hours before a withdrawal is processed based on trust score."""
    if score >= 75:
        return 0    # Instant
    if score >= 50:
        return 24
    return 48


def withdrawal_limits_usd(score: int) -> Tuple[float, float]:
    """(min_per_request, max_per_day) in USD based on trust."""
    if score >= 75:
        return (5.0, 100.0)
    if score >= 50:
        return (5.0, 25.0)
    return (5.0, 10.0)


def clamp_trust(score: int) -> int:
    return max(MIN_TRUST_SCORE, min(MAX_TRUST_SCORE, int(score)))
