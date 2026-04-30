"""VARA earnings economics — source of truth for bonus milestones and streak multipliers.
Keep in sync with /app/frontend/src/config/economics.js and /app/mobile/config.js
"""

# ============================================================
# BONUS LADDER
# ============================================================
# Milestones awarded when tasks_completed reaches this exact number.
# After the last milestone, a $25 bonus is awarded every additional 100 tasks.
BONUS_MILESTONES = [
    (5, 1.0),
    (10, 2.0),
    (25, 5.0),
    (50, 10.0),
    (100, 25.0),
]

RECURRING_BONUS_AFTER_LAST = {"interval": 100, "amount": 25.0}


def total_bonuses_earned(tasks_completed: int) -> float:
    """Total bonus $ the user should have received after completing N tasks."""
    total = 0.0
    for threshold, amount in BONUS_MILESTONES:
        if tasks_completed >= threshold:
            total += amount
    last_threshold, _ = BONUS_MILESTONES[-1]
    if tasks_completed > last_threshold:
        extra = (tasks_completed - last_threshold) // RECURRING_BONUS_AFTER_LAST["interval"]
        total += RECURRING_BONUS_AFTER_LAST["amount"] * extra
    return round(total, 2)


def bonus_awarded_for_completion(new_task_count: int) -> float:
    """Bonus $ awarded EXACTLY upon completing task #new_task_count. 0 if none."""
    for threshold, amount in BONUS_MILESTONES:
        if new_task_count == threshold:
            return amount
    last_threshold, _ = BONUS_MILESTONES[-1]
    if new_task_count > last_threshold and (new_task_count - last_threshold) % RECURRING_BONUS_AFTER_LAST["interval"] == 0:
        return RECURRING_BONUS_AFTER_LAST["amount"]
    return 0.0


def next_bonus_milestone(tasks_completed: int) -> dict:
    """Return {threshold, amount} for the NEXT bonus the user can unlock."""
    for threshold, amount in BONUS_MILESTONES:
        if tasks_completed < threshold:
            return {"threshold": threshold, "amount": amount}
    last_threshold, _ = BONUS_MILESTONES[-1]
    interval = RECURRING_BONUS_AFTER_LAST["interval"]
    next_threshold = ((tasks_completed // interval) + 1) * interval
    return {"threshold": next_threshold, "amount": RECURRING_BONUS_AFTER_LAST["amount"]}


def bonuses_earned_count(tasks_completed: int) -> int:
    """How many discrete bonus drops the user has received."""
    count = 0
    for threshold, _ in BONUS_MILESTONES:
        if tasks_completed >= threshold:
            count += 1
    last_threshold, _ = BONUS_MILESTONES[-1]
    if tasks_completed > last_threshold:
        count += (tasks_completed - last_threshold) // RECURRING_BONUS_AFTER_LAST["interval"]
    return count
