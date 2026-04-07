from fastapi import APIRouter, HTTPException, Request
from models.waitlist import (
    WaitlistEntryCreate,
    WaitlistResponse,
    WaitlistStatsResponse,
    WaitlistEntryDB
)
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["waitlist"])

# Get database connection
mongo_url = os.environ.get('MONGO_URL')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'vara_db')]
waitlist_collection = db.waitlist

# Simple in-memory rate limiting (for production, use Redis)
rate_limit_store = {}

def check_rate_limit(ip: str, max_requests: int = 3, window_minutes: int = 60) -> bool:
    """Simple rate limiting check"""
    now = datetime.utcnow()
    cutoff = now - timedelta(minutes=window_minutes)
    
    # Clean old entries
    rate_limit_store[ip] = [
        timestamp for timestamp in rate_limit_store.get(ip, [])
        if timestamp > cutoff
    ]
    
    # Check limit
    if len(rate_limit_store.get(ip, [])) >= max_requests:
        return False
    
    # Add new timestamp
    if ip not in rate_limit_store:
        rate_limit_store[ip] = []
    rate_limit_store[ip].append(now)
    
    return True

@router.post("/waitlist", response_model=WaitlistResponse)
async def add_to_waitlist(
    entry: WaitlistEntryCreate,
    request: Request
):
    """
    Add email to waitlist
    """
    try:
        # Get client IP
        client_ip = request.client.host
        
        # Rate limiting
        if not check_rate_limit(client_ip):
            return WaitlistResponse(
                success=False,
                message="Too many requests. Please try again later.",
                error="RATE_LIMIT_EXCEEDED"
            )
        
        # Check if email already exists
        existing = await waitlist_collection.find_one({"email": entry.email})
        
        if existing:
            return WaitlistResponse(
                success=True,
                message="You're already on the waitlist!",
                data={
                    "email": entry.email,
                    "position": existing.get("position", 0)
                }
            )
        
        # Calculate position (count + 1)
        count = await waitlist_collection.count_documents({})
        position = count + 1
        
        # Determine bonus type (first 1000 get early_access)
        bonus_type = "early_access" if position <= 1000 else "standard"
        
        # Create entry
        waitlist_entry = WaitlistEntryDB(
            email=entry.email,
            source=entry.source,
            bonusType=bonus_type,
            position=position,
            ipAddress=client_ip,
            userAgent=request.headers.get("user-agent", "")
        )
        
        # Insert into database
        entry_dict = waitlist_entry.model_dump()
        # Convert datetime to ISO string for MongoDB
        entry_dict['createdAt'] = entry_dict['createdAt'].isoformat()
        entry_dict['updatedAt'] = entry_dict['updatedAt'].isoformat()
        
        result = await waitlist_collection.insert_one(entry_dict)
        
        logger.info(f"New waitlist signup: {entry.email} at position {position}")
        
        return WaitlistResponse(
            success=True,
            message="Successfully joined the waitlist!",
            data={
                "email": entry.email,
                "position": position,
                "bonusType": bonus_type
            }
        )
        
    except Exception as e:
        logger.error(f"Error adding to waitlist: {str(e)}")
        return WaitlistResponse(
            success=False,
            message="Something went wrong. Please try again.",
            error="SERVER_ERROR"
        )

@router.get("/waitlist/stats", response_model=WaitlistStatsResponse)
async def get_waitlist_stats():
    """
    Get waitlist statistics
    """
    try:
        # Total signups
        total_signups = await waitlist_collection.count_documents({})
        
        # Today's signups
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_signups = await waitlist_collection.count_documents({
            "createdAt": {"$gte": today_start}
        })
        
        # Calculate average (last 7 days)
        week_ago = datetime.utcnow() - timedelta(days=7)
        week_signups = await waitlist_collection.count_documents({
            "createdAt": {"$gte": week_ago}
        })
        avg_per_day = round(week_signups / 7)
        
        return WaitlistStatsResponse(
            success=True,
            data={
                "totalSignups": total_signups,
                "todaySignups": today_signups,
                "avgSignupsPerDay": avg_per_day
            }
        )
        
    except Exception as e:
        logger.error(f"Error getting stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get statistics")

@router.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    try:
        # Test database connection
        await db.command("ping")
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "database": "connected"
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "timestamp": datetime.utcnow().isoformat(),
            "database": "disconnected",
            "error": str(e)
        }
