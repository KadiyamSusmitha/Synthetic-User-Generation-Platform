import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.experiment import Experiment
from app.models.persona import Persona
from app.models.survey import Survey
from app.models.survey_question import SurveyQuestion
from app.models.synthetic_response import SyntheticResponse
from app.models.user import User
from app.services.ai_exceptions import AIServiceError
from app.services.synthetic_response_service import (
    generate_and_store_synthetic_responses_for_personas,
)
from app.utils.dependencies import get_current_user


logger = logging.getLogger(__name__)


router = APIRouter(
    prefix="/api/synthetic-responses",
    tags=["Synthetic Responses"],
)


# ---------------------------------------------------------
# Generate Synthetic Responses
# ---------------------------------------------------------

@router.post(
    "/generate/{survey_id}",
    status_code=status.HTTP_201_CREATED,
)
def generate_synthetic_responses(
    survey_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # -----------------------------------------------------
    # Get survey with ownership check
    # -----------------------------------------------------

    survey = (
        db.query(Survey)
        .filter(
            Survey.id == survey_id,
            Survey.user_id == current_user.id,
        )
        .first()
    )

    if not survey:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Survey not found.",
        )

    if survey.status != "Ready":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Survey must be marked as ready before synthetic responses can be generated.",
        )

    # -----------------------------------------------------
    # Survey must be linked to an experiment
    # -----------------------------------------------------

    if survey.experiment_id is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "Synthetic responses cannot be generated "
                "because this survey is not linked to an experiment."
            ),
        )

    # -----------------------------------------------------
    # Get experiment with ownership check
    # -----------------------------------------------------

    experiment = (
        db.query(Experiment)
        .filter(
            Experiment.id == survey.experiment_id,
            Experiment.user_id == current_user.id,
        )
        .first()
    )

    if not experiment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Experiment not found.",
        )

    # -----------------------------------------------------
    # Get personas
    # -----------------------------------------------------

    personas = (
        db.query(Persona)
        .filter(
            Persona.experiment_id == experiment.id,
        )
        .order_by(
            Persona.created_at.asc(),
            Persona.id.asc(),
        )
        .all()
    )

    if not personas:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "No personas are available for this experiment. "
                "Generate personas before generating synthetic responses."
            ),
        )

    # -----------------------------------------------------
    # Get survey questions
    # -----------------------------------------------------

    questions = (
        db.query(SurveyQuestion)
        .filter(
            SurveyQuestion.survey_id == survey.id,
        )
        .order_by(
            SurveyQuestion.display_order.asc(),
            SurveyQuestion.id.asc(),
        )
        .all()
    )

    if not questions:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "No survey questions are available. "
                "Add questions before generating synthetic responses."
            ),
        )

    logger.info(
        "Starting synthetic response generation: "
        "survey=%s experiment=%s personas=%s questions=%s user=%s",
        survey.id,
        experiment.id,
        len(personas),
        len(questions),
        current_user.id,
    )

    try:
        # -------------------------------------------------
        # Generate and store all synthetic responses
        # -------------------------------------------------

        synthetic_responses = (
            generate_and_store_synthetic_responses_for_personas(
                personas=personas,
                experiment=experiment,
                survey_id=survey.id,
                questions=questions,
                db=db,
            )
        )

        # -------------------------------------------------
        # Commit only after all personas succeed
        # -------------------------------------------------

        db.commit()

        # -------------------------------------------------
        # Refresh generated records
        # -------------------------------------------------

        for synthetic_response in synthetic_responses:
            db.refresh(synthetic_response)

        logger.info(
            "Synthetic response generation completed: "
            "survey=%s generated=%s user=%s",
            survey.id,
            len(synthetic_responses),
            current_user.id,
        )

        return {
            "message": "Synthetic responses generated successfully.",
            "survey_id": survey.id,
            "experiment_id": experiment.id,
            "persona_count": len(personas),
            "question_count": len(questions),
            "generated_response_count": len(
                synthetic_responses
            ),
            "synthetic_response_ids": [
                synthetic_response.id
                for synthetic_response in synthetic_responses
            ],
        }

    # -----------------------------------------------------
    # AI Service Errors
    # -----------------------------------------------------

    except AIServiceError as error:
        db.rollback()

        logger.error(
            "AI service error while generating synthetic "
            "responses for survey %s: %s",
            survey_id,
            error.message,
        )

        raise HTTPException(
            status_code=error.status_code,
            detail=error.message,
        ) from error

    # -----------------------------------------------------
    # Validation Errors
    # -----------------------------------------------------

    except ValueError as error:
        db.rollback()

        logger.warning(
            "Synthetic response validation failed "
            "for survey %s: %s",
            survey_id,
            error,
        )

        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        ) from error

    # -----------------------------------------------------
    # Unexpected Errors
    # -----------------------------------------------------

    except Exception as error:
        db.rollback()

        logger.exception(
            "Failed to generate synthetic responses "
            "for survey %s.",
            survey_id,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate synthetic responses.",
        ) from error

# ---------------------------------------------------------
# Get Generated Synthetic Responses
# ---------------------------------------------------------

@router.get(
    "/survey/{survey_id}",
)
def get_synthetic_responses(
    survey_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # -----------------------------------------------------
    # Get survey with ownership check
    # -----------------------------------------------------

    survey = (
        db.query(Survey)
        .filter(
            Survey.id == survey_id,
            Survey.user_id == current_user.id,
        )
        .first()
    )

    if not survey:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Survey not found.",
        )

    if survey.status != "Ready":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Survey must be marked as ready before generated responses can be viewed.",
        )

    # -----------------------------------------------------
    # Survey must be linked to an experiment
    # -----------------------------------------------------

    if survey.experiment_id is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "Synthetic responses cannot be viewed "
                "because this survey is not linked to an experiment."
            ),
        )

    # -----------------------------------------------------
    # Verify experiment ownership
    # -----------------------------------------------------

    experiment = (
        db.query(Experiment)
        .filter(
            Experiment.id == survey.experiment_id,
            Experiment.user_id == current_user.id,
        )
        .first()
    )

    if not experiment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Experiment not found.",
        )

    # -----------------------------------------------------
    # Get survey questions
    # -----------------------------------------------------

    questions = (
        db.query(SurveyQuestion)
        .filter(
            SurveyQuestion.survey_id == survey.id,
        )
        .order_by(
            SurveyQuestion.display_order.asc(),
            SurveyQuestion.id.asc(),
        )
        .all()
    )

    # -----------------------------------------------------
    # Get synthetic responses
    # -----------------------------------------------------

    synthetic_responses = (
        db.query(SyntheticResponse)
        .filter(
            SyntheticResponse.survey_id == survey.id,
            SyntheticResponse.experiment_id == experiment.id,
        )
        .order_by(
            SyntheticResponse.created_at.asc(),
            SyntheticResponse.id.asc(),
        )
        .all()
    )

    # -----------------------------------------------------
    # Build response
    # -----------------------------------------------------

    responses = []

    for synthetic_response in synthetic_responses:

        persona = (
            db.query(Persona)
            .filter(
                Persona.id == synthetic_response.persona_id,
                Persona.experiment_id == experiment.id,
            )
            .first()
        )

        responses.append(
            {
                "id": synthetic_response.id,
                "persona_id": synthetic_response.persona_id,
                "persona_name": (
                    persona.name
                    if persona
                    else None
                ),
                "response_data": (
                    synthetic_response.response_data
                ),
                "created_at": (
                    synthetic_response.created_at
                ),
            }
        )

    return {
        "survey_id": survey.id,
        "survey_title": survey.title,
        "experiment_id": experiment.id,
        "experiment_name": experiment.name,
        "question_count": len(questions),
        "questions": [
            {
                "id": question.id,
                "question": question.question,
                "question_type": question.question_type,
                "options": question.options or [],
                "required": question.required,
                "display_order": question.display_order,
            }
            for question in questions
        ],
        "generated_response_count": len(responses),
        "responses": responses,
    }