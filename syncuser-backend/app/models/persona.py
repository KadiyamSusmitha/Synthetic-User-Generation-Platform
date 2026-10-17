from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)

from app.database import Base


class Persona(Base):
    __tablename__ = "personas"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    experiment_id = Column(
        Integer,
        ForeignKey("experiments.id"),
        nullable=False,
        index=True,
    )

    name = Column(
        String(150),
        nullable=False,
    )

    gender = Column(
        String(20),
        nullable=True,
    )

    description = Column(
        Text,
        nullable=True,
    )

    age = Column(
        Integer,
        nullable=True,
    )

    occupation = Column(
        String(150),
        nullable=True,
    )

    location = Column(
        String(150),
        nullable=True,
    )

    goals = Column(
        JSON,
        nullable=True,
    )

    pain_points = Column(
        JSON,
        nullable=True,
    )

    behaviors = Column(
        JSON,
        nullable=True,
    )

    interests = Column(
        JSON,
        nullable=True,
    )

    needs = Column(
        JSON,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )