from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from app.models.experiment import Experiment
from app.models.persona import Persona
from app.models.survey import Survey
from app.models.survey_question import SurveyQuestion
from app.models.synthetic_response import SyntheticResponse


class ReportDataService:
    SUPPORTED_REPORT_TYPES = {
        "experiment_summary",
        "persona_analysis",
        "survey_results",
        "insights",
    }

    def _get_surveys(
        self,
        db: Session,
        experiment_id: int,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> list[Survey]:
        query = (
            db.query(Survey)
            .filter(
                Survey.experiment_id == experiment_id,
            )
        )

        if start_date is not None:
            query = query.filter(
                Survey.created_at >= start_date,
            )

        if end_date is not None:
            query = query.filter(
                Survey.created_at <= end_date,
            )

        return (
            query
            .order_by(
                Survey.created_at.asc(),
            )
            .all()
        )

    def _get_questions(
        self,
        db: Session,
        survey_ids: list[int],
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> list[SurveyQuestion]:
        if not survey_ids:
            return []

        query = (
            db.query(SurveyQuestion)
            .filter(
                SurveyQuestion.survey_id.in_(
                    survey_ids
                ),
            )
        )

        if start_date is not None:
            query = query.filter(
                SurveyQuestion.created_at >= start_date,
            )

        if end_date is not None:
            query = query.filter(
                SurveyQuestion.created_at <= end_date,
            )

        return (
            query
            .order_by(
                SurveyQuestion.survey_id.asc(),
                SurveyQuestion.display_order.asc(),
            )
            .all()
        )

    def _get_personas(
        self,
        db: Session,
        experiment_id: int,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> list[Persona]:
        query = (
            db.query(Persona)
            .filter(
                Persona.experiment_id == experiment_id,
            )
        )

        if start_date is not None:
            query = query.filter(
                Persona.created_at >= start_date,
            )

        if end_date is not None:
            query = query.filter(
                Persona.created_at <= end_date,
            )

        return (
            query
            .order_by(
                Persona.created_at.asc(),
                Persona.id.asc(),
            )
            .all()
        )

    def _get_synthetic_responses(
        self,
        db: Session,
        experiment_id: int,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> list[SyntheticResponse]:
        query = (
            db.query(SyntheticResponse)
            .filter(
                SyntheticResponse.experiment_id
                == experiment_id,
            )
        )

        if start_date is not None:
            query = query.filter(
                SyntheticResponse.created_at >= start_date,
            )

        if end_date is not None:
            query = query.filter(
                SyntheticResponse.created_at <= end_date,
            )

        return (
            query
            .order_by(
                SyntheticResponse.created_at.asc(),
            )
            .all()
        )

    def _build_question_data(
        self,
        questions: list[SurveyQuestion],
    ) -> list[dict[str, Any]]:
        question_data = []

        for question in questions:
            question_data.append(
                {
                    "id": question.id,
                    "survey_id": question.survey_id,
                    "question": question.question,
                    "question_type": question.question_type,
                    "options": question.options or [],
                    "required": question.required,
                    "display_order": question.display_order,
                    "created_at": (
                        question.created_at.isoformat()
                        if question.created_at
                        else None
                    ),
                    "updated_at": (
                        question.updated_at.isoformat()
                        if question.updated_at
                        else None
                    ),
                }
            )

        return question_data

    def _build_survey_data(
        self,
        surveys: list[Survey],
    ) -> list[dict[str, Any]]:
        survey_data = []

        for survey in surveys:
            survey_data.append(
                {
                    "id": survey.id,
                    "title": survey.title,
                    "status": survey.status,
                    "created_at": (
                        survey.created_at.isoformat()
                        if survey.created_at
                        else None
                    ),
                    "updated_at": (
                        survey.updated_at.isoformat()
                        if survey.updated_at
                        else None
                    ),
                }
            )

        return survey_data

    def _build_persona_data(
        self,
        personas: list[Persona],
    ) -> list[dict[str, Any]]:
        persona_data = []

        for persona in personas:
            persona_data.append(
                {
                    "id": persona.id,
                    "name": persona.name,
                    "gender": persona.gender,
                    "age": persona.age,
                    "occupation": persona.occupation,
                    "location": persona.location,
                    "description": persona.description,
                    "goals": persona.goals or [],
                    "pain_points": persona.pain_points or [],
                    "behaviors": persona.behaviors or [],
                    "interests": persona.interests or [],
                    "needs": persona.needs or [],
                    "created_at": (
                        persona.created_at.isoformat()
                        if persona.created_at
                        else None
                    ),
                }
            )

        return persona_data

    def _build_response_data(
        self,
        responses: list[SyntheticResponse],
    ) -> list[dict[str, Any]]:
        response_data = []

        for response in responses:
            data = response.response_data or {}

            answers = data.get(
                "answers",
                data,
            )

            response_data.append(
                {
                    "id": response.id,
                    "survey_id": response.survey_id,
                    "experiment_id": response.experiment_id,
                    "persona_id": response.persona_id,
                    "persona_name": data.get(
                        "persona_name",
                    ),
                    "generation_id": response.generation_id,
                    "model_name": response.model_name,
                    "generation_status": response.generation_status,
                    "created_at": (
                        response.created_at.isoformat()
                        if response.created_at
                        else None
                    ),
                    "answers": answers,
                }
            )

        return response_data

    def _build_summary(
        self,
        experiment: Experiment,
        surveys: list[Survey],
        questions: list[SurveyQuestion],
        personas: list[Persona],
        responses: list[SyntheticResponse],
    ) -> dict[str, Any]:
        participating_persona_ids = {
            response.persona_id
            for response in responses
            if response.persona_id is not None
        }

        return {
            "experiment_id": experiment.id,
            "experiment_name": experiment.name,
            "target_audience": experiment.target_audience,
            "description": experiment.description,
            "status": experiment.status,
            "survey_count": len(surveys),
            "question_count": len(questions),
            "persona_count": len(personas),
            "participating_persona_count": len(
                participating_persona_ids
            ),
            "synthetic_response_count": len(
                responses
            ),
        }

    def prepare_report_data(
        self,
        db: Session,
        experiment: Experiment,
        report_type: str,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> dict[str, Any]:
        if report_type not in self.SUPPORTED_REPORT_TYPES:
            raise ValueError(
                f"Unsupported report type: {report_type}"
            )

        if (
            start_date is not None
            and end_date is not None
            and start_date > end_date
        ):
            raise ValueError(
                "Report start date cannot be after end date."
            )

        surveys = self._get_surveys(
            db=db,
            experiment_id=experiment.id,
            start_date=start_date,
            end_date=end_date,
        )

        survey_ids = [
            survey.id
            for survey in surveys
        ]

        questions = self._get_questions(
            db=db,
            survey_ids=survey_ids,
            start_date=start_date,
            end_date=end_date,
        )

        personas = self._get_personas(
            db=db,
            experiment_id=experiment.id,
            start_date=start_date,
            end_date=end_date,
        )

        responses = self._get_synthetic_responses(
            db=db,
            experiment_id=experiment.id,
            start_date=start_date,
            end_date=end_date,
        )

        summary = self._build_summary(
            experiment=experiment,
            surveys=surveys,
            questions=questions,
            personas=personas,
            responses=responses,
        )

        return {
            "report": {
                "type": report_type,
                "generated_at": datetime.utcnow().isoformat(),
                "date_range": {
                    "start": (
                        start_date.isoformat()
                        if start_date
                        else None
                    ),
                    "end": (
                        end_date.isoformat()
                        if end_date
                        else None
                    ),
                },
            },
            "experiment": {
                "id": experiment.id,
                "name": experiment.name,
                "target_audience": experiment.target_audience,
                "description": experiment.description,
                "status": experiment.status,
            },
            "summary": summary,
            "surveys": self._build_survey_data(
                surveys,
            ),
            "questions": self._build_question_data(
                questions,
            ),
            "personas": self._build_persona_data(
                personas,
            ),
            "responses": self._build_response_data(
                responses,
            ),
        }


report_data_service = ReportDataService()