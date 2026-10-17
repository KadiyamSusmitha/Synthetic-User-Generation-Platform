from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class Survey(Base):
    __tablename__ = "surveys"

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
        nullable=True,
        index=True,
    )

    title = Column(
        String(150),
        nullable=False,
    )

    status = Column(
        String(30),
        nullable=False,
        default="Draft",
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

    questions = relationship(
        "SurveyQuestion",
        back_populates="survey",
        cascade="all, delete-orphan",
    )