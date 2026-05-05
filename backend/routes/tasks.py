from fastapi import APIRouter, HTTPException, Depends
from models.task import TaskResponse, TaskCompletionRequest, TaskCompletionResponse
from routes.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
from typing import List
from datetime import datetime

from utils.weekly_challenge import record_qualifying_referral
from utils.economics import bonus_awarded_for_completion, next_bonus_milestone, bonuses_earned_count
from utils.streak import update_streak_on_activity, streak_multiplier, streak_tier_label
from utils.trust import TRUST_PER_TASK, TRUST_PER_7DAY_STREAK, clamp_trust
from utils.push import send_to_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

# Get database connection
mongo_url = os.environ.get('MONGO_URL')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'vara_db')]

# Kept for backwards compatibility (some tests import these)
BONUS_AMOUNT = 1.0
FIRST_BONUS_AT = 5
RECURRING_BONUS_INTERVAL = 10

# Referral economics
REFERRAL_PCT = 0.10            # Referrer earns 10% of referred user's earnings
REFERRAL_CAP = 10.0            # Capped at $10 per referred user (=10% of $100 first earnings)


def compute_bonuses_earned(tasks_completed: int) -> int:
    """How many $1 bonuses a user should have received at this task count.
    First bonus at 5, then every 10 after (15, 25, 35...).
    """
    if tasks_completed < FIRST_BONUS_AT:
        return 0
    return 1 + max(0, (tasks_completed - FIRST_BONUS_AT) // RECURRING_BONUS_INTERVAL)


async def pay_referrer(referred_user: dict, earned_amount: float) -> float:
    """Pay 10% of `earned_amount` to the referrer, capped at $10 lifetime per referred user.
    Returns the amount actually paid (0 if no referrer or cap reached).
    """
    referred_by_user_id = referred_user.get("referred_by_user_id")
    if not referred_by_user_id or earned_amount <= 0:
        return 0.0

    already_paid = referred_user.get("referrer_earnings_paid", 0.0)
    cap_remaining = max(0.0, REFERRAL_CAP - already_paid)
    if cap_remaining <= 0:
        return 0.0

    payout = min(earned_amount * REFERRAL_PCT, cap_remaining)
    payout = round(payout, 4)
    if payout <= 0:
        return 0.0

    # Credit the referrer
    await db.users.update_one(
        {"_id": ObjectId(referred_by_user_id)},
        {"$inc": {
            "earnings": payout,
            "total_earned": payout,
            "referral_earnings": payout,
        }}
    )
    # Track on the referred user
    await db.users.update_one(
        {"_id": referred_user["_id"]},
        {"$inc": {"referrer_earnings_paid": payout}}
    )
    # Ledger entry (for audit + feed)
    await db.referral_payouts.insert_one({
        "referrer_user_id": referred_by_user_id,
        "referred_user_id": str(referred_user["_id"]),
        "referred_email": referred_user.get("email"),
        "amount": payout,
        "triggered_by_earned": earned_amount,
        "created_at": datetime.utcnow(),
    })
    logger.info(f"Referral payout: ${payout} to user {referred_by_user_id} from {referred_user.get('email')}")

    # Push notification to the referrer (best-effort; never block)
    try:
        referred_email = referred_user.get("email", "your friend")
        # Mask the email (just show first 3 chars + domain)
        masked = referred_email
        if "@" in referred_email:
            local, dom = referred_email.split("@", 1)
            masked = (local[:3] + "***@" + dom) if len(local) > 3 else referred_email
        await send_to_user(
            db,
            referred_by_user_id,
            title="🎁 You just earned from a referral!",
            body=f"{masked} completed a task — you earned ${payout:.2f}",
            data={"type": "referral_payout", "amount": payout, "deepLink": "vara://referrals"},
        )
    except Exception as e:
        logger.error(f"Referral push notification failed (non-fatal): {e}")

    # Weekly challenge: record this referred user as a qualifying friend for the week
    try:
        await record_qualifying_referral(
            db,
            referrer_user_id=referred_by_user_id,
            referred_user_id=str(referred_user["_id"]),
        )
    except Exception as e:
        # Never let weekly-challenge errors block task completion
        logger.error(f"Weekly challenge update failed (non-fatal): {e}")

    return payout


@router.get("/", response_model=List[TaskResponse])
async def get_available_tasks(current_user: dict = Depends(get_current_user)):
    """Get list of available tasks for user"""
    try:
        user = await db.users.find_one({"_id": ObjectId(current_user["_id"])})
        completed_task_ids = user.get("completed_task_ids", [])
        
        tasks = await db.tasks.find({
            "is_active": True,
            "_id": {"$nin": [ObjectId(tid) for tid in completed_task_ids if ObjectId.is_valid(tid)]}
        }).to_list(100)
        
        for task in tasks:
            task["_id"] = str(task["_id"])
        
        return tasks
        
    except Exception as e:
        logger.error(f"Error fetching tasks: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch tasks")

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str, current_user: dict = Depends(get_current_user)):
    """Get specific task details"""
    try:
        if not ObjectId.is_valid(task_id):
            raise HTTPException(status_code=400, detail="Invalid task ID")
        
        task = await db.tasks.find_one({"_id": ObjectId(task_id)})
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        task["_id"] = str(task["_id"])
        return task
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching task: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch task")

@router.post("/complete", response_model=TaskCompletionResponse)
async def complete_task(
    completion: TaskCompletionRequest,
    current_user: dict = Depends(get_current_user)
):
    """Mark task as completed and award earnings + bonus + referral payout + streak + trust."""
    try:
        if not ObjectId.is_valid(completion.task_id):
            raise HTTPException(status_code=400, detail="Invalid task ID")

        task_id = ObjectId(completion.task_id)
        user_id = ObjectId(current_user["_id"])

        task = await db.tasks.find_one({"_id": task_id})
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        if not task.get("is_active", True):
            raise HTTPException(status_code=400, detail="Task is no longer active")

        user = await db.users.find_one({"_id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Check if task already completed
        completed_task_ids = user.get("completed_task_ids", [])
        if str(task_id) in completed_task_ids:
            raise HTTPException(status_code=400, detail="Task already completed")

        # Base reward
        base_reward = float(task.get("reward_amount", 0.10))
        old_tasks_completed = user.get("tasks_completed", 0)
        new_tasks_completed = old_tasks_completed + 1

        # STREAK — compute BEFORE reward (so today's multiplier reflects current streak)
        today = datetime.utcnow().date()
        new_streak, new_longest, is_new_day = update_streak_on_activity(
            user.get("last_active_date"),
            user.get("current_streak", 0),
            user.get("longest_streak", 0),
            today=today,
        )
        multiplier = streak_multiplier(new_streak)
        # Apply multiplier to task reward (but NOT to milestone bonuses — keeps bonuses predictable)
        reward = round(base_reward * multiplier, 4)

        # BONUS LADDER — new formula: 5→$1, 10→$2, 25→$5, 50→$10, 100→$25, then $25/100
        bonus_this_call = bonus_awarded_for_completion(new_tasks_completed)
        new_bonuses_earned_total = bonuses_earned_count(new_tasks_completed)
        total_reward_this_call = round(reward + bonus_this_call, 4)

        # TRUST — +1 per task; +5 bonus on crossing into 7-day streak
        trust_delta = TRUST_PER_TASK
        if new_streak == 7 and user.get("current_streak", 0) < 7:
            trust_delta += TRUST_PER_7DAY_STREAK
        old_trust = user.get("trust_score", 50)
        new_trust = clamp_trust(old_trust + trust_delta)
        trust_gained = new_trust - old_trust

        # Update user atomically
        await db.users.update_one(
            {"_id": user_id},
            {
                "$inc": {
                    "earnings": total_reward_this_call,
                    "total_earned": total_reward_this_call,
                    "tasks_completed": 1,
                },
                "$set": {
                    "bonus_unlocked": new_tasks_completed >= 5,
                    "bonuses_earned": new_bonuses_earned_total,
                    "current_streak": new_streak,
                    "longest_streak": new_longest,
                    "last_active_date": datetime(today.year, today.month, today.day),
                    "trust_score": new_trust,
                },
                "$push": {
                    "completed_task_ids": str(task_id)
                }
            }
        )

        # Increment task completion count (global)
        await db.tasks.update_one(
            {"_id": task_id},
            {"$inc": {"completion_count": 1}}
        )

        # Pay referrer 10% of the total earned on this call (capped at $10 per referred user)
        await pay_referrer(user, total_reward_this_call)

        # Push notification when a milestone bonus unlocks (best-effort)
        if bonus_this_call > 0:
            try:
                await send_to_user(
                    db,
                    str(user_id),
                    title=f"🎉 Bonus unlocked: ${bonus_this_call:.0f}!",
                    body=f"You hit task #{new_tasks_completed} and earned a ${bonus_this_call:.0f} bonus.",
                    data={
                        "type": "bonus_unlock",
                        "amount": bonus_this_call,
                        "deepLink": "vara://dashboard",
                    },
                )
            except Exception as e:
                logger.error(f"Bonus push notification failed (non-fatal): {e}")

        # Fetch refreshed user for accurate balance in response
        refreshed = await db.users.find_one({"_id": user_id})

        logger.info(
            f"User {user['email']} completed task '{task['title']}' — "
            f"${reward:.4f} ({multiplier}x) "
            + (f"+ ${bonus_this_call} bonus " if bonus_this_call > 0 else "")
            + (f"+ {trust_gained} trust " if trust_gained > 0 else "")
            + (f"(streak: {new_streak} days)" if new_streak > 1 else "")
        )

        msg_parts = [f"You earned ${reward:.2f}"]
        if multiplier > 1.0:
            msg_parts[0] += f" ({streak_tier_label(new_streak)} {multiplier}x streak!)"
        if bonus_this_call > 0:
            msg_parts.append(f"+ ${bonus_this_call:.0f} milestone bonus!")
        msg = " ".join(msg_parts)

        return TaskCompletionResponse(
            success=True,
            message=msg,
            reward_earned=total_reward_this_call,
            total_earnings=refreshed.get("earnings", 0.0),
            tasks_completed=new_tasks_completed,
            bonus_unlocked=new_tasks_completed >= 5,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error completing task: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to complete task")

@router.get("/completed/list")
async def get_completed_tasks(current_user: dict = Depends(get_current_user)):
    """Get list of tasks completed by user"""
    try:
        user = await db.users.find_one({"_id": ObjectId(current_user["_id"])})
        completed_task_ids = user.get("completed_task_ids", [])
        
        if not completed_task_ids:
            return []
        
        tasks = await db.tasks.find({
            "_id": {"$in": [ObjectId(tid) for tid in completed_task_ids if ObjectId.is_valid(tid)]}
        }).to_list(100)
        
        for task in tasks:
            task["_id"] = str(task["_id"])
        
        return tasks
        
    except Exception as e:
        logger.error(f"Error fetching completed tasks: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch completed tasks")
