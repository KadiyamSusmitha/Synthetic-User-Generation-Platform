import os
from datetime import datetime, timedelta, timezone

import jwt
from dotenv import load_dotenv


load_dotenv()


JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
)


def create_access_token(user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user_id),
        "exp": expire,
    }

    return jwt.encode(
        payload,
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )

def create_password_reset_token(user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=10
    )

    payload = {
        "sub": str(user_id),
        "purpose": "password_reset",
        "exp": expire,
    }

    return jwt.encode(
        payload,
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )

def verify_password_reset_token(token: str) -> int:
    try:
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM],
        )

        if payload.get("purpose") != "password_reset":
            raise ValueError("Invalid token purpose.")

        user_id = payload.get("sub")

        if user_id is None:
            raise ValueError("Invalid reset token.")

        return int(user_id)

    except (jwt.InvalidTokenError, ValueError):
        raise ValueError("Invalid or expired reset token.")