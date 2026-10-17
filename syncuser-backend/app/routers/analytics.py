from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.experiment import Experiment
from app.models.user import User
from app.schemas.analytics import AnalyticsResponse
from app.services.analytics_service import analytics_service
from app.utils.dependencies import get_current_user
from app.schemas.sentiment import SentimentAnalytics
from app.services.sentiment_service import sentiment_service
from app.services.theme_service import theme_service
from app.services.insight_service import insight_service
from app.services.engagement_service import engagement_service

router = APIRouter(
    prefix="/api/analytics",
    tags=["Analytics"],
)


@router.get(
    "/{experiment_id}",
    response_model=AnalyticsResponse,
)
def get_experiment_analytics(
    experiment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return analytics for an experiment owned by
    the currently authenticated user.
    """

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

    try:
        analytics = (
            analytics_service.get_experiment_analytics(
                db=db,
                experiment=experiment,
            )
        )

        return analytics

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate analytics: {str(exc)}",
        ) from exc

@router.get(
    "/{experiment_id}/questions/{question_id}",
)
def get_question_analytics(
    experiment_id: int,
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return analytics for one question belonging
    to an experiment owned by the current user.
    """

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

    try:
        analytics = analytics_service.get_question_analytics(
            db=db,
            experiment=experiment,
            question_id=question_id,
        )

        return analytics

    except ValueError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate question analytics: {str(exc)}",
        ) from exc

@router.get(
    "/{experiment_id}/personas",
)
def get_persona_analytics(
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

    try:
        analytics = analytics_service.get_experiment_analytics(
            db=db,
            experiment=experiment,
        )

        return {
            "experiment_id": experiment.id,
            "personas": analytics["persona_patterns"],
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate persona analytics: {str(exc)}",
        ) from exc

@router.get(
    "/{experiment_id}/demographics",
)
def get_demographic_analytics(
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

    try:
        analytics = analytics_service.get_experiment_analytics(
            db=db,
            experiment=experiment,
        )

        return {
            "experiment_id": experiment.id,
            "demographics": analytics["demographic_patterns"],
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate demographic analytics: {str(exc)}",
        ) from exc

@router.get(
    "/{experiment_id}/sentiment",
    response_model=SentimentAnalytics,
)
def get_sentiment_analytics(
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

    try:
        sentiment = (
            sentiment_service.analyze_experiment(
                db=db,
                experiment_id=experiment.id,
            )
        )

        return sentiment

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to generate sentiment analytics: "
                f"{str(exc)}"
            ),
        ) from exc

@router.get(
    "/{experiment_id}/themes",
)
def get_theme_analytics(
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

    try:
        return theme_service.analyze_experiment(
            db=db,
            experiment=experiment,
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to generate theme analytics: "
                f"{str(exc)}"
            ),
        ) from exc

@router.get(
    "/{experiment_id}/insights",
)
def get_insight_analytics(
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

    try:
        insights = insight_service.analyze_experiment(
            db=db,
            experiment=experiment,
        )

        return insights

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to generate insight analytics: "
                f"{str(exc)}"
            ),
        ) from exc

@router.get(
    "/{experiment_id}/engagement-trend",
)
def get_engagement_trend(
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

    try:
        trend = engagement_service.analyze_experiment(
            db=db,
            experiment=experiment,
        )

        return trend

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to generate engagement trend: "
                f"{str(exc)}"
            ),
        ) from exc