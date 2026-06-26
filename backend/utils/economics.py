"""SAMSON earnings economics — source of truth for bonus + super bonus rewards.
Keep in sync with /app/mobile/config.js

SPEC (Beta MVP):
  • Task reward: $0.10 per completed task
  • Bonus: $1 awarded every 5 completed tasks (recurring, resets every cycle)
  • Super Bonus: $10 awarded every 25 completed tasks (recurring, resets every cycle)
  • Minimum cash-out: $5.00
"""

# ============================================================
# CONSTANTS — source of truth
# ============================================================
TASK_REWARD = 0.10           # $ per completed task
BONUS_INTERVAL = 5           # Every 5 tasks → $1 bonus
BONUS_AMOUNT = 1.0           # $1 per bonus cycle
SUPER_BONUS_INTERVAL = 25    # Every 25 tasks → $10 super bonus
SUPER_BONUS_AMOUNT = 10.0    # $10 per super bonus cycle
MIN_CASH_OUT = 5.0           # $5 minimum withdrawal

REFERRAL_GOAL = 3            # 3 qualified referrals
REFERRAL_BONUS = 10.0        # $10 awarded when 3 qualified referrals reached


def bonus_awarded_for_completion(new_task_count: int) -> float:
    """Standard $1 bonus awarded EXACTLY when task count hits a multiple of 5.
    Does NOT include the super bonus (see super_bonus_awarded_for_completion).
    """
    if new_task_count > 0 and new_task_count % BONUS_INTERVAL == 0:
        return BONUS_AMOUNT
    return 0.0


def super_bonus_awarded_for_completion(new_task_count: int) -> float:
    """$10 super bonus awarded EXACTLY when task count hits a multiple of 25."""
    if new_task_count > 0 and new_task_count % SUPER_BONUS_INTERVAL == 0:
        return SUPER_BONUS_AMOUNT
    return 0.0


def total_bonuses_earned(tasks_completed: int) -> float:
    """Total $ from $1 bonuses across all completed cycles."""
    return round((tasks_completed // BONUS_INTERVAL) * BONUS_AMOUNT, 2)


def total_super_bonuses_earned(tasks_completed: int) -> float:
    """Total $ from $10 super bonuses across all completed cycles."""
    return round((tasks_completed // SUPER_BONUS_INTERVAL) * SUPER_BONUS_AMOUNT, 2)


def bonuses_earned_count(tasks_completed: int) -> int:
    """How many discrete $1 bonus drops the user has received."""
    return tasks_completed // BONUS_INTERVAL


def super_bonuses_earned_count(tasks_completed: int) -> int:
    """How many discrete $10 super bonus drops the user has received."""
    return tasks_completed // SUPER_BONUS_INTERVAL


def next_bonus_milestone(tasks_completed: int) -> dict:
    """Next $1 bonus target — always within the current 5-task cycle."""
    cycle_position = tasks_completed % BONUS_INTERVAL
    threshold = tasks_completed + (BONUS_INTERVAL - cycle_position) if cycle_position > 0 else tasks_completed + BONUS_INTERVAL
    return {
        "threshold": threshold,
        "amount": BONUS_AMOUNT,
        "in_cycle": cycle_position,
        "remaining": BONUS_INTERVAL - cycle_position if cycle_position > 0 else BONUS_INTERVAL,
        "cycle_size": BONUS_INTERVAL,
    }


def next_super_bonus_milestone(tasks_completed: int) -> dict:
    """Next $10 super bonus target — always within the current 25-task cycle."""
    cycle_position = tasks_completed % SUPER_BONUS_INTERVAL
    threshold = tasks_completed + (SUPER_BONUS_INTERVAL - cycle_position) if cycle_position > 0 else tasks_completed + SUPER_BONUS_INTERVAL
    return {
        "threshold": threshold,
        "amount": SUPER_BONUS_AMOUNT,
        "in_cycle": cycle_position,
        "remaining": SUPER_BONUS_INTERVAL - cycle_position if cycle_position > 0 else SUPER_BONUS_INTERVAL,
        "cycle_size": SUPER_BONUS_INTERVAL,
    }
