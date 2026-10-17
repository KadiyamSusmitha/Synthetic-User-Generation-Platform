from datetime import datetime

import pytest

from app.database import SessionLocal
from app.models.experiment import Experiment
from app.services.report_generation_service import (
    report_generation_service,
)


def get_experiment(db, experiment_id: int):
    experiment = (
        db.query(Experiment)
        .filter(Experiment.id == experiment_id)
        .first()
    )

    assert experiment is not None

    return experiment


def test_experiment_summary_report():
    db = SessionLocal()

    try:
        experiment = get_experiment(db, 9)

        result = report_generation_service.generate_report_data(
            db=db,
            experiment=experiment,
            report_type="experiment_summary",
        )

        assert "metadata" in result
        assert "data" in result

        assert (
            result["metadata"]["report_type"]
            == "experiment_summary"
        )

        assert (
            result["metadata"]["experiment_id"]
            == 9
        )

        assert (
            "Experiment Summary"
            in result["metadata"]["title"]
        )

        assert (
            result["data"]["summary"]["experiment_id"]
            == 9
        )

        assert (
            result["data"]["summary"]["experiment_name"]
            == "TaxPal"
        )

        print("\nExperiment Summary Report:")
        print(result["metadata"])
        print(result["data"]["summary"])

    finally:
        db.close()


def test_persona_analysis_report():
    db = SessionLocal()

    try:
        experiment = get_experiment(db, 9)

        result = report_generation_service.generate_report_data(
            db=db,
            experiment=experiment,
            report_type="persona_analysis",
        )

        assert (
            result["metadata"]["report_type"]
            == "persona_analysis"
        )

        assert len(
            result["data"]["personas"]
        ) > 0

        assert (
            result["data"]["summary"]["persona_count"]
            > 0
        )

        print("\nPersona Analysis Report:")
        print(result["metadata"])
        print(
            "Persona count:",
            len(result["data"]["personas"]),
        )

    finally:
        db.close()


def test_survey_results_report():
    db = SessionLocal()

    try:
        experiment = get_experiment(db, 9)

        result = report_generation_service.generate_report_data(
            db=db,
            experiment=experiment,
            report_type="survey_results",
        )

        assert (
            result["metadata"]["report_type"]
            == "survey_results"
        )

        assert len(
            result["data"]["surveys"]
        ) > 0

        assert len(
            result["data"]["questions"]
        ) > 0

        assert len(
            result["data"]["responses"]
        ) > 0

        print("\nSurvey Results Report:")
        print(result["metadata"])
        print(
            "Survey count:",
            len(result["data"]["surveys"]),
        )
        print(
            "Question count:",
            len(result["data"]["questions"]),
        )
        print(
            "Synthetic response count:",
            len(result["data"]["responses"]),
        )

    finally:
        db.close()


def test_insights_report():
    db = SessionLocal()

    try:
        experiment = get_experiment(db, 9)

        result = report_generation_service.generate_report_data(
            db=db,
            experiment=experiment,
            report_type="insights",
        )

        assert (
            result["metadata"]["report_type"]
            == "insights"
        )

        assert (
            result["data"]["summary"]["experiment_id"]
            == 9
        )

        assert (
            result["data"]["summary"][
                "synthetic_response_count"
            ]
            >= 0
        )

        print("\nInsights Report:")
        print(result["metadata"])
        print(result["data"]["summary"])

    finally:
        db.close()


def test_custom_report_name():
    db = SessionLocal()

    try:
        experiment = get_experiment(db, 9)

        result = report_generation_service.generate_report_data(
            db=db,
            experiment=experiment,
            report_type="experiment_summary",
            report_name="My TaxPal Research Report",
        )

        assert (
            result["metadata"]["title"]
            == "My TaxPal Research Report"
        )

    finally:
        db.close()


def test_date_range():
    db = SessionLocal()

    try:
        experiment = get_experiment(db, 9)

        start_date = datetime(
            2026,
            1,
            1,
        )

        end_date = datetime(
            2026,
            12,
            31,
            23,
            59,
            59,
        )

        result = report_generation_service.generate_report_data(
            db=db,
            experiment=experiment,
            report_type="experiment_summary",
            start_date=start_date,
            end_date=end_date,
        )

        assert (
            result["metadata"]["date_range"]["start"]
            == start_date.isoformat()
        )

        assert (
            result["metadata"]["date_range"]["end"]
            == end_date.isoformat()
        )

    finally:
        db.close()


def test_invalid_report_type():
    db = SessionLocal()

    try:
        experiment = get_experiment(db, 9)

        with pytest.raises(
            ValueError,
            match="Unsupported report type",
        ):
            report_generation_service.generate_report_data(
                db=db,
                experiment=experiment,
                report_type="invalid_report",
            )

    finally:
        db.close()


def test_invalid_date_range():
    db = SessionLocal()

    try:
        experiment = get_experiment(db, 9)

        start_date = datetime(
            2026,
            12,
            31,
        )

        end_date = datetime(
            2026,
            1,
            1,
        )

        with pytest.raises(
            ValueError,
            match="Report start date cannot be after end date",
        ):
            report_generation_service.generate_report_data(
                db=db,
                experiment=experiment,
                report_type="experiment_summary",
                start_date=start_date,
                end_date=end_date,
            )

    finally:
        db.close()