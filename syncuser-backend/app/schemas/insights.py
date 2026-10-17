from pydantic import BaseModel, Field


class InsightItem(BaseModel):
    insight: str = Field(
        min_length=1,
        max_length=500,
    )


class InsightClassification(BaseModel):
    insights: list[InsightItem] = Field(
        default_factory=list,
        max_length=5,
    )