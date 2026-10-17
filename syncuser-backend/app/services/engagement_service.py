
from collections import defaultdict

from sqlalchemy.orm import Session

from app.models.experiment import Experiment
from app.models.survey import Survey
from app.models.survey_question import SurveyQuestion
from app.models.synthetic_response import SyntheticResponse
from app.services.sentiment_service import sentiment_service


class EngagementService:
    def _get_synthetic_responses(
        self,
        db: Session,
        experiment: Experiment,
    ) -> list[SyntheticResponse]:
        ready_surveys = (
            db.query(Survey)
            .filter(
                Survey.experiment_id == experiment.id,
                Survey.status == "Ready",
            )
            .all()
        )

        survey_ids = [
            survey.id
            for survey in ready_surveys
        ]

        if not survey_ids:
            return []

        return (
            db.query(SyntheticResponse)
            .filter(
                SyntheticResponse.experiment_id == experiment.id,
                SyntheticResponse.survey_id.in_(survey_ids),
            )
            .order_by(
                SyntheticResponse.created_at.asc(),
                SyntheticResponse.id.asc(),
            )
            .all()
        )

    def analyze_experiment(
        self,
        db: Session,
        experiment: Experiment,
    ) -> dict:
        responses = self._get_synthetic_responses(
            db=db,
            experiment=experiment,
        )

        if not responses:
            return {
                "experiment_id": experiment.id,
                "total_responses": 0,
                "trend": [],
            }

        survey_ids = [
            survey.id
            for survey in (
                db.query(Survey)
                .filter(
                    Survey.experiment_id == experiment.id,
                    Survey.status == "Ready",
                )
                .all()
            )
        ]

        questions = []

        if survey_ids:
            questions = (
            db.query(SurveyQuestion)
            .filter(
                SurveyQuestion.survey_id.in_(survey_ids)
            )
            .order_by(
                SurveyQuestion.display_order.asc(),
                SurveyQuestion.id.asc(),
            )
            .all()
            )

        sentiment_result = sentiment_service.analyze_responses(
            responses,
            questions,
        )

        response_lookup = {
            response.id: response
            for response in responses
        }

        daily_totals = defaultdict(
            lambda: {
                "positive": 0,
                "neutral": 0,
                "negative": 0,
            }
        )

        for item in sentiment_result.get("classifications", []):
            response_id = item.get("response_id")
            sentiment = str(item.get("sentiment", "")).lower()
            response = response_lookup.get(response_id)

            if response is None or not response.created_at:
                continue

            if sentiment not in {"positive", "neutral", "negative"}:
                continue

            date_key = response.created_at.date().isoformat()
            daily_totals[date_key][sentiment] += 1

        trend = [
            {
                "date": date_key,
                "positive": daily_totals[date_key]["positive"],
                "neutral": daily_totals[date_key]["neutral"],
                "negative": daily_totals[date_key]["negative"],
            }
            for date_key in sorted(daily_totals)
        ]

        return {
            "experiment_id": experiment.id,
            "total_responses": len(responses),
            "trend": trend,
        }


engagement_service = EngagementService()
