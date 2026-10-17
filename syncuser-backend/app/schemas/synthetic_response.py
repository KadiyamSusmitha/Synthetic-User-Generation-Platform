from typing import Any

from pydantic import BaseModel, Field


class GeneratedSyntheticAnswer(BaseModel):
    """
    Structured AI output for a single synthetic survey answer.
    """

    answer: Any = Field(
        description=(
            "The synthetic survey answer generated from "
            "the persona's perspective."
        )
    )


class GeneratedSyntheticAnswerItem(BaseModel):
    """
    One answer associated with its original survey question.
    """

    question_id: str = Field(
        description="The ID of the survey question being answered."
    )

    answer: Any = Field(
        description=(
            "The synthetic answer for this survey question."
        )
    )


class GeneratedSyntheticAnswers(BaseModel):
    """
    Structured AI output containing answers to multiple
    survey questions in a single Gemini request.
    """

    answers: list[GeneratedSyntheticAnswerItem] = Field(
        min_length=1,
        description=(
            "One answer for each supplied survey question. "
            "Each question_id must match the supplied question ID."
        ),
    )