from pathlib import Path

from app.services.report_storage_service import (
    report_storage_service,
)


def test_storage_directory_exists():
    directory = (
        report_storage_service.ensure_storage_directory()
    )

    assert directory.exists()
    assert directory.is_dir()

    print(
        "\nStorage directory:",
        directory,
    )


def test_generate_filename():
    filename = (
        report_storage_service.generate_filename(
            "My TaxPal Research Report"
        )
    )

    assert filename.endswith(".pdf")
    assert "my_taxpal_research_report" in filename

    print(
        "\nGenerated filename:",
        filename,
    )


def test_generate_unique_filenames():
    first = (
        report_storage_service.generate_filename(
            "TaxPal Report"
        )
    )

    second = (
        report_storage_service.generate_filename(
            "TaxPal Report"
        )
    )

    assert first != second


def test_get_report_path():
    path = (
        report_storage_service.get_report_path(
            "TaxPal Research Report"
        )
    )

    assert isinstance(
        path,
        Path,
    )

    assert (
        path.parent
        == report_storage_service.reports_directory
    )

    assert path.suffix == ".pdf"

    print(
        "\nReport path:",
        path,
    )