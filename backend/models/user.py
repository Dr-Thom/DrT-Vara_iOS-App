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
    bonus_unlocked: bool = False
    created_at: datetime

    class Config:
        populate_by_name = True

class UserDB(BaseModel):
    email: str
    password_hash: str
    name: Optional[str] = None
    role: str = "user"
    earnings: float = 0.0  # Current balance
    total_earned: float = 0.0  # Lifetime earnings
    total_withdrawn: float = 0.0  # Lifetime withdrawals
    tasks_completed: int = 0
    bonus_unlocked: bool = False
    completed_task_ids: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.utcnow())
    
    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}
