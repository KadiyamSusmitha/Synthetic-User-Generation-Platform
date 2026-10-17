from datetime import datetime

from pydantic import BaseModel


class ReportGenerateRequest(BaseModel):
    experiment_id: int
    report_type: str
    start_date: datetime | None = None
    end_date: datetime | None = None
    report_name: str
    export_format: str


class ReportResponse(BaseModel):
    id: int
    name: str
    report_type: str
    experiment_id: int | None = None
    experiment_name: str | None = None
    export_format: str
    file_name: str
    created_at: datetime