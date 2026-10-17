from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.experiment import Experiment
from app.models.persona import Persona
from app.models.user import User
from app.schemas.experiment import (
    ExperimentCreate,
    ExperimentUpdate,
    ExperimentResponse,
)
from app.utils.dependencies import get_current_user


router = APIRouter(
    prefix="/api/experiments",
    tags=["Experiments"],
)


@router.post(
    "/",
    response_model=ExperimentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_experiment(
    experiment_data: ExperimentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    experiment = Experiment(
        user_id=current_user.id,
        name=experiment_data.name,
        target_audience=experiment_data.target_audience,
        description=experiment_data.description,
    )

    db.add(experiment)
    db.commit()
    db.refresh(experiment)

    return {
        "id": experiment.id,
        "name": experiment.name,
        "target_audience": experiment.target_audience,
        "description": experiment.description,
        "status": experiment.status,
        "persona_count": 0,
        "created_at": experiment.created_at,
        "updated_at": experiment.updated_at,
    }


@router.get(
    "/",
    response_model=list[ExperimentResponse],
)
def get_experiments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    experiments = (
        db.query(
            Experiment,
            func.count(Persona.id).label("persona_count"),
        )
        .outerjoin(
            Persona,
            Persona.experiment_id == Experiment.id,
        )
        .filter(
            Experiment.user_id == current_user.id,
        )
        .group_by(
            Experiment.id,
        )
        .order_by(
            Experiment.updated_at.desc(),
        )
        .all()
    )

    return [
        {
            "id": experiment.id,
            "name": experiment.name,
            "target_audience": experiment.target_audience,
            "description": experiment.description,
            "status": experiment.status,
            "persona_count": persona_count,
            "created_at": experiment.created_at,
            "updated_at": experiment.updated_at,
        }
        for experiment, persona_count in experiments
    ]

@router.get(
    "/{experiment_id}",
    response_model=ExperimentResponse,
)
def get_experiment(
    experiment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    experiment = (
        db.query(
            Experiment,
            func.count(Persona.id).label("persona_count"),
        )
        .outerjoin(
            Persona,
            Persona.experiment_id == Experiment.id,
        )
        .filter(
            Experiment.id == experiment_id,
            Experiment.user_id == current_user.id,
        )
        .group_by(
            Experiment.id,
        )
        .first()
    )

    if not experiment:
        raise HTTPException(
            status_code=404,
            detail="Experiment not found.",
        )

    experiment_data, persona_count = experiment

    return {
        "id": experiment_data.id,
        "name": experiment_data.name,
        "target_audience": experiment_data.target_audience,
        "description": experiment_data.description,
        "status": experiment_data.status,
        "persona_count": persona_count,
        "created_at": experiment_data.created_at,
        "updated_at": experiment_data.updated_at,
    }

@router.patch(
    "/{experiment_id}/start",
    response_model=ExperimentResponse,
)
def start_experiment(
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
            status_code=404,
            detail="Experiment not found.",
        )

    if experiment.status != "Draft":
        raise HTTPException(
            status_code=400,
            detail="Only a Draft experiment can be started.",
        )

    experiment.status = "In Progress"

    db.commit()
    db.refresh(experiment)

    persona_count = (
        db.query(func.count(Persona.id))
        .filter(
            Persona.experiment_id == experiment.id,
        )
        .scalar()
    )

    return {
        "id": experiment.id,
        "name": experiment.name,
        "target_audience": experiment.target_audience,
        "description": experiment.description,
        "status": experiment.status,
        "persona_count": persona_count,
        "created_at": experiment.created_at,
        "updated_at": experiment.updated_at,
    }


@router.patch(
    "/{experiment_id}/complete",
    response_model=ExperimentResponse,
)
def complete_experiment(
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
            status_code=404,
            detail="Experiment not found.",
        )

    if experiment.status != "In Progress":
        raise HTTPException(
            status_code=400,
            detail="Only an In Progress experiment can be completed.",
        )

    experiment.status = "Completed"

    db.commit()
    db.refresh(experiment)

    persona_count = (
        db.query(func.count(Persona.id))
        .filter(
            Persona.experiment_id == experiment.id,
        )
        .scalar()
    )

    return {
        "id": experiment.id,
        "name": experiment.name,
        "target_audience": experiment.target_audience,
        "description": experiment.description,
        "status": experiment.status,
        "persona_count": persona_count,
        "created_at": experiment.created_at,
        "updated_at": experiment.updated_at,
    }

@router.patch(
    "/{experiment_id}",
    response_model=ExperimentResponse,
)
def update_experiment(
    experiment_id: int,
    experiment_data: ExperimentUpdate,
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
            status_code=404,
            detail="Experiment not found.",
        )

    update_data = experiment_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(experiment, field, value)

    db.commit()
    db.refresh(experiment)

    persona_count = (
        db.query(func.count(Persona.id))
        .filter(
            Persona.experiment_id == experiment.id,
        )
        .scalar()
    )

    return {
        "id": experiment.id,
        "name": experiment.name,
        "target_audience": experiment.target_audience,
        "description": experiment.description,
        "status": experiment.status,
        "persona_count": persona_count,
        "created_at": experiment.created_at,
        "updated_at": experiment.updated_at,
    }

@router.delete(
    "/{experiment_id}",
)
def delete_experiment(
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
            status_code=404,
            detail="Experiment not found.",
        )

    db.delete(experiment)
    db.commit()

    return {
        "message": "Experiment deleted successfully.",
    }