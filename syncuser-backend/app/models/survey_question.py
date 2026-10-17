from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import relationship

from app.database import Base


class SurveyQuestion(Base):
    __tablename__ = "survey_questions"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    survey_id = Column(
        Integer,
        ForeignKey("surveys.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    question = Column(
        String(500),
        nullable=False,
    )

    question_type = Column(
        String(30),
        nullable=False,
    )

    options = Column(
        JSON,
        nullable=False,
        default=list,
    )

    required = Column(
        Boolean,
        nullable=False,
        default=False,
    )

    display_order = Column(
        Integer,
        nullable=False,
        default=0,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    survey = relationship(
        "Survey",
        back_populates="questions",
    )