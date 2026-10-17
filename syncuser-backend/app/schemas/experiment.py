from datetime import datetime

from pydantic import BaseModel


class ExperimentCreate(BaseModel):
    name: str
    target_audience: str | None = None
    description: str | None = None


class ExperimentUpdate(BaseModel):
    name: str | None = None
    target_audience: str | None = None
    description: str | None = None


class ExperimentResponse(BaseModel):
    id: int
    name: str
    target_audience: str | None = None
    description: str | None = None
    status: str
    persona_count: int
    created_at: datetime
    updated_at: datetime