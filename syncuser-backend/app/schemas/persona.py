from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


# =========================================================
# AI-generated persona schema
# =========================================================

class PersonaBase(BaseModel):
    name: str = Field(
        min_length=1,
        description="Unique realistic persona name.",
    )

    gender: Literal["male", "female"] = Field(
        description='Persona gender. Must be exactly "male" or "female".',
    )

    description: str = Field(
        min_length=1,
    )

    age: int = Field(
        ge=1,
    )

    occupation: str = Field(
        min_length=1,
    )

    location: str = Field(
        min_length=1,
    )

    goals: list[str] = Field(
        min_length=3,
        max_length=5,
    )

    pain_points: list[str] = Field(
        min_length=3,
        max_length=5,
    )

    behaviors: list[str] = Field(
        min_length=3,
        max_length=5,
    )

    interests: list[str] = Field(
        min_length=3,
        max_length=5,
    )

    needs: list[str] = Field(
        min_length=3,
        max_length=5,
    )


# =========================================================
# Persona generation request
# =========================================================

class PersonaGenerationRequest(BaseModel):
    persona_count: int = Field(
        default=3,
        ge=1,
        le=10,
    )

    instructions: str | None = Field(
        default=None,
        max_length=500,
    )


# =========================================================
# Persona creation
# =========================================================

class PersonaCreate(PersonaBase):
    experiment_id: int


# =========================================================
# Persona response
#
# gender is optional ONLY for old database records
# created before gender was added.
# =========================================================

class PersonaResponse(BaseModel):
    id: int
    experiment_id: int

    name: str
    gender: Literal["male", "female"] | None = None

    description: str

    age: int
    occupation: str
    location: str

    goals: list[str]
    pain_points: list[str]
    behaviors: list[str]
    interests: list[str]
    needs: list[str]

    created_at: datetime


# =========================================================
# Structured AI output
# =========================================================

class GeneratedPersonas(BaseModel):
    personas: list[PersonaBase]

# =========================================================
# Persona update
# =========================================================

class PersonaUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=1,
    )

    gender: Literal["male", "female"] | None = None

    description: str | None = Field(
        default=None,
        min_length=1,
    )

    age: int | None = Field(
        default=None,
        ge=1,
    )

    occupation: str | None = Field(
        default=None,
        min_length=1,
    )

    location: str | None = Field(
        default=None,
        min_length=1,
    )

    goals: list[str] | None = Field(
        default=None,
        min_length=3,
        max_length=5,
    )

    pain_points: list[str] | None = Field(
        default=None,
        min_length=3,
        max_length=5,
    )

    behaviors: list[str] | None = Field(
        default=None,
        min_length=3,
        max_length=5,
    )

    interests: list[str] | None = Field(
        default=None,
        min_length=3,
        max_length=5,
    )

    needs: list[str] | None = Field(
        default=None,
        min_length=3,
        max_length=5,
    )