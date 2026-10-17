from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, Text

from app.database import Base


class InterviewResult(Base):
    __tablename__ = "interview_results"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    interview_id = Column(
        Integer,
        ForeignKey("interviews.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    score = Column(
        Integer,
        nullable=True,
    )

    summary = Column(
        Text,
        nullable=True,
    )

    key_insights = Column(
        JSON,
        nullable=True,
    )

    pain_points = Column(
        JSON,
        nullable=True,
    )

    needs = Column(
        JSON,
        nullable=True,
    )

    motivations = Column(
        JSON,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )