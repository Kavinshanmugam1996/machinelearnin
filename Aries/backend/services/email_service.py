import os
import logging
import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger("aires")

FROM_EMAIL = os.getenv("SES_FROM_EMAIL", "noreply@aires-risk.com")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://aires-risk.com")
AWS_REGION = os.getenv("AWS_DEFAULT_REGION", "ca-central-1")


def _ses_client():
    return boto3.client("ses", region_name=AWS_REGION)


def send_verification_email(to_email: str, token: str) -> bool:
    verify_url = f"{FRONTEND_URL}/verify-email.html?token={token}"
    subject = "Verify your AIRES Inspect account"
    body_html = f"""
    <html><body>
      <h2>Welcome to AIRES Inspect</h2>
      <p>Please verify your email address by clicking the link below:</p>
      <p><a href="{verify_url}">Verify Email Address</a></p>
      <p>This link expires in 24 hours.</p>
      <p>If you did not create an account, you can ignore this email.</p>
    </body></html>
    """
    body_text = f"Verify your AIRES Inspect account:\n\n{verify_url}\n\nThis link expires in 24 hours."
    return _send_email(to_email, subject, body_html, body_text)


def send_password_reset_email(to_email: str, token: str) -> bool:
    reset_url = f"{FRONTEND_URL}/reset-password.html?token={token}"
    subject = "Reset your AIRES Inspect password"
    body_html = f"""
    <html><body>
      <h2>Password Reset Request</h2>
      <p>You requested a password reset for your AIRES Inspect account.</p>
      <p><a href="{reset_url}">Reset Password</a></p>
      <p>This link expires in 1 hour. If you did not request a reset, ignore this email.</p>
    </body></html>
    """
    body_text = f"Reset your AIRES Inspect password:\n\n{reset_url}\n\nThis link expires in 1 hour."
    return _send_email(to_email, subject, body_html, body_text)


def _send_email(to_email: str, subject: str, body_html: str, body_text: str) -> bool:
    try:
        _ses_client().send_email(
            Source=FROM_EMAIL,
            Destination={"ToAddresses": [to_email]},
            Message={
                "Subject": {"Data": subject, "Charset": "UTF-8"},
                "Body": {
                    "Html": {"Data": body_html, "Charset": "UTF-8"},
                    "Text": {"Data": body_text, "Charset": "UTF-8"},
                },
            },
        )
        logger.info(f"Email sent to {to_email}: {subject}")
        return True
    except ClientError as e:
        logger.error(f"SES send failed to {to_email}: {e.response['Error']['Message']}")
        return False
