from pydantic import BaseModel, Field


class ThemeItem(BaseModel):
    theme: str = Field(
        description=(
            "A concise name describing a recurring theme "
            "in the research responses."
        )
    )

    count: int = Field(
        ge=0,
        description=(
            "Number of synthetic responses associated "
            "with this theme."
        )
    )

    percentage: float = Field(
        ge=0,
        le=100,
        description=(
            "Percentage of synthetic responses associated "
            "with this theme."
        )
    )


class ThemeClassification(BaseModel):
    themes: list[ThemeItem] = Field(
        default_factory=list,
        description=(
            "Recurring research themes identified from "
            "the supplied synthetic responses."
        )
    )