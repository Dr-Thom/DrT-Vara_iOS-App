from fastapi import FastAPI
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables FIRST
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging

# Import all routers
from routes.waitlist import router as waitlist_router
from routes.auth import router as auth_router
from routes.tasks import router as tasks_router
from routes.withdrawal import router as withdrawal_router
from routes.referrals import router as referrals_router
from routes.stats import router as stats_router
from routes.users import router as users_router
from routes.legal import router as legal_router
from routes.offerwall import router as offerwall_router
from routes.admin import router as admin_router
from routes.dev_sync import router as dev_sync_router
from routes.beta import router as beta_router
# Import seed functions
from utils.seed import seed_admin, seed_tasks
from utils.notification_scheduler import start_scheduler

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'vara_db')]

# Create the main app
app = FastAPI(title="VARA API", version="2.0.0")

# Include all routers
app.include_router(waitlist_router)
app.include_router(auth_router)
app.include_router(tasks_router)
app.include_router(withdrawal_router)
app.include_router(referrals_router)
app.include_router(stats_router)
app.include_router(users_router)
app.include_router(legal_router)
app.include_router(offerwall_router)
app.include_router(admin_router)
app.include_router(dev_sync_router)
app.include_router(beta_router)
# CORS - use frontend URL from env
frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, frontend_url.replace('http://', 'https://')],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    """Run on application startup"""
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("referral_code", unique=True, sparse=True)
    await db.tasks.create_index("is_active")
    await db.withdrawal_requests.create_index("status")
    await db.referral_payouts.create_index("referrer_user_id")
    
    # Seed admin and tasks
    await seed_admin(db)
    await seed_tasks(db)
    
    # Backfill referral codes for any legacy users
    from utils.auth import generate_referral_code
    async for u in db.users.find({"referral_code": {"$in": [None, ""]}}):
        code = generate_referral_code()
        while await db.users.find_one({"referral_code": code}):
            code = generate_referral_code()
        await db.users.update_one(
            {"_id": u["_id"]},
            {"$set": {"referral_code": code}}
        )

    # Start background notification scheduler
    app.state.scheduler = start_scheduler(db)

    logger.info("VARA API started successfully")

@app.on_event("shutdown")
async def shutdown_db_client():
    sched = getattr(app.state, "scheduler", None)
    if sched:
        sched.shutdown(wait=False)
    client.close()

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "VARA API is running",
        "version": "2.1.0",
        "endpoints": {
            "waitlist": "/api/waitlist",
            "auth": "/api/auth",
            "tasks": "/api/tasks",
            "withdrawal": "/api/withdrawal",
            "referrals": "/api/referrals",
            "stats": "/api/stats",
            "health": "/api/health"
        }
    }
