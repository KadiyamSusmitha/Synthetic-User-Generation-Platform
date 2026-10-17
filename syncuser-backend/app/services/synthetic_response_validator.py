from typing import Any

from app.schemas.synthetic_response import GeneratedSyntheticAnswer


class SyntheticResponseValidationError(ValueError):
    """
    Raised when a generated synthetic answer
    does not match the survey question type.
    """


def _sanitize_text(value: str) -> str:
    """
    Remove unnecessary whitespace from a text answer.
    """
    return value.strip()


def _is_placeholder_answer(value: Any) -> bool:
    """
    Identify generic placeholder answers that must not
    be treated as genuine synthetic survey responses.
    """
    if not isinstance(value, str):
        return False

    normalized = " ".join(value.strip().lower().split())

    return (
        normalized.startswith("mock answer for question")
        or normalized.startswith("placeholder answer")
        or normalized in {
            "mock answer",
            "test answer",
            "sample answer",
        }
    )


def _sanitize_answer(
    answer: Any,
    question_type: str,
) -> Any:
    """
    Sanitize the generated answer without changing
    its intended meaning.
    """
    if question_type in {
        "single_choice",
        "yes_no",
        "likert",
        "short_text",
        "long_text",
    }:
        if isinstance(answer, str):
            return _sanitize_text(answer)

    elif question_type == "multiple_choice":
        if isinstance(answer, list):
            return [
                _sanitize_text(item)
                if isinstance(item, str)
                else item
                for item in answer
            ]

    return answer


def validate_synthetic_answer(
    generated_answer: GeneratedSyntheticAnswer,
    question_type: str,
    options: list[str] | None = None,
) -> GeneratedSyntheticAnswer:
    """
    Sanitize and validate a synthetic answer according
    to the survey question type.

    Rejects placeholder answers before validating the
    answer against its question type.
    """
    answer: Any = _sanitize_answer(
        generated_answer.answer,
        question_type,
    )

    options = options or []

    # --------------------------------------------------
    # Reject Placeholder Answers
    # --------------------------------------------------
    answers_to_check = (
        answer if isinstance(answer, list) else [answer]
    )

    if any(
        _is_placeholder_answer(item)
        for item in answers_to_check
    ):
        raise SyntheticResponseValidationError(
            "Placeholder answers are not allowed."
        )

    # --------------------------------------------------
    # Single Choice
    # --------------------------------------------------
    if question_type == "single_choice":
        if not isinstance(answer, str):
            raise SyntheticResponseValidationError(
                "Single-choice answer must be a single string."
            )

        if not answer:
            raise SyntheticResponseValidationError(
                "Single-choice answer cannot be empty."
            )

        if options and answer not in options:
            raise SyntheticResponseValidationError(
                "Single-choice answer must be one of the available options."
            )

    # --------------------------------------------------
    # Multiple Choice
    # --------------------------------------------------
    elif question_type == "multiple_choice":
        if not isinstance(answer, list):
            raise SyntheticResponseValidationError(
                "Multiple-choice answer must be a list."
            )

        if not answer:
            raise SyntheticResponseValidationError(
                "Multiple-choice answer cannot be empty."
            )

        if not all(isinstance(item, str) for item in answer):
            raise SyntheticResponseValidationError(
                "Multiple-choice answers must contain strings only."
            )

        if any(not item for item in answer):
            raise SyntheticResponseValidationError(
                "Multiple-choice answers cannot contain empty values."
            )

        if options:
            invalid_options = [
                item
                for item in answer
                if item not in options
            ]

            if invalid_options:
                raise SyntheticResponseValidationError(
                    "Multiple-choice answer contains an invalid option."
                )

    # --------------------------------------------------
    # Rating
    # --------------------------------------------------
    elif question_type == "rating":
        if isinstance(answer, bool) or not isinstance(
            answer,
            (int, float),
        ):
            raise SyntheticResponseValidationError(
                "Rating answer must be numeric."
            )

        if not 1 <= answer <= 5:
            raise SyntheticResponseValidationError(
                "Rating answer must be between 1 and 5."
            )

    # --------------------------------------------------
    # Yes / No
    # --------------------------------------------------
    elif question_type == "yes_no":
        if not isinstance(answer, str):
            raise SyntheticResponseValidationError(
                "Yes/No answer must be a string."
            )

        if not answer:
            raise SyntheticResponseValidationError(
                "Yes/No answer cannot be empty."
            )

        if answer.lower() not in {"yes", "no"}:
            raise SyntheticResponseValidationError(
                "Yes/No answer must be either 'Yes' or 'No'."
            )

    # --------------------------------------------------
    # Likert
    # --------------------------------------------------
    elif question_type == "likert":
        if not isinstance(answer, str):
            raise SyntheticResponseValidationError(
                "Likert answer must be a string."
            )

        if not answer:
            raise SyntheticResponseValidationError(
                "Likert answer cannot be empty."
            )

        if options and answer not in options:
            raise SyntheticResponseValidationError(
                "Likert answer must be one of the available options."
            )

    # --------------------------------------------------
    # Short Text
    # --------------------------------------------------
    elif question_type == "short_text":
        if not isinstance(answer, str):
            raise SyntheticResponseValidationError(
                "Short-text answer must be a string."
            )

        if not answer:
            raise SyntheticResponseValidationError(
                "Short-text answer cannot be empty."
            )

    # --------------------------------------------------
    # Long Text
    # --------------------------------------------------
    elif question_type == "long_text":
        if not isinstance(answer, str):
            raise SyntheticResponseValidationError(
                "Long-text answer must be a string."
            )

        if not answer:
            raise SyntheticResponseValidationError(
                "Long-text answer cannot be empty."
            )

    # --------------------------------------------------
    # Unsupported Question Type
    # --------------------------------------------------
    else:
        raise SyntheticResponseValidationError(
            f"Unsupported question type: {question_type}"
        )

    return GeneratedSyntheticAnswer(answer=answer)