
import logging
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.experiment import Experiment
from app.models.persona import Persona
from app.models.survey import Survey
from app.models.report import Report
from app.models.response import Response
from app.models.synthetic_response import SyntheticResponse
from app.models.interview import Interview
from app.schemas.dashboard import DashboardResponse
from app.utils.dependencies import get_current_user


router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"],
)


@router.get("/", response_model=DashboardResponse)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        # Dashboard statistics
        total_experiments = (
            db.query(func.count(Experiment.id))
            .filter(Experiment.user_id == current_user.id)
            .scalar()
        ) or 0

        personas_generated = (
            db.query(func.count(Persona.id))
            .join(
                Experiment,
                Persona.experiment_id == Experiment.id,
            )
            .filter(Experiment.user_id == current_user.id)
            .scalar()
        ) or 0

        surveys_conducted = (
            db.query(func.count(Survey.id))
            .filter(Survey.user_id == current_user.id)
            .scalar()
        ) or 0

        reports_generated = (
            db.query(func.count(Report.id))
            .filter(Report.user_id == current_user.id)
            .scalar()
        ) or 0

        # All experiments, newest updated first
        recent_experiments = (
            db.query(Experiment)
            .filter(Experiment.user_id == current_user.id)
            .order_by(Experiment.updated_at.desc())
            .all()
        )

        today = date.today()

        # Actual survey responses by date
        response_counts = (
            db.query(
                func.date(Response.created_at).label("date"),
                func.count(Response.id).label("count"),
            )
            .join(
                Survey,
                Response.survey_id == Survey.id,
            )
            .filter(Survey.user_id == current_user.id)
            .group_by(func.date(Response.created_at))
            .all()
        )

        # AI-generated synthetic responses by date
        synthetic_response_counts = (
            db.query(
                func.date(SyntheticResponse.created_at).label("date"),
                func.count(SyntheticResponse.id).label("count"),
            )
            .join(
                Survey,
                SyntheticResponse.survey_id == Survey.id,
            )
            .filter(Survey.user_id == current_user.id)
            .group_by(func.date(SyntheticResponse.created_at))
            .all()
        )

        # Combine actual and synthetic survey responses per date.
        response_count_map = {}

        for response_date, count in response_counts:
            if response_date is not None:
                key = str(response_date)
                response_count_map[key] = (
                    response_count_map.get(key, 0) + count
                )

        for response_date, count in synthetic_response_counts:
            if response_date is not None:
                key = str(response_date)
                response_count_map[key] = (
                    response_count_map.get(key, 0) + count
                )

        # Interview activity by date, scoped to the current user.
        interview_counts = (
            db.query(
                func.date(Interview.created_at).label("date"),
                func.count(Interview.id).label("count"),
            )
            .filter(Interview.user_id == current_user.id)
            .group_by(func.date(Interview.created_at))
            .all()
        )

        interview_count_map = {
            str(interview_date): count
            for interview_date, count in interview_counts
            if interview_date is not None
        }

        # Build the date range from actual records.
        available_dates = (
            list(response_count_map.keys())
            + list(interview_count_map.keys())
        )

        if available_dates:
            start_date = min(
                date.fromisoformat(item)
                for item in available_dates
            )
            # Do not generate a future date range.
            start_date = min(start_date, today)
        else:
            # Show a useful empty chart when there is no activity.
            start_date = today - timedelta(days=8)

        chart_dates = [
            start_date + timedelta(days=day)
            for day in range((today - start_date).days + 1)
        ]

        response_chart = [
            {
                "date": chart_date.isoformat(),
                "count": response_count_map.get(
                    chart_date.isoformat(), 0
                ),
            }
            for chart_date in chart_dates
        ]

        interview_chart = [
            {
                "date": chart_date.isoformat(),
                "count": interview_count_map.get(
                    chart_date.isoformat(), 0
                ),
            }
            for chart_date in chart_dates
        ]

        return {
            "username": current_user.username,
            "statistics": {
                "total_experiments": total_experiments,
                "personas_generated": personas_generated,
                "surveys_conducted": surveys_conducted,
                "reports_generated": reports_generated,
            },
            "recent_experiments": [
                {
                    "id": experiment.id,
                    "name": experiment.name,
                    "description": experiment.description,
                    "status": experiment.status,
                    "created_at": experiment.created_at,
                    "updated_at": experiment.updated_at,
                }
                for experiment in recent_experiments
            ],
            "response_chart": response_chart,
            "interview_chart": interview_chart,
        }

    except Exception as exc:
        logging.exception("Dashboard endpoint failed")
        raise HTTPException(
            status_code=500,
            detail="Failed to load dashboard data.",
        ) from exc
