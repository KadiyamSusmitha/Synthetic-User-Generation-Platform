from sqlalchemy import inspect

from app.database import SessionLocal, engine
from app.models.experiment import Experiment
from app.models.persona import Persona
from app.models.survey import Survey
from app.models.synthetic_response import SyntheticResponse


def get_synthetic_responses():
    db = SessionLocal()

    try:
        return (
            db.query(SyntheticResponse)
            .order_by(SyntheticResponse.id)
            .all()
        )

    finally:
        db.close()


def test_synthetic_response_table_contains_expected_columns():
    columns = {
        column.name
        for column in SyntheticResponse.__table__.columns
    }

    expected_columns = {
        "id",
        "survey_id",
        "experiment_id",
        "persona_id",
        "response_data",
        "generation_id",
        "model_name",
        "generation_status",
        "created_at",
    }

    assert expected_columns.issubset(columns)


def test_synthetic_response_database_table_exists():
    inspector = inspect(engine)

    tables = inspector.get_table_names()

    assert "synthetic_responses" in tables


def test_existing_synthetic_responses_have_valid_foreign_key_references():
    responses = get_synthetic_responses()

    for response in responses:
        db = SessionLocal()

        try:
            survey = (
                db.query(Survey)
                .filter(Survey.id == response.survey_id)
                .first()
            )

            experiment = (
                db.query(Experiment)
                .filter(Experiment.id == response.experiment_id)
                .first()
            )

            persona = (
                db.query(Persona)
                .filter(
                    Persona.id == response.persona_id,
                    Persona.experiment_id == response.experiment_id,
                )
                .first()
            )

            assert survey is not None
            assert experiment is not None
            assert persona is not None

        finally:
            db.close()


def test_synthetic_response_experiment_matches_survey_experiment():
    responses = get_synthetic_responses()

    for response in responses:
        db = SessionLocal()

        try:
            survey = (
                db.query(Survey)
                .filter(Survey.id == response.survey_id)
                .first()
            )

            assert survey is not None
            assert survey.experiment_id == response.experiment_id

        finally:
            db.close()


def test_synthetic_response_persona_belongs_to_experiment():
    responses = get_synthetic_responses()

    for response in responses:
        db = SessionLocal()

        try:
            persona = (
                db.query(Persona)
                .filter(Persona.id == response.persona_id)
                .first()
            )

            assert persona is not None
            assert persona.experiment_id == response.experiment_id

        finally:
            db.close()


def test_synthetic_response_data_is_json_object():
    responses = get_synthetic_responses()

    for response in responses:
        assert isinstance(response.response_data, dict)

        assert "persona_id" in response.response_data
        assert "persona_name" in response.response_data
        assert "answers" in response.response_data

        assert isinstance(
            response.response_data["answers"],
            dict,
        )


def test_generation_metadata_is_consistent_when_present():
    responses = get_synthetic_responses()

    for response in responses:
        if response.generation_id is not None:
            assert isinstance(
                response.generation_id,
                str,
            )
            assert response.generation_id.startswith("gen_")

        if response.model_name is not None:
            assert isinstance(
                response.model_name,
                str,
            )
            assert response.model_name.strip() != ""

        if response.generation_status is not None:
            assert response.generation_status in {
                "completed",
                "failed",
            }


def test_generation_id_is_shared_by_responses_from_same_generation():
    responses = get_synthetic_responses()

    generation_groups = {}

    for response in responses:
        if response.generation_id is None:
            continue

        generation_groups.setdefault(
            response.generation_id,
            [],
        ).append(response)

    for generation_id, group in generation_groups.items():
        assert generation_id.startswith("gen_")

        for response in group:
            assert response.generation_id == generation_id


def test_created_at_exists_for_all_synthetic_responses():
    responses = get_synthetic_responses()

    for response in responses:
        assert response.created_at is not None