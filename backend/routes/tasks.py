from fastapi import APIRouter, HTTPException, Depends
from models.task import TaskResponse, TaskCompletionRequest, TaskCompletionResponse
from routes.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
from typing import List

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

# Get database connection
mongo_url = os.environ.get('MONGO_URL')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'vara_db')]

BONUS_AMOUNT = 2.0  # $2 USD bonus
TASKS_REQUIRED_FOR_BONUS = 5

@router.get("/", response_model=List[TaskResponse])
async def get_available_tasks(current_user: dict = Depends(get_current_user)):
    """Get list of available tasks for user"""
    try:
        # Get user's completed task IDs
        user = await db.users.find_one({"_id": ObjectId(current_user["_id"])})
        completed_task_ids = user.get("completed_task_ids", [])
        
        # Get all active tasks that user hasn't completed
        tasks = await db.tasks.find({
            "is_active": True,
            "_id": {"$nin": [ObjectId(tid) for tid in completed_task_ids if ObjectId.is_valid(tid)]}
        }).to_list(100)
        
        # Convert ObjectId to string
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
    """Mark task as completed and award earnings"""
    try:
        if not ObjectId.is_valid(completion.task_id):
            raise HTTPException(status_code=400, detail="Invalid task ID")
        
        task_id = ObjectId(completion.task_id)
        user_id = ObjectId(current_user["_id"])
        
        # Get task
        task = await db.tasks.find_one({"_id": task_id})
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        if not task.get("is_active", True):
            raise HTTPException(status_code=400, detail="Task is no longer active")
        
        # Get user
        user = await db.users.find_one({"_id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if task already completed
        completed_task_ids = user.get("completed_task_ids", [])
        if str(task_id) in completed_task_ids:
            raise HTTPException(status_code=400, detail="Task already completed")
        
        # Update user: add earnings, increment tasks_completed, add to completed_task_ids
        current_earnings = user.get("earnings", 0.0)
        current_tasks_completed = user.get("tasks_completed", 0)
        reward = task.get("reward_amount", 0.5)
        
        new_tasks_completed = current_tasks_completed + 1
        new_earnings = current_earnings + reward
        
        # Check if bonus should be unlocked
        bonus_unlocked = user.get("bonus_unlocked", False)
        if not bonus_unlocked and new_tasks_completed >= TASKS_REQUIRED_FOR_BONUS:
            bonus_unlocked = True
            new_earnings += BONUS_AMOUNT
            logger.info(f"User {user['email']} unlocked $2 bonus!")
        
        # Update user document
        await db.users.update_one(
            {"_id": user_id},
            {
                "$set": {
                    "earnings": new_earnings,
                    "total_earned": user.get("total_earned", 0.0) + reward + (BONUS_AMOUNT if (bonus_unlocked and not user.get("bonus_unlocked")) else 0),
                    "tasks_completed": new_tasks_completed,
                    "bonus_unlocked": bonus_unlocked
                },
                "$push": {
                    "completed_task_ids": str(task_id)
                }
            }
        )
        
        # Increment task completion count
        await db.tasks.update_one(
            {"_id": task_id},
            {"$inc": {"completion_count": 1}}
        )
        
        logger.info(f"User {user['email']} completed task {task['title']} - earned ${reward}")
        
        return TaskCompletionResponse(
            success=True,
            message=f"Task completed! You earned ${reward}" + (f" + ${BONUS_AMOUNT} bonus!" if (bonus_unlocked and not user.get("bonus_unlocked")) else ""),
            reward_earned=reward + (BONUS_AMOUNT if (bonus_unlocked and not user.get("bonus_unlocked")) else 0),
            total_earnings=new_earnings,
            tasks_completed=new_tasks_completed,
            bonus_unlocked=bonus_unlocked
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
        
        # Get task details
        tasks = await db.tasks.find({
            "_id": {"$in": [ObjectId(tid) for tid in completed_task_ids if ObjectId.is_valid(tid)]}
        }).to_list(100)
        
        for task in tasks:
            task["_id"] = str(task["_id"])
        
        return tasks
        
    except Exception as e:
        logger.error(f"Error fetching completed tasks: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch completed tasks")
