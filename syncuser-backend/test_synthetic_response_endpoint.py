from unittest.mock import patch

from fastapi.testclient import TestClient

from app.database import SessionLocal
from app.main import app
from app.models.survey import Survey
from app.models.synthetic_response import SyntheticResponse
from app.models.user import User
from app.utils.dependencies import get_current_user


# ---------------------------------------------------------
# Test Configuration
# ---------------------------------------------------------

TEST_SURVEY_ID = 2


# ---------------------------------------------------------
# Create database session
# ---------------------------------------------------------

db = SessionLocal()


# ---------------------------------------------------------
# Find the survey dynamically
# ---------------------------------------------------------

survey = (
    db.query(Survey)
    .filter(Survey.id == TEST_SURVEY_ID)
    .first()
)

if not survey:
    db.close()
    raise RuntimeError(
        f"Survey with ID {TEST_SURVEY_ID} was not found."
    )


# ---------------------------------------------------------
# Find the survey owner dynamically
# ---------------------------------------------------------

test_user = (
    db.query(User)
    .filter(User.id == survey.user_id)
    .first()
)

if not test_user:
    db.close()
    raise RuntimeError(
        f"Owner of Survey {TEST_SURVEY_ID} was not found."
    )


# ---------------------------------------------------------
# Authentication dependency override
# ---------------------------------------------------------

def override_get_current_user():
    return test_user


app.dependency_overrides[
    get_current_user
] = override_get_current_user


# ---------------------------------------------------------
# Mock synthetic response generation
# ---------------------------------------------------------

def mock_generate_and_store_synthetic_responses_for_personas(
    personas,
    experiment,
    survey_id,
    questions,
    db,
):
    generated_responses = []

    for persona in personas:

        answers = {}

        for question in questions:
            answers[str(question.id)] = (
                f"Mock answer for question {question.id}"
            )

        response_data = {
            "persona_id": persona.id,
            "persona_name": persona.name,
            "answers": answers,
        }

        synthetic_response = SyntheticResponse(
            survey_id=survey_id,
            experiment_id=experiment.id,
            persona_id=persona.id,
            response_data=response_data,
        )

        db.add(synthetic_response)
        db.flush()

        generated_responses.append(
            synthetic_response
        )

    return generated_responses


# ---------------------------------------------------------
# FastAPI TestClient
# ---------------------------------------------------------

client = TestClient(app)


try:

    print()
    print(
        "=== FASTAPI SYNTHETIC RESPONSE ENDPOINT TEST ==="
    )
    print()

    print(
        "Survey:",
        survey.id,
        survey.title,
    )

    print(
        "Survey Owner:",
        test_user.id,
    )

    # -----------------------------------------------------
    # Patch the function used directly by the router
    # -----------------------------------------------------

    with patch(
        "app.routers.synthetic_responses."
        "generate_and_store_synthetic_responses_for_personas",
        side_effect=(
            mock_generate_and_store_synthetic_responses_for_personas
        ),
    ) as mocked_generation:

        # -------------------------------------------------
        # Send actual HTTP request
        # -------------------------------------------------

        response = client.post(
            f"/api/synthetic-responses/generate/"
            f"{TEST_SURVEY_ID}"
        )

        print(
            "HTTP Status:",
            response.status_code,
        )

        print(
            "Response:",
            response.json(),
        )

        # -------------------------------------------------
        # Verify HTTP status
        # -------------------------------------------------

        if response.status_code != 201:
            raise RuntimeError(
                "Expected HTTP 201 Created."
            )

        data = response.json()

        # -------------------------------------------------
        # Verify response message
        # -------------------------------------------------

        if data["message"] != (
            "Synthetic responses generated successfully."
        ):
            raise RuntimeError(
                "Incorrect success message."
            )

        # -------------------------------------------------
        # Verify survey
        # -------------------------------------------------

        if data["survey_id"] != TEST_SURVEY_ID:
            raise RuntimeError(
                "Incorrect survey_id."
            )

        # -------------------------------------------------
        # Verify experiment
        # -------------------------------------------------

        if data["experiment_id"] != survey.experiment_id:
            raise RuntimeError(
                "Incorrect experiment_id."
            )

        # -------------------------------------------------
        # Verify persona count
        # -------------------------------------------------

        if data["persona_count"] != 8:
            raise RuntimeError(
                "Expected 8 personas."
            )

        # -------------------------------------------------
        # Verify question count
        # -------------------------------------------------

        if data["question_count"] != 7:
            raise RuntimeError(
                "Expected 7 questions."
            )

        # -------------------------------------------------
        # Verify generated response count
        # -------------------------------------------------

        if data["generated_response_count"] != 8:
            raise RuntimeError(
                "Expected 8 generated responses."
            )

        # -------------------------------------------------
        # Verify response IDs
        # -------------------------------------------------

        response_ids = data["synthetic_response_ids"]

        if len(response_ids) != 8:
            raise RuntimeError(
                "Expected 8 synthetic response IDs."
            )

        if not all(
            isinstance(response_id, int)
            for response_id in response_ids
        ):
            raise RuntimeError(
                "Synthetic response IDs must be integers."
            )

        # -------------------------------------------------
        # Verify generation function was called once
        # -------------------------------------------------

        if mocked_generation.call_count != 1:
            raise RuntimeError(
                "Synthetic response generation function "
                "was not called exactly once."
            )

        # -------------------------------------------------
        # Verify function arguments
        # -------------------------------------------------

        call_kwargs = (
            mocked_generation.call_args.kwargs
        )

        if call_kwargs["survey_id"] != TEST_SURVEY_ID:
            raise RuntimeError(
                "Incorrect survey_id passed to generation service."
            )

        if call_kwargs["experiment"].id != survey.experiment_id:
            raise RuntimeError(
                "Incorrect experiment passed to generation service."
            )

        if len(call_kwargs["personas"]) != 8:
            raise RuntimeError(
                "Expected 8 personas in generation service."
            )

        if len(call_kwargs["questions"]) != 7:
            raise RuntimeError(
                "Expected 7 questions in generation service."
            )

        print()
        print(
            "HTTP endpoint validation passed."
        )

        print(
            "Authentication dependency override passed."
        )

        print(
            "Synthetic generation function "
            "was called correctly."
        )

        # -------------------------------------------------
        # Rollback database changes
        # -------------------------------------------------

        db.rollback()

        print(
            "Database changes rolled back successfully."
        )

        print(
            "No test synthetic responses were committed."
        )

        print()
        print(
            "TEST PASSED."
        )

finally:

    # -----------------------------------------------------
    # Remove FastAPI dependency overrides
    # -----------------------------------------------------

    app.dependency_overrides.clear()

    # -----------------------------------------------------
    # Close database session
    # -----------------------------------------------------

    db.close()