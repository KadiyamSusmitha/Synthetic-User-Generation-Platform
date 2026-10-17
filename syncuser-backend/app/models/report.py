from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from app.database import Base


class Report(Base):
    __tablename__ = "reports"

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

    name = Column(
        String(150),
        nullable=False,
    )

    file_path = Column(
        String(500),
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )