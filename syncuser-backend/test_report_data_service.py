from datetime import datetime, timedelta

from app.database import SessionLocal
from app.models.experiment import Experiment
from app.services.report_data_service import report_data_service


def print_report_data(title, data):
    print("\n" + "=" * 70)
    print(title)
    print("=" * 70)

    print("\nReport:")
    print(data["report"])

    print("\nExperiment:")
    print(data["experiment"])

    print("\nSummary:")
    print(data["summary"])

    print("\nSurveys:")
    print(data["surveys"])

    print("\nQuestions:")
    print(data["questions"])

    print("\nPersonas:")
    print(data["personas"])

    print("\nSynthetic Responses:")
    print(data["responses"])


def test_taxpal_report_data():
    db = SessionLocal()

    try:
        experiment = (
            db.query(Experiment)
            .filter(
                Experiment.id == 9,
            )
            .first()
        )

        assert experiment is not None

        data = report_data_service.prepare_report_data(
            db=db,
            experiment=experiment,
            report_type="experiment_summary",
        )

        print_report_data(
            "TAXPAL - EXPERIMENT SUMMARY",
            data,
        )

        assert data["experiment"]["id"] == 9
        assert data["summary"]["synthetic_response_count"] > 0
        assert data["summary"]["persona_count"] > 0
        assert data["summary"]["survey_count"] > 0
        assert data["summary"]["question_count"] > 0

        assert len(data["responses"]) == (
            data["summary"]["synthetic_response_count"]
        )

    finally:
        db.close()


def test_taxpal_persona_report_data():
    db = SessionLocal()

    try:
        experiment = (
            db.query(Experiment)
            .filter(
                Experiment.id == 9,
            )
            .first()
        )

        assert experiment is not None

        data = report_data_service.prepare_report_data(
            db=db,
            experiment=experiment,
            report_type="persona_analysis",
        )

        print_report_data(
            "TAXPAL - PERSONA ANALYSIS",
            data,
        )

        assert data["report"]["type"] == "persona_analysis"
        assert len(data["personas"]) > 0

    finally:
        db.close()


def test_taxpal_survey_report_data():
    db = SessionLocal()

    try:
        experiment = (
            db.query(Experiment)
            .filter(
                Experiment.id == 9,
            )
            .first()
        )

        assert experiment is not None

        data = report_data_service.prepare_report_data(
            db=db,
            experiment=experiment,
            report_type="survey_results",
        )

        print_report_data(
            "TAXPAL - SURVEY RESULTS",
            data,
        )

        assert data["report"]["type"] == "survey_results"
        assert len(data["questions"]) > 0
        assert len(data["responses"]) > 0

    finally:
        db.close()


def test_taxpal_insights_report_data():
    db = SessionLocal()

    try:
        experiment = (
            db.query(Experiment)
            .filter(
                Experiment.id == 9,
            )
            .first()
        )

        assert experiment is not None

        data = report_data_service.prepare_report_data(
            db=db,
            experiment=experiment,
            report_type="insights",
        )

        print_report_data(
            "TAXPAL - INSIGHTS",
            data,
        )

        assert data["report"]["type"] == "insights"
        assert data["summary"]["synthetic_response_count"] > 0

    finally:
        db.close()


def test_invalid_report_type():
    db = SessionLocal()

    try:
        experiment = (
            db.query(Experiment)
            .filter(
                Experiment.id == 9,
            )
            .first()
        )

        assert experiment is not None

        try:
            report_data_service.prepare_report_data(
                db=db,
                experiment=experiment,
                report_type="invalid_report",
            )

            assert False, (
                "Expected ValueError for invalid report type."
            )

        except ValueError as exc:
            assert "Unsupported report type" in str(exc)

    finally:
        db.close()


def test_invalid_date_range():
    db = SessionLocal()

    try:
        experiment = (
            db.query(Experiment)
            .filter(
                Experiment.id == 9,
            )
            .first()
        )

        assert experiment is not None

        start_date = datetime.utcnow()
        end_date = start_date - timedelta(days=1)

        try:
            report_data_service.prepare_report_data(
                db=db,
                experiment=experiment,
                report_type="experiment_summary",
                start_date=start_date,
                end_date=end_date,
            )

            assert False, (
                "Expected ValueError for invalid date range."
            )

        except ValueError as exc:
            assert (
                "Report start date cannot be after end date"
                in str(exc)
            )

    finally:
        db.close()