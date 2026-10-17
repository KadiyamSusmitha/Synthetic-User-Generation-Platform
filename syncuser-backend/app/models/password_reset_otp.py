from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String

from app.database import Base


class PasswordResetOTP(Base):
    __tablename__ = "password_reset_otps"

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

    otp_hash = Column(
        String(255),
        nullable=False,
    )

    expires_at = Column(
        DateTime,
        nullable=False,
    )

    is_used = Column(
        Boolean,
        default=False,
        nullable=False,
    )

    # Number of incorrect verification attempts
    attempt_count = Column(
        Integer,
        default=0,
        nullable=False,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )