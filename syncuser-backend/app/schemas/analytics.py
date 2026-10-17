from typing import Any

from pydantic import BaseModel, Field


class AnalyticsSummary(BaseModel):
    synthetic_responses: int = 0
    total_responses: int = 0
    surveys: int = 0
    questions: int = 0
    personas: int = 0


class OverviewMetrics(BaseModel):
    total_responses: int
    engagement_rate: float
    participating_personas: int = 0
    total_personas: int = 0
    key_themes: int | None
    satisfaction_score: float | None
    satisfaction_valid_answer_count: int = 0
    total_responses_change: float | None
    engagement_rate_change: float | None
    key_themes_change: float | None
    satisfaction_score_change: float | None


class ChoiceDistributionItem(BaseModel):
    option: str
    count: int = 0
    percentage: float = 0.0


class ChoiceAnalytics(BaseModel):
    type: str
    valid_answer_count: int = 0
    distribution: list[ChoiceDistributionItem] = Field(
        default_factory=list
    )
    most_common: str | None = None


class RatingDistributionItem(BaseModel):
    rating: float
    count: int = 0
    percentage: float = 0.0


class RatingAnalytics(BaseModel):
    type: str
    valid_answer_count: int = 0
    average: float | None = None
    minimum: float | None = None
    maximum: float | None = None
    distribution: list[RatingDistributionItem] = Field(
        default_factory=list
    )


class MultipleChoiceDistributionItem(BaseModel):
    option: str
    count: int = 0
    percentage_of_responses: float = 0.0


class MultipleChoiceAnalytics(BaseModel):
    type: str
    valid_response_count: int = 0
    total_selections: int = 0
    distribution: list[MultipleChoiceDistributionItem] = Field(
        default_factory=list
    )


class TextCommonAnswer(BaseModel):
    answer: str
    count: int = 0


class TextAnalytics(BaseModel):
    type: str
    valid_answer_count: int = 0
    unique_answer_count: int = 0
    common_answers: list[TextCommonAnswer] = Field(
        default_factory=list
    )
    responses: list[str] = Field(default_factory=list)


class UnsupportedAnalytics(BaseModel):
    type: str
    message: str


class QuestionAnalytics(BaseModel):
    question_id: int
    survey_id: int
    question: str
    question_type: str
    options: list[str] = Field(default_factory=list)
    required: bool
    display_order: int

    synthetic_response_count: int = 0
    response_count: int = 0

    analytics: dict[str, Any] = Field(
        default_factory=dict
    )


class AgeDistributionItem(BaseModel):
    range: str
    count: int = 0
    percentage: float = 0.0


class AgeAnalytics(BaseModel):
    count: int = 0
    average: float | None = None
    minimum: int | None = None
    maximum: int | None = None
    distribution: list[AgeDistributionItem] = Field(
        default_factory=list
    )


class DemographicDistributionItem(BaseModel):
    value: str
    count: int = 0
    percentage: float = 0.0


class DemographicDistribution(BaseModel):
    count: int = 0
    unique_count: int = 0
    distribution: list[DemographicDistributionItem] = Field(
        default_factory=list
    )


class DemographicPatterns(BaseModel):
    participating_personas: int = 0
    age: AgeAnalytics
    gender: DemographicDistribution
    location: DemographicDistribution
    occupation: DemographicDistribution


class PersonaQuestionAnswer(BaseModel):
    question_id: int
    question: str
    question_type: str
    answers: list[Any] = Field(default_factory=list)


class PersonaPattern(BaseModel):
    persona_id: int
    persona_name: str
    age: int | None = None
    gender: str | None = None
    occupation: str | None = None
    location: str | None = None

    synthetic_response_count: int = 0

    question_answers: list[PersonaQuestionAnswer] = Field(
        default_factory=list
    )


class TrendItem(BaseModel):
    date: str
    synthetic: int = 0
    total: int = 0


class ResponseTrends(BaseModel):
    granularity: str
    data: list[TrendItem] = Field(
        default_factory=list
    )


class CommonAnswer(BaseModel):
    question_id: int
    question: str
    answer: str
    count: int = 0


class AnalyticsResponse(BaseModel):
    experiment_id: int
    experiment_name: str

    summary: AnalyticsSummary
    overview_metrics: OverviewMetrics
    question_analytics: list[QuestionAnalytics] = Field(
        default_factory=list
    )

    demographic_patterns: DemographicPatterns

    persona_patterns: list[PersonaPattern] = Field(
        default_factory=list
    )

    trends: ResponseTrends

    common_answers: list[CommonAnswer] = Field(
        default_factory=list
    )
