from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app
from app.database import SessionLocal
from app.models.experiment import Experiment
from app.models.user import User
from app.utils.dependencies import get_current_user


client = TestClient(app)


def get_user(user_id: int):
    db = SessionLocal()

    try:
        return (
            db.query(User)
            .filter(User.id == user_id)
            .first()
        )
    finally:
        db.close()


def get_experiment(experiment_id: int):
    db = SessionLocal()

    try:
        return (
            db.query(Experiment)
            .filter(Experiment.id == experiment_id)
            .first()
        )
    finally:
        db.close()


def clear_dependency_overrides():
    app.dependency_overrides.clear()


def test_sentiment_requires_authentication():
    clear_dependency_overrides()

    response = client.get(
        "/api/analytics/9/sentiment"
    )

    assert response.status_code == 401


def test_sentiment_valid_experiment():
    user = get_user(5)

    app.dependency_overrides[
        get_current_user
    ] = lambda: user

    mock_result = {
        "total_responses": 16,
        "distribution": [
            {
                "sentiment": "positive",
                "count": 8,
                "percentage": 50.0,
            },
            {
                "sentiment": "neutral",
                "count": 5,
                "percentage": 31.25,
            },
            {
                "sentiment": "negative",
                "count": 3,
                "percentage": 18.75,
            },
        ],
    }

    try:
        with patch(
            "app.routers.analytics.sentiment_service.analyze_experiment",
            return_value=mock_result,
        ):
            response = client.get(
                "/api/analytics/9/sentiment"
            )

        assert response.status_code == 200

        data = response.json()

        assert data["total_responses"] == 16
        assert len(data["distribution"]) == 3

        sentiments = {
            item["sentiment"]
            for item in data["distribution"]
        }

        assert sentiments == {
            "positive",
            "neutral",
            "negative",
        }

        assert data["distribution"][0]["count"] == 8
        assert data["distribution"][1]["count"] == 5
        assert data["distribution"][2]["count"] == 3

    finally:
        clear_dependency_overrides()


def test_sentiment_empty_experiment():
    user = get_user(5)

    app.dependency_overrides[
        get_current_user
    ] = lambda: user

    mock_result = {
        "total_responses": 0,
        "distribution": [
            {
                "sentiment": "positive",
                "count": 0,
                "percentage": 0.0,
            },
            {
                "sentiment": "neutral",
                "count": 0,
                "percentage": 0.0,
            },
            {
                "sentiment": "negative",
                "count": 0,
                "percentage": 0.0,
            },
        ],
    }

    try:
        with patch(
            "app.routers.analytics.sentiment_service.analyze_experiment",
            return_value=mock_result,
        ):
            response = client.get(
                "/api/analytics/11/sentiment"
            )

        assert response.status_code == 200

        data = response.json()

        assert data["total_responses"] == 0

        for item in data["distribution"]:
            assert item["count"] == 0
            assert item["percentage"] == 0.0

    finally:
        clear_dependency_overrides()


def test_sentiment_cross_user_experiment_is_rejected():
    user = get_user(6)

    app.dependency_overrides[
        get_current_user
    ] = lambda: user

    try:
        response = client.get(
            "/api/analytics/9/sentiment"
        )

        assert response.status_code == 404
        assert response.json()["detail"] == (
            "Experiment not found."
        )

    finally:
        clear_dependency_overrides()


def test_sentiment_nonexistent_experiment():
    user = get_user(5)

    app.dependency_overrides[
        get_current_user
    ] = lambda: user

    try:
        response = client.get(
            "/api/analytics/99999/sentiment"
        )

        assert response.status_code == 404
        assert response.json()["detail"] == (
            "Experiment not found."
        )

    finally:
        clear_dependency_overrides()


def test_sentiment_ai_failure_returns_500():
    user = get_user(5)

    app.dependency_overrides[
        get_current_user
    ] = lambda: user

    try:
        with patch(
            "app.routers.analytics.sentiment_service.analyze_experiment",
            side_effect=Exception(
                "Failed to connect to the AI service. "
                "Please try again."
            ),
        ):
            response = client.get(
                "/api/analytics/9/sentiment"
            )

        assert response.status_code == 500

        data = response.json()

        assert "Failed to generate sentiment analytics" in (
            data["detail"]
        )

    finally:
        clear_dependency_overrides()