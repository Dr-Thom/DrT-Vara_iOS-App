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

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

# Get database connection
mongo_url = os.environ.get('MONGO_URL')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'vara_db')]

# Bonus economics
BONUS_AMOUNT = 1.0             # $1 USD bonus
FIRST_BONUS_AT = 5             # First bonus at task #5
RECURRING_BONUS_INTERVAL = 10  # Then every 10 tasks after (15, 25, 35...)

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
    """Mark task as completed and award earnings + bonus + referral payout."""
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
        
        # Compute rewards
        reward = float(task.get("reward_amount", 0.10))
        old_tasks_completed = user.get("tasks_completed", 0)
        new_tasks_completed = old_tasks_completed + 1
        
        # Bonus: $1 at task 5, then every 10 after
        old_bonus_count = compute_bonuses_earned(old_tasks_completed)
        new_bonus_count = compute_bonuses_earned(new_tasks_completed)
        bonus_delta = new_bonus_count - old_bonus_count  # 0 or 1
        bonus_this_call = bonus_delta * BONUS_AMOUNT
        
        total_reward_this_call = reward + bonus_this_call
        
        # Update user atomically
        await db.users.update_one(
            {"_id": user_id},
            {
                "$inc": {
                    "earnings": total_reward_this_call,
                    "total_earned": total_reward_this_call,
                    "tasks_completed": 1,
                    "bonuses_earned": bonus_delta,
                },
                "$set": {
                    "bonus_unlocked": new_tasks_completed >= FIRST_BONUS_AT,
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
        
        # Fetch refreshed user for accurate balance in response
        refreshed = await db.users.find_one({"_id": user_id})
        
        logger.info(
            f"User {user['email']} completed task '{task['title']}' - earned ${reward}"
            + (f" + ${bonus_this_call} bonus (#{new_bonus_count})" if bonus_this_call > 0 else "")
        )
        
        msg = f"Task completed! You earned ${reward:.2f}"
        if bonus_this_call > 0:
            msg += f" + ${bonus_this_call:.2f} bonus!"
        
        return TaskCompletionResponse(
            success=True,
            message=msg,
            reward_earned=total_reward_this_call,
            total_earnings=refreshed.get("earnings", 0.0),
            tasks_completed=new_tasks_completed,
            bonus_unlocked=new_tasks_completed >= FIRST_BONUS_AT,
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
