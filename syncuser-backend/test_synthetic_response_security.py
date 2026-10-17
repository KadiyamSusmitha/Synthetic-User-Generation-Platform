from unittest.mock import patch

from fastapi.testclient import TestClient

from app.database import SessionLocal
from app.main import app
from app.models.survey import Survey
from app.models.user import User
from app.utils.dependencies import get_current_user


# ---------------------------------------------------------
# Test configuration
# ---------------------------------------------------------

TEST_SURVEY_ID = 2


# ---------------------------------------------------------
# Create database session
# ---------------------------------------------------------

db = SessionLocal()


try:

    print()
    print("=== SYNTHETIC RESPONSE OWNERSHIP & SECURITY TEST ===")
    print()

    # -----------------------------------------------------
    # Find Survey 2
    # -----------------------------------------------------

    survey = (
        db.query(Survey)
        .filter(Survey.id == TEST_SURVEY_ID)
        .first()
    )

    if not survey:
        raise RuntimeError(
            f"Survey {TEST_SURVEY_ID} was not found."
        )

    # -----------------------------------------------------
    # Find actual survey owner
    # -----------------------------------------------------

    owner = (
        db.query(User)
        .filter(User.id == survey.user_id)
        .first()
    )

    if not owner:
        raise RuntimeError(
            f"Owner of Survey {TEST_SURVEY_ID} was not found."
        )

    # -----------------------------------------------------
    # Find another user
    # -----------------------------------------------------

    another_user = (
        db.query(User)
        .filter(User.id != owner.id)
        .first()
    )

    if not another_user:
        raise RuntimeError(
            "A second user is required for the ownership test."
        )

    print(
        "Survey:",
        survey.id,
        survey.title,
    )

    print(
        "Survey Owner:",
        owner.id,
    )

    print(
        "Other User:",
        another_user.id,
    )

    # -----------------------------------------------------
    # Override current user with another user
    # -----------------------------------------------------

    def override_get_current_user():
        return another_user

    app.dependency_overrides[
        get_current_user
    ] = override_get_current_user

    # -----------------------------------------------------
    # Patch generation service
    #
    # It should NOT be called because ownership
    # must fail before generation starts.
    # -----------------------------------------------------

    with patch(
        "app.routers.synthetic_responses."
        "generate_and_store_synthetic_responses_for_personas"
    ) as mocked_generation:

        client = TestClient(app)

        response = client.post(
            f"/api/synthetic-responses/generate/"
            f"{TEST_SURVEY_ID}"
        )

        print()
        print(
            "HTTP Status:",
            response.status_code,
        )

        print(
            "Response:",
            response.json(),
        )

        # -------------------------------------------------
        # Verify ownership rejection
        # -------------------------------------------------

        if response.status_code != 404:
            raise RuntimeError(
                "Expected HTTP 404 for unauthorized survey access."
            )

        data = response.json()

        if data.get("detail") != "Survey not found.":
            raise RuntimeError(
                "Incorrect ownership error message."
            )

        # -------------------------------------------------
        # Verify generation was never called
        # -------------------------------------------------

        if mocked_generation.called:
            raise RuntimeError(
                "Generation service was called despite "
                "ownership failure."
            )

        print()
        print(
            "Cross-user survey access was rejected."
        )

        print(
            "Generation service was not called."
        )

        print()
        print(
            "TEST PASSED."
        )

finally:

    # -----------------------------------------------------
    # Clear dependency overrides
    # -----------------------------------------------------

    app.dependency_overrides.clear()

    # -----------------------------------------------------
    # Close database session
    # -----------------------------------------------------

    db.close()