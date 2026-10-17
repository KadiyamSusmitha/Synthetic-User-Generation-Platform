from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String

from app.database import Base


class Interview(Base):
    __tablename__ = "interviews"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
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

    status = Column(
        String(30),
        nullable=False,
        default="In Progress",
    )

    total_questions = Column(
        Integer,
        nullable=False,
        default=0,
    )

    questions_explored = Column(
        Integer,
        nullable=False,
        default=0,
    )

    follow_up_questions = Column(
        Integer,
        nullable=False,
        default=0,
    )

    is_saved = Column(
        Boolean,
        nullable=False,
        default=False,
    )

    started_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    completed_at = Column(
        DateTime,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )