from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from app.models.experiment import Experiment
from app.services.report_data_service import report_data_service


class ReportGenerationService:
    """
    Prepares report content for the PDF generation layer.

    This service does not create the PDF file yet.
    It validates the report request and prepares the
    final structured data that the ReportLab service
    will use in the next phase.
    """

    SUPPORTED_REPORT_TYPES = {
        "experiment_summary",
        "persona_analysis",
        "survey_results",
        "insights",
    }

    def _validate_report_type(
        self,
        report_type: str,
    ) -> None:
        if report_type not in self.SUPPORTED_REPORT_TYPES:
            raise ValueError(
                f"Unsupported report type: {report_type}"
            )

    def _build_report_title(
        self,
        experiment: Experiment,
        report_type: str,
    ) -> str:
        report_titles = {
            "experiment_summary": "Experiment Summary",
            "persona_analysis": "Persona Analysis",
            "survey_results": "Survey Results",
            "insights": "Research Insights",
        }

        report_title = report_titles.get(
            report_type,
            "Research Report",
        )

        return f"{report_title} - {experiment.name}"

    def _build_metadata(
        self,
        experiment: Experiment,
        report_type: str,
        start_date: datetime | None,
        end_date: datetime | None,
    ) -> dict[str, Any]:
        return {
            "title": self._build_report_title(
                experiment=experiment,
                report_type=report_type,
            ),
            "report_type": report_type,
            "experiment_id": experiment.id,
            "experiment_name": experiment.name,
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
        }

    def generate_report_data(
        self,
        db: Session,
        experiment: Experiment,
        report_type: str,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        report_name: str | None = None,
    ) -> dict[str, Any]:
        """
        Prepare the complete report payload.

        The actual PDF creation is intentionally handled
        by the ReportLab generation service in the next step.
        """

        self._validate_report_type(report_type)

        if (
            start_date is not None
            and end_date is not None
            and start_date > end_date
        ):
            raise ValueError(
                "Report start date cannot be after end date."
            )

        prepared_data = (
            report_data_service.prepare_report_data(
                db=db,
                experiment=experiment,
                report_type=report_type,
                start_date=start_date,
                end_date=end_date,
            )
        )

        metadata = self._build_metadata(
            experiment=experiment,
            report_type=report_type,
            start_date=start_date,
            end_date=end_date,
        )

        if report_name:
            metadata["title"] = report_name.strip()

        return {
            "metadata": metadata,
            "data": prepared_data,
        }


report_generation_service = ReportGenerationService()