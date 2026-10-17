from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


QuestionType = Literal[
    "single_choice",
    "multiple_choice",
    "rating",
    "yes_no",
    "likert",
    "short_text",
    "long_text",
]


class SurveyQuestionCreate(BaseModel):
    question: str = Field(
        ...,
        min_length=1,
        max_length=500,
    )

    question_type: QuestionType

    options: list[str] = Field(
        default_factory=list,
    )

    required: bool = False

    display_order: int | None = None


class SurveyQuestionUpdate(BaseModel):
    question: str | None = Field(
        default=None,
        min_length=1,
        max_length=500,
    )

    question_type: QuestionType | None = None

    options: list[str] | None = None

    required: bool | None = None

    display_order: int | None = None


class SurveyQuestionResponse(BaseModel):
    id: int
    survey_id: int
    question: str
    question_type: QuestionType
    options: list[str]
    required: bool
    display_order: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )