from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON

from app.database import Base


class Response(Base):
    __tablename__ = "responses"

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

    response_data = Column(
        JSON,
        nullable=False,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )