from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, Literal, List
from datetime import datetime

class TaskBase(BaseModel):
    title: str
    description: str
    task_type: Literal["survey", "video", "social", "data_entry", "quiz"]
    reward_amount: float
    estimated_time: int  # in minutes
    verification_type: Literal["self_reported", "automatic"]
    is_active: bool = True

class TaskCreate(TaskBase):
    pass

class TaskResponse(TaskBase):
    id: str = Field(alias="_id")
    created_at: datetime
    completion_count: int = 0

    class Config:
        populate_by_name = True

class TaskDB(TaskBase):
    # Task-specific fields based on type
    survey_url: Optional[str] = None
    video_url: Optional[str] = None
    social_platform: Optional[str] = None
    social_action: Optional[str] = None
    social_url: Optional[str] = None
    data_entry_prompt: Optional[str] = None
    quiz_questions: Optional[List[dict]] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completion_count: int = 0
    
    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}

class TaskCompletionRequest(BaseModel):
    task_id: str
    # Optional fields for verification
    survey_response: Optional[str] = None
    video_watched: Optional[bool] = None
    social_completed: Optional[bool] = None
    data_entry_response: Optional[str] = None
    quiz_answers: Optional[List[str]] = None

class TaskCompletionResponse(BaseModel):
    success: bool
    message: str
    reward_earned: float
    total_earnings: float
    tasks_completed: int
    bonus_unlocked: bool
