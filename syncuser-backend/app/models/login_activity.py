from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer

from app.database import Base


class LoginActivity(Base):
    __tablename__ = "login_activities"

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

    login_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )