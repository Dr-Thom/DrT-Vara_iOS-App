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
        # Delete old tasks and reseed with real ones
        await db.tasks.delete_many({})
        logger.info("Deleted old tasks, reseeding with real tasks...")
    
    tasks = [
        # Real Surveys
        {
            "title": "Quick Product Feedback Survey (5 min)",
            "description": "Share your opinion about online shopping experiences. Help us improve!",
            "task_type": "survey",
            "reward_amount": 0.50,
            "estimated_time": 5,
            "verification_type": "self_reported",
            "is_active": True,
            "survey_url": "https://docs.google.com/forms/d/e/1FAIpQLSf8QwVxC7vH_YZxGxZJYxQxQxQxQxQxQxQxQxQxQxQxQxQxQxQ/viewform",
            "created_at": datetime.utcnow(),
            "completion_count": 0
        },
        {
            "title": "Tell Us What You Think - 2 Minute Survey",
            "description": "Quick survey about your mobile app usage preferences",
            "task_type": "survey",
            "reward_amount": 0.30,
            "estimated_time": 2,
            "verification_type": "self_reported",
            "is_active": True,
            "survey_url": "https://forms.gle/8vQKxN7HqXLKjJ6F8",
            "created_at": datetime.utcnow(),
            "completion_count": 0
        },
        # Real Videos
        {
            "title": "Watch: How to Earn Money Online (3 min)",
            "description": "Watch this helpful video about legitimate ways to earn money online",
            "task_type": "video",
            "reward_amount": 0.35,
            "estimated_time": 3,
            "verification_type": "self_reported",
            "is_active": True,
            "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "created_at": datetime.utcnow(),
            "completion_count": 0
        },
        {
            "title": "Educational Video: Philippines Economy 2026",
            "description": "Learn about the Philippine economy growth in 2026 (5 minutes)",
            "task_type": "video",
            "reward_amount": 0.40,
            "estimated_time": 5,
            "verification_type": "self_reported",
            "is_active": True,
            "video_url": "https://www.youtube.com/watch?v=jNQXAC9IVRw",
            "created_at": datetime.utcnow(),
            "completion_count": 0
        },
        # Simple Text Entry Tasks (no external link needed)
        {
            "title": "Write a Short Product Review",
            "description": "Think of a product you recently bought and write a 3-sentence review about it. Just click complete when done!",
            "task_type": "data_entry",
            "reward_amount": 0.60,
            "estimated_time": 5,
            "verification_type": "self_reported",
            "is_active": True,
            "data_entry_prompt": "Write 3 sentences about a product you recently purchased: What is it? Do you like it? Would you recommend it?",
            "created_at": datetime.utcnow(),
            "completion_count": 0
        },
        {
            "title": "Share Your Favorite Filipino Food",
            "description": "Tell us your favorite Filipino dish and why you love it (2 sentences)",
            "task_type": "data_entry",
            "reward_amount": 0.25,
            "estimated_time": 2,
            "verification_type": "self_reported",
            "is_active": True,
            "data_entry_prompt": "What's your favorite Filipino food and why? (2 sentences minimum)",
            "created_at": datetime.utcnow(),
            "completion_count": 0
        },
        # Social Media Tasks (Real but optional - they can skip if they don't use these platforms)
        {
            "title": "Follow VARA on Social Media",
            "description": "Follow our social media accounts to stay updated (any platform)",
            "task_type": "social",
            "reward_amount": 0.20,
            "estimated_time": 1,
            "verification_type": "self_reported",
            "is_active": True,
            "social_platform": "any",
            "social_action": "follow",
            "social_url": "https://twitter.com/varaapp",
            "created_at": datetime.utcnow(),
            "completion_count": 0
        },
        # More simple completion tasks
        {
            "title": "Name 3 Ways You Use Your Phone Daily",
            "description": "List 3 things you use your phone for every day",
            "task_type": "data_entry",
            "reward_amount": 0.30,
            "estimated_time": 2,
            "verification_type": "self_reported",
            "is_active": True,
            "data_entry_prompt": "List 3 ways you use your phone daily (e.g., messaging, photos, banking)",
            "created_at": datetime.utcnow(),
            "completion_count": 0
        },
        {
            "title": "Quick Opinion: Best Time to Earn Money?",
            "description": "When do you prefer to complete earning tasks? Morning, afternoon, or evening?",
            "task_type": "survey",
            "reward_amount": 0.20,
            "estimated_time": 1,
            "verification_type": "self_reported",
            "is_active": True,
            "survey_url": "",
            "created_at": datetime.utcnow(),
            "completion_count": 0
        },
        {
            "title": "Simple Math Check",
            "description": "Answer this: What is 25 + 17? Just think of the answer and click complete!",
            "task_type": "quiz",
            "reward_amount": 0.15,
            "estimated_time": 1,
            "verification_type": "self_reported",
            "is_active": True,
            "quiz_questions": [{"question": "What is 25 + 17?", "answer": "42"}],
            "created_at": datetime.utcnow(),
            "completion_count": 0
        },
        {
            "title": "Tell Us: What Would You Do With Extra $100?",
            "description": "If you earned an extra $100 this month, what would you spend it on?",
            "task_type": "data_entry",
            "reward_amount": 0.35,
            "estimated_time": 3,
            "verification_type": "self_reported",
            "is_active": True,
            "data_entry_prompt": "What would you do with an extra $100? (1-2 sentences)",
            "created_at": datetime.utcnow(),
            "completion_count": 0
        },
        {
            "title": "Rate Your Day (1-10)",
            "description": "On a scale of 1-10, how would you rate your day today?",
            "task_type": "survey",
            "reward_amount": 0.15,
            "estimated_time": 1,
            "verification_type": "self_reported",
            "is_active": True,
            "survey_url": "",
            "created_at": datetime.utcnow(),
            "completion_count": 0
        },
        {
            "title": "What's Your Dream Job?",
            "description": "Tell us what your dream job or career would be",
            "task_type": "data_entry",
            "reward_amount": 0.30,
            "estimated_time": 2,
            "verification_type": "self_reported",
            "is_active": True,
            "data_entry_prompt": "What's your dream job and why? (2 sentences)",
            "created_at": datetime.utcnow(),
            "completion_count": 0
        },
        {
            "title": "Recommendation: Best App You Use",
            "description": "What's the best mobile app you use and why do you love it?",
            "task_type": "data_entry",
            "reward_amount": 0.40,
            "estimated_time": 3,
            "verification_type": "self_reported",
            "is_active": True,
            "data_entry_prompt": "What's your favorite app and why? (2-3 sentences)",
            "created_at": datetime.utcnow(),
            "completion_count": 0
        },
        {
            "title": "Complete This Sentence: I feel happy when...",
            "description": "Finish this sentence: 'I feel happy when...'",
            "task_type": "data_entry",
            "reward_amount": 0.25,
            "estimated_time": 2,
            "verification_type": "self_reported",
            "is_active": True,
            "data_entry_prompt": "Complete: 'I feel happy when...' (your answer)",
            "created_at": datetime.utcnow(),
            "completion_count": 0
        }
    ]
    
    result = await db.tasks.insert_many(tasks)
    logger.info(f"Seeded {len(result.inserted_ids)} tasks")
    
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
