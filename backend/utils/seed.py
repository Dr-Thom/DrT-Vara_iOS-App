import os
import logging
from utils.auth import hash_password, verify_password
from datetime import datetime

logger = logging.getLogger(__name__)

async def seed_admin(db):
    """Seed admin user"""
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@vara.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "vara_admin_2026")
    
    existing = await db.users.find_one({"email": admin_email})
    
    if existing is None:
        hashed = hash_password(admin_password)
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hashed,
            "name": "Admin",
            "role": "admin",
            "earnings": 0.0,
            "total_earned": 0.0,
            "total_withdrawn": 0.0,
            "tasks_completed": 0,
            "bonus_unlocked": False,
            "completed_task_ids": [],
            "created_at": datetime.utcnow()
        })
        logger.info(f"Admin user created: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}}
        )
        logger.info(f"Admin password updated: {admin_email}")

async def seed_tasks(db):
    """Seed simple thought-based tasks"""
    # Always delete and reseed for updates
    await db.tasks.delete_many({})
    logger.info("Reseeding tasks with simple thought-based tasks...")
    
    tasks = [
        {
            "title": "Quick Opinion: Online Shopping",
            "description": "Think: What do you like most about online shopping? (Just think of your answer, then click Mark as Complete)",
            "task_type": "survey",
            "reward_amount": 0.50,
            "estimated_time": 1,
            "verification_type": "self_reported",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "completion_count": 0
        },
        {
            "title": "Your Favorite App",
            "description": "Think: What's your most-used mobile app and why? (Think about it, then click complete)",
            "task_type": "survey",
            "reward_amount": 0.30,
            "estimated_time": 1,
            "verification_type": "self_reported",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "completion_count": 0
        },
        {
            "title": "What Would You Do With $100?",
            "description": "If you earned an extra $100 this month, what would you spend it on? (Think of your answer)",
            "task_type": "data_entry",
            "reward_amount": 0.40,
            "estimated_time": 1,
            "verification_type": "self_reported",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "completion_count": 0
        },
        {
            "title": "Rate Your Day (1-10)",
            "description": "On a scale of 1-10, how would you rate your day today? (Think of your rating)",
            "task_type": "quiz",
            "reward_amount": 0.25,
            "estimated_time": 1,
            "verification_type": "self_reported",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "completion_count": 0
        },
        {
            "title": "Best Time to Work?",
            "description": "When do you prefer to work or earn money: Morning, Afternoon, or Evening?",
            "task_type": "survey",
            "reward_amount": 0.20,
            "estimated_time": 1,
            "verification_type": "self_reported",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "completion_count": 0
        },
        {
            "title": "Your Dream Job",
            "description": "What's your dream job or career? (Think about it)",
            "task_type": "data_entry",
            "reward_amount": 0.35,
            "estimated_time": 1,
            "verification_type": "self_reported",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "completion_count": 0
        },
        {
            "title": "Favorite Filipino Food",
            "description": "What's your favorite Filipino dish? (Think of it)",
            "task_type": "survey",
            "reward_amount": 0.30,
            "estimated_time": 1,
            "verification_type": "self_reported",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "completion_count": 0
        },
        {
            "title": "3 Ways You Use Your Phone",
            "description": "Think of 3 things you use your phone for daily (e.g., messaging, photos, banking)",
            "task_type": "data_entry",
            "reward_amount": 0.35,
            "estimated_time": 1,
            "verification_type": "self_reported",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "completion_count": 0
        },
        {
            "title": "Complete: I Feel Happy When...",
            "description": "Finish this sentence in your mind: 'I feel happy when...'",
            "task_type": "data_entry",
            "reward_amount": 0.25,
            "estimated_time": 1,
            "verification_type": "self_reported",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "completion_count": 0
        },
        {
            "title": "Biggest Goal This Year?",
            "description": "What's your biggest goal or dream for this year?",
            "task_type": "survey",
            "reward_amount": 0.30,
            "estimated_time": 1,
            "verification_type": "self_reported",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "completion_count": 0
        },
        {
            "title": "If You Could Learn Anything...",
            "description": "If you could learn any skill for free, what would it be?",
            "task_type": "survey",
            "reward_amount": 0.30,
            "estimated_time": 1,
            "verification_type": "self_reported",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "completion_count": 0
        },
        {
            "title": "Your Favorite Season",
            "description": "What's your favorite time of year and why?",
            "task_type": "survey",
            "reward_amount": 0.25,
            "estimated_time": 1,
            "verification_type": "self_reported",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "completion_count": 0
        },
        {
            "title": "Best Purchase Under ₱500",
            "description": "What's the best thing you've bought for under ₱500?",
            "task_type": "survey",
            "reward_amount": 0.30,
            "estimated_time": 1,
            "verification_type": "self_reported",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "completion_count": 0
        },
        {
            "title": "Where Would You Travel?",
            "description": "If you could travel anywhere for free, where would you go?",
            "task_type": "survey",
            "reward_amount": 0.35,
            "estimated_time": 1,
            "verification_type": "self_reported",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "completion_count": 0
        },
        {
            "title": "Simple Math: 47 + 28",
            "description": "What is 47 + 28? (Calculate in your head)",
            "task_type": "quiz",
            "reward_amount": 0.20,
            "estimated_time": 1,
            "verification_type": "self_reported",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "completion_count": 0
        }
    ]
    
    result = await db.tasks.insert_many(tasks)
    logger.info(f"Seeded {len(result.inserted_ids)} simple tasks")
