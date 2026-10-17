from datetime import datetime
from unittest.mock import patch

import pytest

from app.models.synthetic_response import SyntheticResponse
from app.models.survey_question import SurveyQuestion
from app.schemas.sentiment import (
    BatchSentimentClassification,
    SentimentClassification,
    SentimentClassificationItem,
)
from app.services.sentiment_service import SentimentService


@pytest.fixture
def sentiment_service():
    return SentimentService()


@pytest.fixture
def questions():
    return [
        SurveyQuestion(
            id=1,
            survey_id=2,
            question=(
                "How satisfied are you "
                "with our product?"
            ),
            question_type="single_choice",
            options=[
                "OK",
                "Good",
                "Happy",
            ],
            required=True,
            display_order=0,
        ),
        SurveyQuestion(
            id=2,
            survey_id=2,
            question="What feedback do you have?",
            question_type="short_text",
            options=[],
            required=False,
            display_order=1,
        ),
    ]


def create_response(
    response_id,
    answers,
):
    return SyntheticResponse(
        id=response_id,
        survey_id=2,
        experiment_id=9,
        persona_id=response_id,
        response_data={
            "persona_id": response_id,
            "persona_name": (
                f"Persona {response_id}"
            ),
            "answers": answers,
        },
        created_at=datetime.utcnow(),
    )


def test_build_response_content(
    sentiment_service,
    questions,
):
    response = create_response(
        1,
        {
            "1": "Good",
            "2": (
                "The product is easy "
                "to use."
            ),
        },
    )

    content = (
        sentiment_service.build_response_content(
            response,
            questions,
        )
    )

    assert (
        "How satisfied are you"
        in content
    )
    assert "Good" in content
    assert (
        "The product is easy to use."
        in content
    )


def test_empty_response_content_is_neutral(
    sentiment_service,
):
    result = (
        sentiment_service.classify_response(
            ""
        )
    )

    assert result.sentiment == "neutral"


@patch(
    "app.services.sentiment_service."
    "generate_structured_sentiment"
)
def test_positive_sentiment(
    mock_generate,
    sentiment_service,
):
    mock_generate.return_value = (
        SentimentClassification(
            sentiment="positive"
        )
    )

    result = (
        sentiment_service.classify_response(
            "I really like the product."
        )
    )

    assert result.sentiment == "positive"
    mock_generate.assert_called_once()


@patch(
    "app.services.sentiment_service."
    "generate_structured_sentiment"
)
def test_neutral_sentiment(
    mock_generate,
    sentiment_service,
):
    mock_generate.return_value = (
        SentimentClassification(
            sentiment="neutral"
        )
    )

    result = (
        sentiment_service.classify_response(
            "The product is okay."
        )
    )

    assert result.sentiment == "neutral"


@patch(
    "app.services.sentiment_service."
    "generate_structured_sentiment"
)
def test_negative_sentiment(
    mock_generate,
    sentiment_service,
):
    mock_generate.return_value = (
        SentimentClassification(
            sentiment="negative"
        )
    )

    result = (
        sentiment_service.classify_response(
            "I dislike the product."
        )
    )

    assert result.sentiment == "negative"


@patch(
    "app.services.sentiment_service."
    "generate_batch_sentiment"
)
def test_analyze_multiple_responses(
    mock_generate,
    sentiment_service,
    questions,
):
    mock_generate.return_value = (
        BatchSentimentClassification(
            classifications=[
                SentimentClassificationItem(
                    response_id=1,
                    sentiment="positive",
                ),
                SentimentClassificationItem(
                    response_id=2,
                    sentiment="neutral",
                ),
                SentimentClassificationItem(
                    response_id=3,
                    sentiment="negative",
                ),
            ]
        )
    )

    responses = [
        create_response(
            1,
            {
                "1": "Happy",
                "2": "Great product.",
            },
        ),
        create_response(
            2,
            {
                "1": "OK",
                "2": "It is fine.",
            },
        ),
        create_response(
            3,
            {
                "1": "OK",
                "2": "Very disappointing.",
            },
        ),
    ]

    result = (
        sentiment_service.analyze_responses(
            responses,
            questions,
        )
    )

    assert result["total_responses"] == 3

    distribution = {
        item["sentiment"]: item
        for item in result["distribution"]
    }

    assert (
        distribution["positive"]["count"]
        == 1
    )
    assert (
        distribution["neutral"]["count"]
        == 1
    )
    assert (
        distribution["negative"]["count"]
        == 1
    )

    assert (
        distribution["positive"]["percentage"]
        == 33.33
    )
    assert (
        distribution["neutral"]["percentage"]
        == 33.33
    )
    assert (
        distribution["negative"]["percentage"]
        == 33.33
    )

    assert len(
        result["classifications"]
    ) == 3

    mock_generate.assert_called_once()


def test_no_responses(
    sentiment_service,
    questions,
):
    result = (
        sentiment_service.analyze_responses(
            [],
            questions,
        )
    )

    assert result["total_responses"] == 0

    for item in result["distribution"]:
        assert item["count"] == 0
        assert item["percentage"] == 0.0

    assert result["classifications"] == []


def test_answer_to_text(
    sentiment_service,
):
    assert (
        sentiment_service._answer_to_text(
            " Good "
        )
        == "Good"
    )

    assert (
        sentiment_service._answer_to_text(
            True
        )
        == "Yes"
    )

    assert (
        sentiment_service._answer_to_text(
            False
        )
        == "No"
    )

    assert (
        sentiment_service._answer_to_text(
            ["Dashboard", "Reports"]
        )
        == "Dashboard, Reports"
    )


@patch(
    "app.services.sentiment_service."
    "generate_structured_sentiment"
)
def test_invalid_sentiment_is_rejected(
    mock_generate,
    sentiment_service,
):
    class InvalidResult:
        sentiment = "unknown"

    mock_generate.return_value = (
        InvalidResult()
    )

    with pytest.raises(
        ValueError,
        match="unsupported sentiment",
    ):
        sentiment_service.classify_response(
            "Some response"
        )


@patch(
    "app.services.sentiment_service."
    "generate_batch_sentiment"
)
def test_missing_batch_classification_defaults_to_neutral(
    mock_generate,
    sentiment_service,
    questions,
):
    mock_generate.return_value = (
        BatchSentimentClassification(
            classifications=[
                SentimentClassificationItem(
                    response_id=1,
                    sentiment="positive",
                ),
            ]
        )
    )

    responses = [
        create_response(
            1,
            {
                "1": "Happy",
            },
        ),
        create_response(
            2,
            {
                "1": "No response.",
            },
        ),
    ]

    result = (
        sentiment_service.analyze_responses(
            responses,
            questions,
        )
    )

    distribution = {
        item["sentiment"]: item
        for item in result["distribution"]
    }

    assert (
        distribution["positive"]["count"]
        == 1
    )

    assert (
        distribution["neutral"]["count"]
        == 1
    )

    mock_generate.assert_called_once()


def test_empty_response_defaults_to_neutral(
    sentiment_service,
    questions,
):
    response = create_response(
        1,
        {},
    )

    with patch(
        "app.services.sentiment_service."
        "generate_batch_sentiment"
    ) as mock_generate:
        result = (
            sentiment_service.analyze_responses(
                [response],
                questions,
            )
        )

        mock_generate.assert_not_called()

    distribution = {
        item["sentiment"]: item
        for item in result["distribution"]
    }

    assert (
        distribution["neutral"]["count"]
        == 1
    )