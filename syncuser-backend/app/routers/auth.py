from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone

from app.database import get_db
from app.utils.dependencies import get_current_user
from app.services.email_service import send_otp_email

from app.models.user import User
from app.models.password_reset_otp import PasswordResetOTP
from app.models.login_activity import LoginActivity

from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    UpdateUsernameRequest,
    TokenResponse,
    UserResponse,
    LoginActivityResponse,
)

from app.schemas.password_reset import (
    ForgotPasswordRequest,
    VerifyOTPRequest,
    ResetPasswordRequest,
    ResendOTPRequest,
)

from app.utils.jwt import (
    create_access_token,
    create_password_reset_token,
    verify_password_reset_token,
)

from app.utils.security import hash_password, verify_password

from app.utils.otp import (
    generate_otp,
    hash_otp,
    verify_otp,
)


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


# Maximum number of incorrect OTP attempts
MAX_OTP_ATTEMPTS = 5


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_user(
    user_data: RegisterRequest,
    db: Session = Depends(get_db),
):
    existing_username = (
        db.query(User)
        .filter(User.username == user_data.username)
        .first()
    )

    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists.",
        )

    existing_email = (
        db.query(User)
        .filter(User.email == user_data.email)
        .first()
    )

    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists.",
        )

    new_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post(
    "/login",
    response_model=TokenResponse,
)
def login_user(
    user_data: LoginRequest,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.email == user_data.email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not verify_password(
        user_data.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    access_token = create_access_token(user.id)

    login_activity = LoginActivity(
        user_id=user.id,
        login_at=datetime.now(timezone.utc),
    )

    db.add(login_activity)
    db.commit()

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }

@router.put(
    "/me",
    response_model=UserResponse,
)
def update_my_profile(
    user_data: UpdateUsernameRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    username = user_data.username.strip()

    if not username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username cannot be empty.",
        )

    if len(username) > 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username must be 50 characters or fewer.",
        )

    existing_username = (
        db.query(User)
        .filter(
            User.username == username,
            User.id != current_user.id,
        )
        .first()
    )

    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists.",
        )

    current_user.username = username

    db.commit()
    db.refresh(current_user)

    return current_user

@router.get(
    "/me",
    response_model=UserResponse,
)
def get_my_profile(
    current_user: User = Depends(get_current_user),
):
    return current_user

@router.get(
    "/login-activity",
    response_model=list[LoginActivityResponse],
)
def get_login_activity(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    activities = (
        db.query(LoginActivity)
        .filter(
            LoginActivity.user_id == current_user.id,
        )
        .order_by(
            LoginActivity.login_at.desc(),
        )
        .limit(10)
        .all()
    )

    return activities

@router.post("/forgot-password")
def forgot_password(
    request: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.email == request.email)
        .first()
    )

    if user is None:
        return {
            "message": (
                "If an account exists for this email, "
                "a verification code has been sent."
            )
        }

    # Invalidate previous unused OTPs
    db.query(PasswordResetOTP).filter(
        PasswordResetOTP.user_id == user.id,
        PasswordResetOTP.is_used.is_(False),
    ).update(
        {PasswordResetOTP.is_used: True},
        synchronize_session=False,
    )

    # Generate new OTP
    otp = generate_otp()

    # Store only the hashed OTP
    otp_hash_value = hash_otp(otp)

    expires_at = (
        datetime.now(timezone.utc)
        + timedelta(minutes=10)
    )

    reset_otp = PasswordResetOTP(
        user_id=user.id,
        otp_hash=otp_hash_value,
        expires_at=expires_at,
        attempt_count=0,
    )

    db.add(reset_otp)
    db.commit()

    # Send OTP through email
    background_tasks.add_task(
        send_otp_email,
        user.email,
        otp,
    )

    return {
        "message": (
            "If an account exists for this email, "
            "a verification code has been sent."
        )
    }


@router.post("/verify-otp")
def verify_reset_otp(
    request: VerifyOTPRequest,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.email == request.email)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code.",
        )

    reset_otp = (
        db.query(PasswordResetOTP)
        .filter(
            PasswordResetOTP.user_id == user.id,
            PasswordResetOTP.is_used.is_(False),
        )
        .order_by(PasswordResetOTP.created_at.desc())
        .first()
    )

    if reset_otp is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code.",
        )

    # =====================================================
    # CHECK OTP EXPIRATION
    # =====================================================

    current_time = datetime.now(timezone.utc)

    expires_at = reset_otp.expires_at

    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(
            tzinfo=timezone.utc
        )

    if current_time > expires_at:
        # Invalidate expired OTP
        reset_otp.is_used = True
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired.",
        )

    # =====================================================
    # CHECK MAXIMUM OTP ATTEMPTS
    # =====================================================

    if reset_otp.attempt_count >= MAX_OTP_ATTEMPTS:
        # Invalidate OTP after too many attempts
        reset_otp.is_used = True
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Too many incorrect attempts. "
                "Please request a new verification code."
            ),
        )

    # =====================================================
    # VERIFY OTP
    # =====================================================

    if not verify_otp(
        request.otp,
        reset_otp.otp_hash,
    ):
        # Increase failed attempt count
        reset_otp.attempt_count += 1

        # Invalidate OTP immediately after the 5th
        # incorrect attempt
        if reset_otp.attempt_count >= MAX_OTP_ATTEMPTS:
            reset_otp.is_used = True

        db.commit()

        if reset_otp.attempt_count >= MAX_OTP_ATTEMPTS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Too many incorrect attempts. "
                    "Please request a new verification code."
                ),
            )

        remaining_attempts = (
            MAX_OTP_ATTEMPTS
            - reset_otp.attempt_count
        )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid verification code. "
                f"{remaining_attempts} attempt(s) remaining."
            ),
        )

    # =====================================================
    # OTP VERIFIED SUCCESSFULLY
    # =====================================================

    reset_otp.is_used = True

    db.commit()

    reset_token = create_password_reset_token(user.id)

    return {
        "message": "Verification code verified successfully.",
        "reset_token": reset_token,
    }


@router.post("/reset-password")
def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    try:
        user_id = verify_password_reset_token(
            request.reset_token
        )
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        )

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token.",
        )

    user.password_hash = hash_password(
        request.new_password
    )

    db.commit()

    return {
        "message": "Password reset successfully."
    }


@router.post("/resend-otp")
def resend_reset_otp(
    request: ResendOTPRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.email == request.email)
        .first()
    )

    if user is None:
        return {
            "message": (
                "If an account exists for this email, "
                "a new verification code has been sent."
            )
        }

    # Invalidate previous unused OTPs
    db.query(PasswordResetOTP).filter(
        PasswordResetOTP.user_id == user.id,
        PasswordResetOTP.is_used.is_(False),
    ).update(
        {PasswordResetOTP.is_used: True},
        synchronize_session=False,
    )

    # Generate new OTP
    otp = generate_otp()

    # Store only the hashed OTP
    otp_hash_value = hash_otp(otp)

    # New OTP expires in 10 minutes
    expires_at = (
        datetime.now(timezone.utc)
        + timedelta(minutes=10)
    )

    reset_otp = PasswordResetOTP(
        user_id=user.id,
        otp_hash=otp_hash_value,
        expires_at=expires_at,
        attempt_count=0,
    )

    db.add(reset_otp)
    db.commit()

    # Send new OTP through email
    background_tasks.add_task(
        send_otp_email,
        user.email,
        otp,
    )

    return {
        "message": "A new verification code has been sent."
    }