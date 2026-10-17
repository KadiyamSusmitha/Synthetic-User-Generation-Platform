import os
import smtplib

from email.message import EmailMessage

from dotenv import load_dotenv


load_dotenv()


SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL")


def send_otp_email(
    recipient_email: str,
    otp: str,
) -> None:

    if not SMTP_USERNAME or not SMTP_PASSWORD:
        raise RuntimeError(
            "SMTP email configuration is missing."
        )

    message = EmailMessage()

    message["Subject"] = "AI Project Password Reset Verification Code"
    message["From"] = SMTP_FROM_EMAIL or SMTP_USERNAME
    message["To"] = recipient_email

    message.set_content(
        f"""
Hello,

We received a request to reset your AI Project password.

Your verification code is:

{otp}

This code will expire in 10 minutes.

If you did not request a password reset, you can safely ignore this email.

Regards,
AI Project Team
"""
    )

    with smtplib.SMTP(
        SMTP_HOST,
        SMTP_PORT,
    ) as server:

        server.starttls()

        server.login(
            SMTP_USERNAME,
            SMTP_PASSWORD,
        )

        server.send_message(message)