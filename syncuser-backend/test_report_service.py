from pathlib import Path

from app.database import SessionLocal
from app.models.experiment import Experiment
from app.services.report_service import report_service


def test_generate_experiment_summary_report():
    db = SessionLocal()

    try:
        experiment = (
            db.query(Experiment)
            .filter(
                Experiment.id == 9
            )
            .first()
        )

        assert experiment is not None

        result = report_service.generate_report(
            db=db,
            experiment=experiment,
            report_type="experiment_summary",
            report_name="TaxPal Integration Test Report",
        )

        assert result["name"] == (
            "TaxPal Integration Test Report"
        )

        assert result["report_type"] == (
            "experiment_summary"
        )

        assert result["experiment_id"] == 9

        file_path = Path(
            result["file_path"]
        )

        assert file_path.exists()
        assert file_path.is_file()

        assert file_path.suffix == ".pdf"

        assert file_path.stat().st_size > 0

        print(
            "\nGenerated report:",
            file_path,
        )

    finally:
        db.close()


def test_generate_persona_analysis_report():
    db = SessionLocal()

    try:
        experiment = (
            db.query(Experiment)
            .filter(
                Experiment.id == 9
            )
            .first()
        )

        assert experiment is not None

        result = report_service.generate_report(
            db=db,
            experiment=experiment,
            report_type="persona_analysis",
            report_name="TaxPal Persona Integration Test",
        )

        file_path = Path(
            result["file_path"]
        )

        assert file_path.exists()
        assert file_path.is_file()
        assert file_path.suffix == ".pdf"
        assert file_path.stat().st_size > 0

        print(
            "\nGenerated persona report:",
            file_path,
        )

    finally:
        db.close()


def test_generate_survey_results_report():
    db = SessionLocal()

    try:
        experiment = (
            db.query(Experiment)
            .filter(
                Experiment.id == 9
            )
            .first()
        )

        assert experiment is not None

        result = report_service.generate_report(
            db=db,
            experiment=experiment,
            report_type="survey_results",
            report_name="TaxPal Survey Integration Test",
        )

        file_path = Path(
            result["file_path"]
        )

        assert file_path.exists()
        assert file_path.is_file()
        assert file_path.suffix == ".pdf"
        assert file_path.stat().st_size > 0

        print(
            "\nGenerated survey report:",
            file_path,
        )

    finally:
        db.close()


def test_generate_insights_report():
    db = SessionLocal()

    try:
        experiment = (
            db.query(Experiment)
            .filter(
                Experiment.id == 9
            )
            .first()
        )

        assert experiment is not None

        result = report_service.generate_report(
            db=db,
            experiment=experiment,
            report_type="insights",
            report_name="TaxPal Insights Integration Test",
        )

        file_path = Path(
            result["file_path"]
        )

        assert file_path.exists()
        assert file_path.is_file()
        assert file_path.suffix == ".pdf"
        assert file_path.stat().st_size > 0

        print(
            "\nGenerated insights report:",
            file_path,
        )

    finally:
        db.close()