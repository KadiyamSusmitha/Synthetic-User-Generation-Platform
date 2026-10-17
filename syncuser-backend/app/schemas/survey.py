from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SurveyCreate(BaseModel):
    title: str = Field(
        ...,
        min_length=1,
        max_length=150,
    )
    experiment_id: int | None = None


class SurveyUpdate(BaseModel):
    title: str | None = Field(
        default=None,
        min_length=1,
        max_length=150,
    )


class SurveyResponse(BaseModel):
    id: int
    user_id: int
    experiment_id: int | None
    title: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
