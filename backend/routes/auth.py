from fastapi import APIRouter, HTTPException, Request, Response, Depends
from models.user import UserCreate, UserLogin, UserResponse, UserDB
from utils.auth import hash_password, verify_password, create_access_token, create_refresh_token, decode_token, generate_referral_code
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Get database connection
mongo_url = os.environ.get('MONGO_URL')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'vara_db')]

async def get_current_user(request: Request) -> dict:
    """Get current authenticated user from JWT token"""
    # Try cookie first
    token = request.cookies.get("access_token")
    
    # Fallback to Authorization header
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")
    
    user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    user["_id"] = str(user["_id"])
    user.pop("password_hash", None)
    return user

@router.post("/register")
async def register(user_data: UserCreate, response: Response):
    """Register new user"""
    try:
        # Normalize email
        email = user_data.email.lower()
        
        # Check if user already exists
        existing = await db.users.find_one({"email": email})
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Hash password
        password_hash = hash_password(user_data.password)
        
        # Resolve referrer (if a referral code was provided)
        referred_by_code = None
        referred_by_user_id = None
        if user_data.referral_code:
            code = user_data.referral_code.strip().upper()
            referrer = await db.users.find_one({"referral_code": code})
            if referrer:
                referred_by_code = code
                referred_by_user_id = str(referrer["_id"])
            # Silently ignore invalid codes instead of erroring (better UX)
        
        # Generate a unique referral code for this new user
        new_referral_code = generate_referral_code()
        # Ensure uniqueness (collisions are extremely rare but handle them)
        while await db.users.find_one({"referral_code": new_referral_code}):
            new_referral_code = generate_referral_code()
        
        # Create user document
        user_doc = UserDB(
            email=email,
            password_hash=password_hash,
            name=user_data.name or email.split('@')[0],
            referral_code=new_referral_code,
            referred_by=referred_by_code,
            referred_by_user_id=referred_by_user_id,
        )
        
        # Insert into database
        result = await db.users.insert_one(user_doc.model_dump())
        user_id = str(result.inserted_id)
        
        # Increment referrer's referred_count
        if referred_by_user_id:
            await db.users.update_one(
                {"_id": ObjectId(referred_by_user_id)},
                {"$inc": {"referred_count": 1}}
            )
        
        # Create tokens
        access_token = create_access_token(user_id, email)
        refresh_token = create_refresh_token(user_id)
        
        # Set httpOnly cookies
        # Use secure cookies in production/preview (HTTPS), insecure only in local development
        is_secure = os.environ.get('ENVIRONMENT', 'production') != 'development'
        
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=is_secure,
            samesite="lax",
            max_age=14400,  # 4 hours
            path="/"
        )
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=is_secure,
            samesite="lax",
            max_age=604800,  # 7 days
            path="/"
        )
        
        logger.info(f"New user registered: {email}" + (f" (referred by {referred_by_code})" if referred_by_code else ""))
        
        return {
            "_id": user_id,
            "email": email,
            "name": user_doc.name,
            "role": user_doc.role,
            "earnings": user_doc.earnings,
            "total_earned": user_doc.total_earned,
            "total_withdrawn": user_doc.total_withdrawn,
            "tasks_completed": user_doc.tasks_completed,
            "bonus_unlocked": user_doc.bonus_unlocked,
            "bonuses_earned": user_doc.bonuses_earned,
            "referral_code": user_doc.referral_code,
            "referred_count": user_doc.referred_count,
            "referral_earnings": user_doc.referral_earnings,
            "trust_score": user_doc.trust_score,
            "current_streak": user_doc.current_streak,
            "longest_streak": user_doc.longest_streak,
            # Also return tokens in body for mobile clients (they can't read httpOnly cookies)
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(status_code=500, detail="Registration failed")

@router.post("/login")
async def login(credentials: UserLogin, response: Response):
    """Login user"""
    try:
        # Normalize email
        email = credentials.email.lower()
        
        # Find user
        user = await db.users.find_one({"email": email})
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Verify password
        if not verify_password(credentials.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        user_id = str(user["_id"])
        
        # Create tokens
        access_token = create_access_token(user_id, email)
        refresh_token = create_refresh_token(user_id)
        
        # Set httpOnly cookies
        # Use secure cookies in production/preview (HTTPS), insecure only in local development
        is_secure = os.environ.get('ENVIRONMENT', 'production') != 'development'
        
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=is_secure,
            samesite="lax",
            max_age=14400,  # 4 hours (aligned with register)
            path="/"
        )
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=is_secure,
            samesite="lax",
            max_age=604800,
            path="/"
        )
        
        logger.info(f"User logged in: {email}")
        
        return {
            "_id": user_id,
            "email": user["email"],
            "name": user.get("name"),
            "role": user.get("role", "user"),
            "earnings": user.get("earnings", 0.0),
            "total_earned": user.get("total_earned", 0.0),
            "total_withdrawn": user.get("total_withdrawn", 0.0),
            "tasks_completed": user.get("tasks_completed", 0),
            "bonus_unlocked": user.get("bonus_unlocked", False),
            "bonuses_earned": user.get("bonuses_earned", 0),
            "referral_code": user.get("referral_code"),
            "referred_count": user.get("referred_count", 0),
            "referral_earnings": user.get("referral_earnings", 0.0),
            "trust_score": user.get("trust_score", 50),
            "current_streak": user.get("current_streak", 0),
            "longest_streak": user.get("longest_streak", 0),
            # Also return tokens in body for mobile clients (they can't read httpOnly cookies)
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Login failed")

@router.post("/logout")
async def logout(response: Response):
    """Logout user"""
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out successfully"}

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user info"""
    return current_user

@router.post("/refresh")
async def refresh(request: Request, response: Response):
    """Refresh access token. Accepts refresh token via cookie (web) or Authorization header (mobile)."""
    # Try cookie first (web clients)
    refresh_token = request.cookies.get("refresh_token")
    
    # Fallback to Authorization header (mobile clients)
    if not refresh_token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            refresh_token = auth_header[7:]
    
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token not found")
    
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    user_id = payload["sub"]
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    # Create new access token
    access_token = create_access_token(user_id, user["email"])
    
    # Use secure cookies in production/preview (HTTPS), insecure only in local development
    is_secure = os.environ.get('ENVIRONMENT', 'production') != 'development'
    
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=is_secure,
        samesite="lax",
        max_age=14400,  # 4 hours
        path="/"
    )
    
    # Return access_token in body too for mobile clients
    return {"message": "Token refreshed", "access_token": access_token, "token_type": "bearer"}
