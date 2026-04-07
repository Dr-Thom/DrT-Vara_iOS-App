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
    
    # Write credentials to test file
    with open("/app/memory/test_credentials.md", "a") as f:
        f.write(f"\n\n## VARA App Credentials (Updated {datetime.utcnow().strftime('%Y-%m-%d %H:%M')})\n")
        f.write(f"**Admin:** {admin_email} / {admin_password}\n")
        f.write(f"**Test User:** tester1@example.com / test123\n")

async def seed_tasks(db):
    """Seed initial tasks"""
    # Check if tasks already exist
    existing_count = await db.tasks.count_documents({})
    if existing_count > 0:
        logger.info(f"Tasks already seeded ({existing_count} tasks found)")
        return
    
    tasks = [
        # Surveys
        {
            "title": "Quick Opinion Survey - 5 Minutes",
            "description": "Share your thoughts on mobile apps in this quick 5-minute survey.",
            "task_type": "survey",
            "reward_amount": 0.50,
            "estimated_time": 5,
            "verification_type": "self_reported",
            "is_active": True,
            "survey_url": "https://forms.gle/example1",
            "created_at": datetime.utcnow(),
            "completion_count": 0
        },
        {
            "title": "Shopping Habits Survey",
            "description": "Tell us about your online shopping preferences (10 minutes)",
            "task_type": "survey",
            "reward_amount": 0.75,
            "estimated_time": 10,
            "verification_type": "self_reported",
            "is_active": True,
            "survey_url": "https://forms.gle/example2",
            "created_at": datetime.utcnow(),
            "completion_count": 0
        },
        # Videos
        {
            "title": "Watch Product Demo Video",
            "description": "Watch a 3-minute product demonstration video",
            "task_type": "video",
            "reward_amount": 0.30,
            "estimated_time": 3,
            "verification_type": "self_reported",
            "is_active": True,
            "video_url": "https://youtube.com/watch?v=example",
            "created_at": datetime.utcnow(),
            "completion_count": 0
        },
        {
            "title": "Educational Video - Earn While You Learn",
            "description": "Watch this 5-minute educational video about personal finance",
            "task_type": "video",
            "reward_amount": 0.40,
            "estimated_time": 5,
            "verification_type": "self_reported",
            "is_active": True,
            "video_url": "https://youtube.com/watch?v=example2",
            "created_at": datetime.utcnow(),
            "completion_count": 0
        },
        # Social Media Tasks
        {
            "title": "Follow Us on Instagram",
            "description": "Follow @VARAapp on Instagram",
            "task_type": "social",
            "reward_amount": 0.25,
            "estimated_time": 1,
            "verification_type": "self_reported",
            "is_active": True,
            "social_platform": "instagram",
            "social_action": "follow",
            "social_url": "https://instagram.com/varaapp",
            "created_at": datetime.utcnow(),
            "completion_count": 0
        },
        {
            "title": "Like Our Facebook Page",
            "description": "Like and follow VARA on Facebook",
            "task_type": "social",
            "reward_amount": 0.25,
            "estimated_time": 1,
            "verification_type": "self_reported",
            "is_active": True,
            "social_platform": "facebook",
            "social_action": "like",
            "social_url": "https://facebook.com/varaapp",
            "created_at": datetime.utcnow(),
            "completion_count": 0
        },
        {
            "title": "Share VARA on Twitter",
            "description": "Share a tweet about VARA and tag us @VARAapp",
            "task_type": "social",
            "reward_amount": 0.35,
            "estimated_time": 2,
            "verification_type": "self_reported",
            "is_active": True,
            "social_platform": "twitter",
            "social_action": "share",
            "social_url": "https://twitter.com/varaapp",
            "created_at": datetime.utcnow(),
            "completion_count": 0
        },
        # Data Entry
        {
            "title": "Simple Data Entry - Product Prices",
            "description": "Enter prices for 10 products from a provided list",
            "task_type": "data_entry",
            "reward_amount": 0.60,
            "estimated_time": 8,
            "verification_type": "self_reported",
            "is_active": True,
            "data_entry_prompt": "Enter the prices of the following 10 products...",
            "created_at": datetime.utcnow(),
            "completion_count": 0
        },
        {
            "title": "Transcribe Audio Clip",
            "description": "Listen to a 2-minute audio clip and type what you hear",
            "task_type": "data_entry",
            "reward_amount": 0.80,
            "estimated_time": 10,
            "verification_type": "self_reported",
            "is_active": True,
            "data_entry_prompt": "Listen to the audio and transcribe it accurately...",
            "created_at": datetime.utcnow(),
            "completion_count": 0
        },
        # Quiz
        {
            "title": "General Knowledge Quiz",
            "description": "Answer 5 simple questions correctly",
            "task_type": "quiz",
            "reward_amount": 0.40,
            "estimated_time": 3,
            "verification_type": "automatic",
            "is_active": True,
            "quiz_questions": [
                {"question": "What is the capital of France?", "answer": "Paris"},
                {"question": "How many continents are there?", "answer": "7"},
                {"question": "What color is the sky?", "answer": "Blue"},
                {"question": "How many days in a week?", "answer": "7"},
                {"question": "What is 5 + 5?", "answer": "10"}
            ],
            "created_at": datetime.utcnow(),
            "completion_count": 0
        },
        # Additional tasks
        {
            "title": "Mobile App Testing",
            "description": "Download a new app and test it for 5 minutes, then share your feedback",
            "task_type": "survey",
            "reward_amount": 0.90,
            "estimated_time": 10,
            "verification_type": "self_reported",
            "is_active": True,
            "survey_url": "https://forms.gle/example3",
            "created_at": datetime.utcnow(),
            "completion_count": 0
        },
        {
            "title": "Quick Photo Task",
            "description": "Take a photo of a product label and upload it",
            "task_type": "data_entry",
            "reward_amount": 0.50,
            "estimated_time": 3,
            "verification_type": "self_reported",
            "is_active": True,
            "data_entry_prompt": "Take a clear photo of any product label...",
            "created_at": datetime.utcnow(),
            "completion_count": 0
        },
        {
            "title": "Website Feedback Survey",
            "description": "Visit a website and answer questions about your experience",
            "task_type": "survey",
            "reward_amount": 0.65,
            "estimated_time": 7,
            "verification_type": "self_reported",
            "is_active": True,
            "survey_url": "https://forms.gle/example4",
            "created_at": datetime.utcnow(),
            "completion_count": 0
        },
        {
            "title": "Follow on TikTok",
            "description": "Follow @VARAapp on TikTok and watch our latest video",
            "task_type": "social",
            "reward_amount": 0.30,
            "estimated_time": 2,
            "verification_type": "self_reported",
            "is_active": True,
            "social_platform": "tiktok",
            "social_action": "follow",
            "social_url": "https://tiktok.com/@varaapp",
            "created_at": datetime.utcnow(),
            "completion_count": 0
        },
        {
            "title": "Product Review",
            "description": "Write a short review (50+ words) about a product you recently bought",
            "task_type": "data_entry",
            "reward_amount": 0.70,
            "estimated_time": 6,
            "verification_type": "self_reported",
            "is_active": True,
            "data_entry_prompt": "Write your product review here (minimum 50 words)...",
            "created_at": datetime.utcnow(),
            "completion_count": 0
        }
    ]
    
    result = await db.tasks.insert_many(tasks)
    logger.info(f"Seeded {len(result.inserted_ids)} tasks")
