from datetime import datetime
from types import SimpleNamespace

import pytest

from app.services import synthetic_response_service
from app.services.ai_exceptions import AIServiceError


def test_ai_error_is_propagated(monkeypatch):
    def fake_generate_synthetic_answer(prompt):
        raise AIServiceError(
            "AI service is temporarily busy. Please try again later.",
            status_code=429,
        )

    monkeypatch.setattr(
        synthetic_response_service,
        "generate_structured_synthetic_answer",
        fake_generate_synthetic_answer,
    )

    persona = SimpleNamespace(
        id=6,
        experiment_id=9,
        name="Marcus Vance",
        gender="male",
        description="Test persona",
        age=30,
        occupation="Software Engineer",
        location="Hyderabad",
        goals=[],
        pain_points=[],
        behaviors=[],
        interests=[],
        needs=[],
        created_at=datetime.utcnow(),
    )

    experiment = SimpleNamespace(
        id=9,
        name="TaxPal",
        description="TaxPal experiment",
    )

    question = SimpleNamespace(
        id=1,
        question="How satisfied are you with our product?",
        question_type="single_choice",
        options=["OK", "Good", "Happy"],
    )

    with pytest.raises(AIServiceError) as error_info:
        synthetic_response_service.generate_synthetic_answer_for_question(
            persona=persona,
            experiment=experiment,
            question=question,
        )

    error = error_info.value

    assert error.status_code == 429
    assert (
        error.message
        == "AI service is temporarily busy. Please try again later."
    )