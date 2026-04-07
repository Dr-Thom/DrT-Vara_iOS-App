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

# Import seed functions
from utils.seed import seed_admin, seed_tasks

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
    await db.tasks.create_index("is_active")
    
    # Seed admin and tasks
    await seed_admin(db)
    await seed_tasks(db)
    
    logger.info("VARA API started successfully")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "VARA API is running",
        "version": "2.0.0",
        "endpoints": {
            "waitlist": "/api/waitlist",
            "auth": "/api/auth",
            "tasks": "/api/tasks",
            "withdrawal": "/api/withdrawal",
            "health": "/api/health"
        }
    }