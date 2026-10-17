from datetime import datetime, timezone
from pathlib import Path

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.experiment import Experiment
from app.models.report import Report
from app.models.user import User
from app.schemas.reports import (
    ReportGenerateRequest,
    ReportResponse,
)
from app.services.report_service import (
    report_service,
)
from app.services.report_storage_service import (
    report_storage_service,
)
from app.utils.dependencies import (
    get_current_user,
)


router = APIRouter(
    prefix="/api/reports",
    tags=["Reports"],
)


SUPPORTED_REPORT_TYPES = {
    "experiment_summary",
    "persona_analysis",
    "survey_results",
    "insights",
}

SUPPORTED_EXPORT_FORMATS = {
    "pdf",
    "csv",
}


def normalize_datetime(
    value: datetime | None,
) -> datetime | None:
    """
    Converts timezone-aware datetimes into naive UTC
    values because report timestamps are stored as UTC
    without timezone information.
    """

    if value is None:
        return None

    if value.tzinfo is not None:
        return (
            value.astimezone(
                timezone.utc
            ).replace(tzinfo=None)
        )

    return value


def get_owned_experiment(
    db: Session,
    experiment_id: int,
    user_id: int,
) -> Experiment:
    experiment = (
        db.query(Experiment)
        .filter(
            Experiment.id == experiment_id,
            Experiment.user_id == user_id,
        )
        .first()
    )

    if not experiment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Experiment not found.",
        )

    return experiment


def get_owned_report(
    db: Session,
    report_id: int,
    user_id: int,
) -> Report:
    report = (
        db.query(Report)
        .filter(
            Report.id == report_id,
            Report.user_id == user_id,
        )
        .first()
    )

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found.",
        )

    return report


def get_safe_report_path(
    file_path: str,
) -> Path:
    """
    Ensures a stored report path remains inside
    the generated_reports directory.
    """

    reports_directory = (
        report_storage_service
        .ensure_storage_directory()
        .resolve()
    )

    report_path = Path(
        file_path
    ).resolve()

    try:
        report_path.relative_to(
            reports_directory
        )
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid report file location.",
        ) from error

    return report_path


def build_report_response(
    db: Session,
    report: Report,
) -> dict:
    experiment = (
        db.query(Experiment)
        .filter(
            Experiment.id
            == report.experiment_id
        )
        .first()
    )

    file_path = Path(
        report.file_path
        or ""
    )

    extension = (
        file_path.suffix
        .lower()
        .lstrip(".")
    )

    export_format = (
        extension
        if extension in SUPPORTED_EXPORT_FORMATS
        else "pdf"
    )

    return {
        "id": report.id,
        "name": report.name,
        "report_type": (
            "research_report"
            if not report.name
            else report.name
        ),
        "experiment_id": (
            report.experiment_id
        ),
        "experiment_name": (
            experiment.name
            if experiment
            else None
        ),
        "export_format": export_format,
        "file_name": (
            file_path.name
            if file_path.name
            else f"{report.name}.{export_format}"
        ),
        "created_at": report.created_at,
    }


@router.get(
    "/",
)
def get_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    reports = (
        db.query(Report)
        .filter(
            Report.user_id
            == current_user.id
        )
        .order_by(
            Report.created_at.desc()
        )
        .all()
    )

    result = []

    for report in reports:
        item = build_report_response(
            db=db,
            report=report,
        )

        # Recover the actual report type from
        # the generated report filename/metadata
        # where possible. Existing records may not
        # contain a separate export-format column.
        name_lower = report.name.lower()

        if "experiment summary" in name_lower:
            item["report_type"] = (
                "experiment_summary"
            )
        elif "persona analysis" in name_lower:
            item["report_type"] = (
                "persona_analysis"
            )
        elif "survey results" in name_lower:
            item["report_type"] = (
                "survey_results"
            )
        elif (
            "research insights" in name_lower
            or "insights" in name_lower
        ):
            item["report_type"] = "insights"

        result.append(item)

    return result


@router.post(
    "/generate",
    status_code=status.HTTP_201_CREATED,
)
def generate_report(
    request: ReportGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    report_type = (
        request.report_type
        .strip()
        .lower()
    )

    export_format = (
        request.export_format
        .strip()
        .lower()
    )

    if report_type not in SUPPORTED_REPORT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported report type.",
        )

    if export_format not in SUPPORTED_EXPORT_FORMATS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported export format. Choose PDF or CSV.",
        )

    if not request.report_name.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Report name is required.",
        )

    start_date = normalize_datetime(
        request.start_date
    )

    end_date = normalize_datetime(
        request.end_date
    )

    if (
        start_date is not None
        and end_date is not None
        and start_date >= end_date
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Report start date must be before "
                "the end date."
            ),
        )

    experiment = get_owned_experiment(
        db=db,
        experiment_id=request.experiment_id,
        user_id=current_user.id,
    )

    try:
        generated_report = (
            report_service.generate_report(
                db=db,
                experiment=experiment,
                report_type=report_type,
                start_date=start_date,
                end_date=end_date,
                report_name=request.report_name.strip(),
                export_format=export_format,
            )
        )
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    report = Report(
        user_id=current_user.id,
        experiment_id=experiment.id,
        name=generated_report["name"],
        file_path=generated_report[
            "file_path"
        ],
    )

    db.add(report)
    db.commit()
    db.refresh(report)

    return {
        "id": report.id,
        "name": report.name,
        "report_type": report_type,
        "experiment_id": experiment.id,
        "experiment_name": experiment.name,
        "export_format": export_format,
        "file_name": Path(
            report.file_path
        ).name,
        "created_at": report.created_at,
        "message": (
            "Report generated successfully."
        ),
    }


@router.get(
    "/{report_id}/view",
)
def view_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    report = get_owned_report(
        db=db,
        report_id=report_id,
        user_id=current_user.id,
    )

    if not report.file_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report file is not available.",
        )

    report_path = get_safe_report_path(
        report.file_path
    )

    if not report_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report file is not available.",
        )

    extension = (
        report_path.suffix
        .lower()
    )

    if extension == ".pdf":
        media_type = "application/pdf"
    elif extension == ".csv":
        media_type = "text/csv"
    else:
        media_type = (
            "application/octet-stream"
        )

    return FileResponse(
        path=report_path,
        media_type=media_type,
        filename=report_path.name,
        headers={
            "Content-Disposition": (
                f'inline; filename="{report_path.name}"'
            )
        },
    )


@router.get(
    "/{report_id}/download",
)
def download_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    report = get_owned_report(
        db=db,
        report_id=report_id,
        user_id=current_user.id,
    )

    if not report.file_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report file is not available.",
        )

    report_path = get_safe_report_path(
        report.file_path
    )

    if not report_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report file is not available.",
        )

    extension = (
        report_path.suffix
        .lower()
    )

    if extension == ".pdf":
        media_type = "application/pdf"
    elif extension == ".csv":
        media_type = "text/csv"
    else:
        media_type = (
            "application/octet-stream"
        )

    return FileResponse(
        path=report_path,
        media_type=media_type,
        filename=report_path.name,
    )


@router.delete(
    "/{report_id}",
)
def delete_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    report = get_owned_report(
        db=db,
        report_id=report_id,
        user_id=current_user.id,
    )

    if report.file_path:
        report_path = get_safe_report_path(
            report.file_path
        )

        if report_path.is_file():
            report_path.unlink()

    db.delete(report)
    db.commit()

    return {
        "message": (
            "Report deleted successfully."
        ),
        "report_id": report_id,
    }