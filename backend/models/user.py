from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None
    referral_code: Optional[str] = None  # Code of the referrer (if any)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str = Field(alias="_id")
    email: str
    name: Optional[str] = None
    role: str = "user"
    earnings: float = 0.0
    tasks_completed: int = 0
    bonuses_earned: int = 0
    referral_code: Optional[str] = None
    referral_earnings: float = 0.0
    referred_count: int = 0
    created_at: datetime

    class Config:
        populate_by_name = True

class UserDB(BaseModel):
    email: str
    password_hash: str
    name: Optional[str] = None
    role: str = "user"
    earnings: float = 0.0  # Current balance
    total_earned: float = 0.0  # Lifetime earnings (tasks + bonuses + referrals)
    total_withdrawn: float = 0.0  # Lifetime withdrawals
    tasks_completed: int = 0
    bonus_unlocked: bool = False  # Kept for backwards compatibility (true once >=5 tasks)
    bonuses_earned: int = 0  # Count of bonus drops received
    completed_task_ids: List[str] = []
    # Referral system
    referral_code: Optional[str] = None  # This user's unique referral code
    referred_by: Optional[str] = None  # referral_code of the user who referred this user
    referred_by_user_id: Optional[str] = None  # ID of the referrer (resolved at signup)
    referral_earnings: float = 0.0  # Total earned from referrals
    referred_count: int = 0  # How many users this user has referred
    referrer_earnings_paid: float = 0.0  # How much this user has paid to their referrer (capped at $10)
    # Trust system
    trust_score: int = 50
    # Streak system
    current_streak: int = 0
    longest_streak: int = 0
    last_active_date: Optional[datetime] = None  # Date of last earning action
    created_at: datetime = Field(default_factory=lambda: datetime.utcnow())

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}
