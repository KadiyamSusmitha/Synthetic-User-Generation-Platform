from pathlib import Path
from uuid import uuid4


class ReportStorageService:
    """
    Handles storage paths for generated research reports.
    """

    SUPPORTED_EXTENSIONS = {
        "pdf",
        "csv",
    }

    def __init__(self) -> None:
        self.backend_root = (
            Path(__file__).resolve().parents[2]
        )

        self.reports_directory = (
            self.backend_root / "generated_reports"
        )

        self.reports_directory.mkdir(
            parents=True,
            exist_ok=True,
        )

    def generate_filename(
        self,
        report_name: str,
        extension: str = "pdf",
    ) -> str:
        """
        Creates a unique report filename.
        """

        extension = (
            extension.strip()
            .lower()
            .lstrip(".")
        )

        if extension not in self.SUPPORTED_EXTENSIONS:
            raise ValueError(
                f"Unsupported report extension: {extension}"
            )

        safe_name = (
            report_name.strip()
            .lower()
            .replace(" ", "_")
        )

        safe_name = "".join(
            character
            for character in safe_name
            if character.isalnum()
            or character in {
                "_",
                "-",
            }
        )

        if not safe_name:
            safe_name = "research_report"

        unique_id = uuid4().hex[:12]

        return (
            f"{safe_name}_{unique_id}.{extension}"
        )

    def get_report_path(
        self,
        report_name: str,
        extension: str = "pdf",
    ) -> Path:
        """
        Returns a unique report path.
        """

        filename = self.generate_filename(
            report_name=report_name,
            extension=extension,
        )

        return (
            self.reports_directory
            / filename
        )

    def ensure_storage_directory(self) -> Path:
        """
        Ensures the report storage directory exists.
        """

        self.reports_directory.mkdir(
            parents=True,
            exist_ok=True,
        )

        return self.reports_directory


report_storage_service = ReportStorageService()