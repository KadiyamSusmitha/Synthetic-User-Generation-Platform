from datetime import datetime
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from app.models.experiment import Experiment
from app.services.csv_report_service import (
    csv_report_service,
)
from app.services.pdf_report_service import (
    pdf_report_service,
)
from app.services.report_generation_service import (
    report_generation_service,
)
from app.services.report_storage_service import (
    report_storage_service,
)


class ReportService:
    """
    Coordinates report data preparation,
    report generation, and file storage.
    """

    SUPPORTED_EXPORT_FORMATS = {
        "pdf",
        "csv",
    }

    def generate_report(
        self,
        db: Session,
        experiment: Experiment,
        report_type: str,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        report_name: str | None = None,
        export_format: str = "pdf",
    ) -> dict[str, Any]:
        """
        Generates a complete research report.

        Flow:
        1. Prepare report data.
        2. Generate PDF or CSV.
        3. Create unique storage path.
        4. Save generated file.
        5. Return report metadata.
        """

        export_format = (
            export_format.strip().lower()
        )

        if (
            export_format
            not in self.SUPPORTED_EXPORT_FORMATS
        ):
            raise ValueError(
                "Unsupported export format. "
                "Choose PDF or CSV."
            )

        if (
            start_date is not None
            and end_date is not None
            and start_date >= end_date
        ):
            raise ValueError(
                "Report start date must be before the end date."
            )

        generated_report = (
            report_generation_service.generate_report_data(
                db=db,
                experiment=experiment,
                report_type=report_type,
                start_date=start_date,
                end_date=end_date,
                report_name=report_name,
            )
        )

        metadata = generated_report[
            "metadata"
        ]

        report_data = generated_report[
            "data"
        ]

        report_title = metadata[
            "title"
        ]

        output_path = (
            report_storage_service.get_report_path(
                report_name=report_title,
                extension=export_format,
            )
        )

        report_payload = {
            "metadata": metadata,
            "data": report_data,
        }

        if export_format == "pdf":
            generated_file = (
                pdf_report_service.generate_pdf(
                    report_payload=report_payload,
                    output_path=output_path,
                )
            )
        else:
            generated_file = (
                csv_report_service.generate_csv(
                    report_payload=report_payload,
                    output_path=output_path,
                )
            )

        return {
            "name": report_title,
            "report_type": report_type,
            "experiment_id": experiment.id,
            "experiment_name": experiment.name,
            "export_format": export_format,
            "file_path": str(
                Path(generated_file)
            ),
            "generated_at": metadata[
                "generated_at"
            ],
            "date_range": metadata[
                "date_range"
            ],
        }


report_service = ReportService()