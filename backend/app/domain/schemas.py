from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Optional, List


class UserResponse(BaseModel):
    id: UUID
    email: str
    created_at: Optional[datetime] = None
    email_confirmed_at: Optional[datetime] = None


class TranscriptionSegment(BaseModel):
    start: float
    end: float
    text: str


class TranscriptionCreate(BaseModel):
    language: Optional[str] = None


class TranscriptionResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    original_filename: str
    text: str
    duration_seconds: Optional[float] = None
    language: Optional[str] = None
    segments: Optional[List[TranscriptionSegment]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TranscriptionListResponse(BaseModel):
    items: List[TranscriptionResponse]
    total: int
    page: int
    per_page: int
