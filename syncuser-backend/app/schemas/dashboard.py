from datetime import datetime

from pydantic import BaseModel


class DashboardStatistics(BaseModel):
    total_experiments: int
    personas_generated: int
    surveys_conducted: int
    reports_generated: int


class RecentExperiment(BaseModel):
    id: int
    name: str
    description: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime


class ResponseChartItem(BaseModel):
    date: str
    count: int


class DashboardResponse(BaseModel):
    username: str
    statistics: DashboardStatistics
    recent_experiments: list[RecentExperiment]
    response_chart: list[ResponseChartItem]
    interview_chart: list[ResponseChartItem]