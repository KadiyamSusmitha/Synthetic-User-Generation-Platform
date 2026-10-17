from pathlib import Path

from PyPDF2 import PdfReader

from app.database import SessionLocal
from app.models.experiment import Experiment
from app.services.report_generation_service import (
    report_generation_service,
)
from app.services.pdf_report_service import (
    pdf_report_service,
)


OUTPUT_DIR = Path(
    "test_generated_reports"
)


def get_experiment(db, experiment_id: int):
    experiment = (
        db.query(Experiment)
        .filter(
            Experiment.id == experiment_id
        )
        .first()
    )

    assert experiment is not None

    return experiment


def generate_test_pdf(
    db,
    experiment,
    report_type: str,
    filename: str,
):
    report_payload = (
        report_generation_service.generate_report_data(
            db=db,
            experiment=experiment,
            report_type=report_type,
            report_name=(
                f"Test {report_type} Report"
            ),
        )
    )

    output_path = (
        OUTPUT_DIR / filename
    )

    generated_path = (
        pdf_report_service.generate_pdf(
            report_payload=report_payload,
            output_path=output_path,
        )
    )

    assert Path(
        generated_path
    ).exists()

    assert Path(
        generated_path
    ).stat().st_size > 0

    reader = PdfReader(
        generated_path
    )

    assert len(
        reader.pages
    ) > 0

    return generated_path, reader


def test_experiment_summary_pdf():
    db = SessionLocal()

    try:
        experiment = get_experiment(
            db,
            9,
        )

        generated_path, reader = (
            generate_test_pdf(
                db=db,
                experiment=experiment,
                report_type=(
                    "experiment_summary"
                ),
                filename=(
                    "taxpal_experiment_summary.pdf"
                ),
            )
        )

        assert len(
            reader.pages
        ) >= 1

        print(
            "\nExperiment Summary PDF:"
        )
        print(generated_path)
        print(
            "Pages:",
            len(reader.pages),
        )

    finally:
        db.close()


def test_persona_analysis_pdf():
    db = SessionLocal()

    try:
        experiment = get_experiment(
            db,
            9,
        )

        generated_path, reader = (
            generate_test_pdf(
                db=db,
                experiment=experiment,
                report_type=(
                    "persona_analysis"
                ),
                filename=(
                    "taxpal_persona_analysis.pdf"
                ),
            )
        )

        assert len(
            reader.pages
        ) >= 1

        print(
            "\nPersona Analysis PDF:"
        )
        print(generated_path)
        print(
            "Pages:",
            len(reader.pages),
        )

    finally:
        db.close()


def test_survey_results_pdf():
    db = SessionLocal()

    try:
        experiment = get_experiment(
            db,
            9,
        )

        generated_path, reader = (
            generate_test_pdf(
                db=db,
                experiment=experiment,
                report_type=(
                    "survey_results"
                ),
                filename=(
                    "taxpal_survey_results.pdf"
                ),
            )
        )

        assert len(
            reader.pages
        ) >= 1

        print(
            "\nSurvey Results PDF:"
        )
        print(generated_path)
        print(
            "Pages:",
            len(reader.pages),
        )

    finally:
        db.close()


def test_insights_pdf():
    db = SessionLocal()

    try:
        experiment = get_experiment(
            db,
            9,
        )

        generated_path, reader = (
            generate_test_pdf(
                db=db,
                experiment=experiment,
                report_type="insights",
                filename=(
                    "taxpal_insights.pdf"
                ),
            )
        )

        assert len(
            reader.pages
        ) >= 1

        print(
            "\nInsights PDF:"
        )
        print(generated_path)
        print(
            "Pages:",
            len(reader.pages),
        )

    finally:
        db.close()