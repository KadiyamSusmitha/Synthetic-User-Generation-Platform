import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.experiment import Experiment
from app.models.persona import Persona
from app.models.user import User
from app.schemas.persona import (
    PersonaGenerationRequest,
    PersonaResponse,
    PersonaUpdate,
)
from app.services.ai_exceptions import AIServiceError
from app.services.persona_service import generate_personas_for_experiment
from app.models.synthetic_response import SyntheticResponse
from app.utils.dependencies import get_current_user


logger = logging.getLogger(__name__)


router = APIRouter(
    prefix="/api/personas",
    tags=["Personas"],
)


# ---------------------------------------------------------
# Generate Personas
# ---------------------------------------------------------

@router.post(
    "/generate/{experiment_id}",
    status_code=status.HTTP_201_CREATED,
)
def generate_personas(
    experiment_id: int,
    request: PersonaGenerationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    experiment = (
        db.query(Experiment)
        .filter(
            Experiment.id == experiment_id,
            Experiment.user_id == current_user.id,
        )
        .first()
    )

    if not experiment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Experiment not found.",
        )

    try:
        # -------------------------------------------------
        # Get existing persona names
        # -------------------------------------------------

        existing_personas = (
            db.query(Persona)
            .filter(
                Persona.experiment_id == experiment.id
            )
            .all()
        )

        existing_names = [
            persona.name
            for persona in existing_personas
            if persona.name
        ]

        # -------------------------------------------------
        # Generate AI personas
        # -------------------------------------------------

        generated_personas = generate_personas_for_experiment(
            experiment=experiment,
            persona_count=request.persona_count,
            instructions=request.instructions,
            existing_names=existing_names,
        )

        # -------------------------------------------------
        # Save generated personas
        # -------------------------------------------------

        saved_personas = []

        for persona_data in generated_personas.personas:
            persona = Persona(
                experiment_id=experiment.id,
                name=persona_data.name,
                gender=persona_data.gender,
                description=persona_data.description,
                age=persona_data.age,
                occupation=persona_data.occupation,
                location=persona_data.location,
                goals=persona_data.goals,
                pain_points=persona_data.pain_points,
                behaviors=persona_data.behaviors,
                interests=persona_data.interests,
                needs=persona_data.needs,
            )

            db.add(persona)
            saved_personas.append(persona)

        db.commit()

        # -------------------------------------------------
        # Refresh database objects
        # -------------------------------------------------

        for persona in saved_personas:
            db.refresh(persona)

        # -------------------------------------------------
        # Sort newest personas first
        # -------------------------------------------------

        saved_personas.sort(
            key=lambda persona: persona.id,
            reverse=True,
        )

        return {
            "message": "Personas generated successfully.",
            "experiment_id": experiment.id,
            "persona_count": len(saved_personas),
            "personas": [
                {
                    "id": persona.id,
                    "experiment_id": persona.experiment_id,
                    "name": persona.name,
                    "gender": persona.gender,
                    "description": persona.description,
                    "age": persona.age,
                    "occupation": persona.occupation,
                    "location": persona.location,
                    "goals": persona.goals,
                    "pain_points": persona.pain_points,
                    "behaviors": persona.behaviors,
                    "interests": persona.interests,
                    "needs": persona.needs,
                    "created_at": persona.created_at,
                }
                for persona in saved_personas
            ],
        }

    # -----------------------------------------------------
    # AI Service Errors
    # -----------------------------------------------------

    except AIServiceError as error:
        db.rollback()

        logger.error(
            "AI service error while generating personas "
            "for experiment %s: %s",
            experiment_id,
            error.message,
        )

        raise HTTPException(
            status_code=error.status_code,
            detail=error.message,
        ) from error

    # -----------------------------------------------------
    # Persona Validation Errors
    # -----------------------------------------------------

    except ValueError as error:
        db.rollback()

        logger.warning(
            "Persona generation validation failed: %s",
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
            "Failed to generate personas for experiment %s.",
            experiment_id,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate personas.",
        ) from error


# ---------------------------------------------------------
# Get All Personas for an Experiment
# ---------------------------------------------------------

@router.get(
    "/experiment/{experiment_id}",
    response_model=list[PersonaResponse],
)
def get_personas_for_experiment(
    experiment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    experiment = (
        db.query(Experiment)
        .filter(
            Experiment.id == experiment_id,
            Experiment.user_id == current_user.id,
        )
        .first()
    )

    if not experiment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Experiment not found.",
        )

    personas = (
        db.query(Persona)
        .filter(
            Persona.experiment_id == experiment_id
        )
        .order_by(
            Persona.created_at.desc(),
            Persona.id.desc(),
        )
        .all()
    )

    return [
        {
            "id": persona.id,
            "experiment_id": persona.experiment_id,
            "name": persona.name,
            "gender": persona.gender,
            "description": persona.description,
            "age": persona.age,
            "occupation": persona.occupation,
            "location": persona.location,
            "goals": persona.goals,
            "pain_points": persona.pain_points,
            "behaviors": persona.behaviors,
            "interests": persona.interests,
            "needs": persona.needs,
            "created_at": persona.created_at,
        }
        for persona in personas
    ]


# ---------------------------------------------------------
# Get Single Persona
# ---------------------------------------------------------

@router.get(
    "/{persona_id}",
    response_model=PersonaResponse,
)
def get_persona(
    persona_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    persona = (
        db.query(Persona)
        .join(
            Experiment,
            Persona.experiment_id == Experiment.id,
        )
        .filter(
            Persona.id == persona_id,
            Experiment.user_id == current_user.id,
        )
        .first()
    )

    if not persona:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Persona not found.",
        )

    return {
        "id": persona.id,
        "experiment_id": persona.experiment_id,
        "name": persona.name,
        "gender": persona.gender,
        "description": persona.description,
        "age": persona.age,
        "occupation": persona.occupation,
        "location": persona.location,
        "goals": persona.goals,
        "pain_points": persona.pain_points,
        "behaviors": persona.behaviors,
        "interests": persona.interests,
        "needs": persona.needs,
        "created_at": persona.created_at,
    }


# ---------------------------------------------------------
# Update Persona
# ---------------------------------------------------------

@router.patch(
    "/{persona_id}",
    response_model=PersonaResponse,
)
def update_persona(
    persona_id: int,
    request: PersonaUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    persona = (
        db.query(Persona)
        .join(
            Experiment,
            Persona.experiment_id == Experiment.id,
        )
        .filter(
            Persona.id == persona_id,
            Experiment.user_id == current_user.id,
        )
        .first()
    )

    if not persona:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Persona not found.",
        )

    update_data = request.model_dump(
        exclude_unset=True,
    )

    # -----------------------------------------------------
    # Prevent duplicate persona names
    # within the same experiment
    # -----------------------------------------------------

    if "name" in update_data:
        new_name = update_data["name"].strip()

        if not new_name:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Persona name cannot be empty.",
            )

        duplicate_persona = (
            db.query(Persona)
            .filter(
                Persona.experiment_id == persona.experiment_id,
                Persona.id != persona.id,
                Persona.name.ilike(new_name),
            )
            .first()
        )

        if duplicate_persona:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "A persona with this name already exists "
                    "in this experiment."
                ),
            )

        update_data["name"] = new_name

    # -----------------------------------------------------
    # Apply updates
    # -----------------------------------------------------

    for field, value in update_data.items():
        setattr(persona, field, value)

    db.commit()
    db.refresh(persona)

    return {
        "id": persona.id,
        "experiment_id": persona.experiment_id,
        "name": persona.name,
        "gender": persona.gender,
        "description": persona.description,
        "age": persona.age,
        "occupation": persona.occupation,
        "location": persona.location,
        "goals": persona.goals,
        "pain_points": persona.pain_points,
        "behaviors": persona.behaviors,
        "interests": persona.interests,
        "needs": persona.needs,
        "created_at": persona.created_at,
    }


# ---------------------------------------------------------
# Delete Persona
# ---------------------------------------------------------

@router.delete(
    "/{persona_id}",
)
def delete_persona(
    persona_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    persona = (
        db.query(Persona)
        .join(
            Experiment,
            Persona.experiment_id == Experiment.id,
        )
        .filter(
            Persona.id == persona_id,
            Experiment.user_id == current_user.id,
        )
        .first()
    )

    if not persona:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Persona not found.",
        )

    # -----------------------------------------------------
    # Prevent deletion when synthetic responses exist
    # -----------------------------------------------------

    has_synthetic_responses = (
        db.query(SyntheticResponse.id)
        .filter(
            SyntheticResponse.persona_id == persona_id
        )
        .first()
    )

    if has_synthetic_responses:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "This persona cannot be deleted because it has "
                "generated synthetic responses. Delete or preserve "
                "the associated response history before removing "
                "this persona."
            ),
        )

    # -----------------------------------------------------
    # Delete persona when no synthetic responses exist
    # -----------------------------------------------------

    try:
        db.delete(persona)
        db.commit()

    except Exception:
        db.rollback()

        logger.exception(
            "Failed to delete persona %s.",
            persona_id,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete persona.",
        )

    return {
        "message": "Persona deleted successfully.",
        "persona_id": persona_id,
    }