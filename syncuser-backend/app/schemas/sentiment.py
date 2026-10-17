from typing import Literal

from pydantic import BaseModel, Field


class SentimentClassification(BaseModel):
    sentiment: Literal[
        "positive",
        "neutral",
        "negative",
    ]


class SentimentClassificationItem(BaseModel):
    response_id: int
    sentiment: Literal[
        "positive",
        "neutral",
        "negative",
    ]


class BatchSentimentClassification(BaseModel):
    classifications: list[SentimentClassificationItem] = Field(
        default_factory=list
    )


class SentimentDistributionItem(BaseModel):
    sentiment: Literal[
        "positive",
        "neutral",
        "negative",
    ]
    count: int = 0
    percentage: float = 0.0


class SentimentAnalytics(BaseModel):
    total_responses: int = 0
    distribution: list[SentimentDistributionItem] = Field(
        default_factory=list
    )