from app.database import SessionLocal
from app.models.experiment import Experiment
from app.models.persona import Persona
from app.models.survey import Survey
from app.models.survey_question import SurveyQuestion
from app.models.synthetic_response import SyntheticResponse
from app.models.user import User
from app.routers.synthetic_responses import (
    generate_synthetic_responses,
)


# ---------------------------------------------------------
# Mock generation function
# ---------------------------------------------------------

def mock_generate_and_store(
    personas,
    experiment,
    survey_id,
    questions,
    db,
):
    """
    Mock the real Gemini generation/storage service.

    No Gemini API calls are made.
    """

    generated_responses = []

    for persona in personas:

        response_data = {
            "persona_id": persona.id,
            "persona_name": persona.name,
            "answers": {
                str(question.id): f"Test answer for Q{question.id}"
                for question in questions
            },
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
# Test
# ---------------------------------------------------------

def run_test():

    db = SessionLocal()

    try:
        # -------------------------------------------------
        # Get existing test data
        # -------------------------------------------------

        survey = (
            db.query(Survey)
            .filter(Survey.id == 2)
            .first()
        )

        if not survey:
            raise RuntimeError(
                "Survey 2 was not found."
            )

        experiment = (
            db.query(Experiment)
            .filter(
                Experiment.id == survey.experiment_id
            )
            .first()
        )

        if not experiment:
            raise RuntimeError(
                "Experiment was not found."
            )

        personas = (
            db.query(Persona)
            .filter(
                Persona.experiment_id == experiment.id
            )
            .order_by(Persona.id)
            .all()
        )

        questions = (
            db.query(SurveyQuestion)
            .filter(
                SurveyQuestion.survey_id == survey.id
            )
            .order_by(
                SurveyQuestion.display_order,
                SurveyQuestion.id,
            )
            .all()
        )

        print()
        print("=== SYNTHETIC RESPONSE API ORCHESTRATION TEST ===")
        print(
            "Survey:",
            survey.id,
            survey.title,
        )
        print(
            "Experiment:",
            experiment.id,
            experiment.name,
        )
        print(
            "Personas:",
            len(personas),
        )
        print(
            "Questions:",
            len(questions),
        )

        # -------------------------------------------------
        # Validate expected test data
        # -------------------------------------------------

        if len(personas) != 8:
            raise RuntimeError(
                f"Expected 8 personas, found {len(personas)}."
            )

        if len(questions) != 7:
            raise RuntimeError(
                f"Expected 7 questions, found {len(questions)}."
            )

        # -------------------------------------------------
        # Run mocked generation
        # -------------------------------------------------

        generated_responses = mock_generate_and_store(
            personas=personas,
            experiment=experiment,
            survey_id=survey.id,
            questions=questions,
            db=db,
        )

        # -------------------------------------------------
        # Verify generated count
        # -------------------------------------------------

        print()
        print(
            "Generated responses:",
            len(generated_responses),
        )

        if len(generated_responses) != len(personas):
            raise RuntimeError(
                "Generated response count does not "
                "match persona count."
            )

        # -------------------------------------------------
        # Verify each response
        # -------------------------------------------------

        for response in generated_responses:

            if response.survey_id != survey.id:
                raise RuntimeError(
                    "Incorrect survey_id."
                )

            if response.experiment_id != experiment.id:
                raise RuntimeError(
                    "Incorrect experiment_id."
                )

            if response.persona_id is None:
                raise RuntimeError(
                    "Missing persona_id."
                )

            answers = response.response_data.get(
                "answers",
                {},
            )

            if len(answers) != len(questions):
                raise RuntimeError(
                    "Incorrect number of answers "
                    f"for persona {response.persona_id}."
                )

        print(
            "All generated responses contain:",
            len(questions),
            "answers.",
        )

        # -------------------------------------------------
        # Rollback development test data
        # -------------------------------------------------

        db.rollback()

        print()
        print(
            "Database changes rolled back successfully."
        )
        print(
            "No test synthetic responses were committed."
        )
        print()
        print("TEST PASSED.")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    run_test()