from pydantic import BaseModel, Field


# =========================================================
# AI Interview Turn
# =========================================================

class InterviewTurnOutput(BaseModel):
    interviewer_question: str = Field(
        min_length=1,
        max_length=1000,
    )

    persona_answer: str = Field(
        min_length=1,
        max_length=2000,
    )

    question_type: str = Field(
        min_length=1,
        max_length=30,
    )

    is_follow_up: bool = False

    follow_up_reason: str | None = Field(
        default=None,
        max_length=500,
    )

    is_complete: bool = False

    completion_reason: str | None = Field(
        default=None,
        max_length=500,
    )


# =========================================================
# AI Interview Evaluation
# =========================================================

class InterviewEvaluationOutput(BaseModel):
    continue_interview: bool

    needs_follow_up: bool

    next_question: str | None = Field(
        default=None,
        max_length=1000,
    )

    question_type: str | None = Field(
        default=None,
        max_length=30,
    )

    reason: str | None = Field(
        default=None,
        max_length=1000,
    )


# =========================================================
# AI Interview Analysis
# =========================================================

class InterviewAnalysisOutput(BaseModel):
    score: int = Field(
        ge=0,
        le=100,
    )

    summary: str = Field(
        min_length=1,
        max_length=3000,
    )

    key_insights: list[str] = Field(
        default_factory=list,
        max_length=10,
    )

    pain_points: list[str] = Field(
        default_factory=list,
        max_length=10,
    )

    needs: list[str] = Field(
        default_factory=list,
        max_length=10,
    )

    motivations: list[str] = Field(
        default_factory=list,
        max_length=10,
    )