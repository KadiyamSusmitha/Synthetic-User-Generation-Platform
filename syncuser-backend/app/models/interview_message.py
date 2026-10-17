from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text

from app.database import Base


class InterviewMessage(Base):
    __tablename__ = "interview_messages"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    interview_id = Column(
        Integer,
        ForeignKey("interviews.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    role = Column(
        String(30),
        nullable=False,
    )

    message = Column(
        Text,
        nullable=False,
    )

    question_type = Column(
        String(30),
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )