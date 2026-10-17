from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String

from app.database import Base


class SyntheticResponse(Base):
    __tablename__ = "synthetic_responses"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    survey_id = Column(
        Integer,
        ForeignKey("surveys.id"),
        nullable=False,
        index=True,
    )

    experiment_id = Column(
        Integer,
        ForeignKey("experiments.id"),
        nullable=False,
        index=True,
    )

    persona_id = Column(
        Integer,
        ForeignKey("personas.id"),
        nullable=False,
        index=True,
    )

    response_data = Column(
        JSON,
        nullable=False,
    )

    # Generation traceability
    generation_id = Column(
        String(100),
        nullable=True,
        index=True,
    )

    model_name = Column(
        String(100),
        nullable=True,
    )

    generation_status = Column(
        String(30),
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )