from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


# =========================================================
# Start Interview
# =========================================================

class InterviewCreate(BaseModel):
    experiment_id: int
    persona_id: int


# =========================================================
# Interview Response
# =========================================================

class InterviewResponse(BaseModel):
    id: int
    user_id: int
    experiment_id: int
    persona_id: int

    status: str

    total_questions: int
    questions_explored: int
    follow_up_questions: int

    is_saved: bool

    started_at: datetime
    completed_at: datetime | None = None
    created_at: datetime


# =========================================================
# Interview Message
# =========================================================

class InterviewMessageResponse(BaseModel):
    id: int
    interview_id: int
    role: str
    message: str
    question_type: str | None = None
    created_at: datetime


# =========================================================
# Interview Conversation
# =========================================================

class InterviewConversationResponse(BaseModel):
    interview: InterviewResponse
    messages: list[InterviewMessageResponse]


# =========================================================
# Continue Interview
# =========================================================

class InterviewTurnRequest(BaseModel):
    interview_id: int


# =========================================================
# Interview Result
# =========================================================

class InterviewResultResponse(BaseModel):
    id: int
    interview_id: int

    score: int | None = None

    summary: str | None = None

    key_insights: list[Any] | None = None
    pain_points: list[Any] | None = None
    needs: list[Any] | None = None
    motivations: list[Any] | None = None

    created_at: datetime


# =========================================================
# Complete Interview
# =========================================================

class CompleteInterviewResponse(BaseModel):
    interview: InterviewResponse
    result: InterviewResultResponse


# =========================================================
# Interview Note
# =========================================================

class InterviewNoteCreate(BaseModel):
    note: str = Field(
        min_length=1,
        max_length=2000,
    )


class InterviewNoteResponse(BaseModel):
    id: int
    interview_id: int
    note: str
    created_at: datetime
    updated_at: datetime