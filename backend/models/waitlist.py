from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal
from datetime import datetime

class WaitlistEntryBase(BaseModel):
    email: EmailStr
    source: Optional[Literal["main_form", "exit_popup", "hero_cta"]] = "main_form"
    bonusType: Literal["standard", "early_access"] = "standard"

class WaitlistEntryCreate(WaitlistEntryBase):
    pass

class WaitlistEntryDB(WaitlistEntryBase):
    position: int
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    ipAddress: Optional[str] = None
    userAgent: Optional[str] = None

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}

class WaitlistResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None
    error: Optional[str] = None

class WaitlistStatsResponse(BaseModel):
    success: bool
    data: dict
