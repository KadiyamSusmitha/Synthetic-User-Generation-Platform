from types import SimpleNamespace

from fastapi.testclient import TestClient

from app.database import SessionLocal
from app.main import app
from app.models.experiment import Experiment
from app.models.persona import Persona
from app.models.survey import Survey
from app.models.survey_question import SurveyQuestion
from app.models.synthetic_response import SyntheticResponse
from app.models.user import User
from app.routers import synthetic_responses


client = TestClient(app)


def get_test_users():
    db = SessionLocal()

    try:
        users = db.query(User).order_by(User.id).all()

        if len(users) < 2:
            return None, None

        return users[0], users[1]

    finally:
        db.close()


def create_token(user_id):
    import jwt
    import os

    secret_key = os.getenv("JWT_SECRET_KEY")
    algorithm = os.getenv("JWT_ALGORITHM", "HS256")

    return jwt.encode(
        {"sub": str(user_id)},
        secret_key,
        algorithm=algorithm,
    )


def get_auth_headers(user_id):
    token = create_token(user_id)

    return {
        "Authorization": f"Bearer {token}",
    }


def get_existing_survey():
    db = SessionLocal()

    try:
        survey = (
            db.query(Survey)
            .filter(Survey.id == 2)
            .first()
        )

        return survey

    finally:
        db.close()


def test_generate_requires_authentication():
    response = client.post(
        "/api/synthetic-responses/generate/2"
    )

    assert response.status_code == 401


def test_get_requires_authentication():
    response = client.get(
        "/api/synthetic-responses/survey/2"
    )

    assert response.status_code == 401


def test_nonexistent_survey_returns_404():
    user, _ = get_test_users()

    assert user is not None

    response = client.post(
        "/api/synthetic-responses/generate/999999",
        headers=get_auth_headers(user.id),
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Survey not found."


def test_nonexistent_survey_get_returns_404():
    user, _ = get_test_users()

    assert user is not None

    response = client.get(
        "/api/synthetic-responses/survey/999999",
        headers=get_auth_headers(user.id),
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Survey not found."


def test_cross_user_survey_access_is_rejected():
    owner, other_user = get_test_users()

    assert owner is not None
    assert other_user is not None

    survey = get_existing_survey()

    assert survey is not None
    assert survey.user_id == owner.id

    response = client.get(
        f"/api/synthetic-responses/survey/{survey.id}",
        headers=get_auth_headers(other_user.id),
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Survey not found."


def test_cross_user_generation_is_rejected():
    owner, other_user = get_test_users()

    assert owner is not None
    assert other_user is not None

    survey = get_existing_survey()

    assert survey is not None
    assert survey.user_id == owner.id

    response = client.post(
        f"/api/synthetic-responses/generate/{survey.id}",
        headers=get_auth_headers(other_user.id),
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Survey not found."


def test_get_existing_synthetic_responses():
    owner, _ = get_test_users()

    assert owner is not None

    survey = get_existing_survey()

    assert survey is not None
    assert survey.user_id == owner.id

    response = client.get(
        f"/api/synthetic-responses/survey/{survey.id}",
        headers=get_auth_headers(owner.id),
    )

    assert response.status_code == 200

    data = response.json()

    assert data["survey_id"] == survey.id
    assert "survey_title" in data
    assert "experiment_id" in data
    assert "experiment_name" in data
    assert "question_count" in data
    assert "questions" in data
    assert "generated_response_count" in data
    assert "responses" in data

    assert isinstance(data["questions"], list)
    assert isinstance(data["responses"], list)


def test_get_response_contains_generation_metadata_fields():
    owner, _ = get_test_users()

    assert owner is not None

    survey = get_existing_survey()

    assert survey is not None
    assert survey.user_id == owner.id

    response = client.get(
        f"/api/synthetic-responses/survey/{survey.id}",
        headers=get_auth_headers(owner.id),
    )

    assert response.status_code == 200

    data = response.json()

    if data["responses"]:
        generated_response = data["responses"][0]

        assert "generation_id" in generated_response
        assert "model_name" in generated_response
        assert "generation_status" in generated_response
        assert "created_at" in generated_response


def test_generate_requires_linked_experiment(monkeypatch):
    owner, _ = get_test_users()

    assert owner is not None

    db = SessionLocal()

    try:
        survey = (
            db.query(Survey)
            .filter(
                Survey.user_id == owner.id,
                Survey.experiment_id.is_(None),
            )
            .first()
        )

        if survey is None:
            return

        response = client.post(
            f"/api/synthetic-responses/generate/{survey.id}",
            headers=get_auth_headers(owner.id),
        )

        assert response.status_code == 422

    finally:
        db.close()


def test_generate_requires_personas(monkeypatch):
    owner, _ = get_test_users()

    assert owner is not None

    db = SessionLocal()

    try:
        survey = (
            db.query(Survey)
            .filter(
                Survey.user_id == owner.id,
                Survey.experiment_id.is_not(None),
            )
            .first()
        )

        if survey is None:
            return

        experiment = (
            db.query(Experiment)
            .filter(
                Experiment.id == survey.experiment_id,
                Experiment.user_id == owner.id,
            )
            .first()
        )

        if experiment is None:
            return

        personas = (
            db.query(Persona)
            .filter(
                Persona.experiment_id == experiment.id,
            )
            .all()
        )

        if personas:
            return

        response = client.post(
            f"/api/synthetic-responses/generate/{survey.id}",
            headers=get_auth_headers(owner.id),
        )

        assert response.status_code == 422

    finally:
        db.close()


def test_generate_requires_questions(monkeypatch):
    owner, _ = get_test_users()

    assert owner is not None

    db = SessionLocal()

    try:
        survey = (
            db.query(Survey)
            .filter(
                Survey.user_id == owner.id,
                Survey.experiment_id.is_not(None),
            )
            .first()
        )

        if survey is None:
            return

        questions = (
            db.query(SurveyQuestion)
            .filter(
                SurveyQuestion.survey_id == survey.id,
            )
            .all()
        )

        if questions:
            return

        response = client.post(
            f"/api/synthetic-responses/generate/{survey.id}",
            headers=get_auth_headers(owner.id),
        )

        assert response.status_code == 422

    finally:
        db.close()