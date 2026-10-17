import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional
from app.core.config import settings

logger = logging.getLogger("farm_intelligence.email")

class EmailService:
    """
    Email delivery service for authentication challenges, OTP codes, and alerts.
    Adheres to PRD Addendum Section 5 (Admin OTP & Password Recovery).
    """

    @classmethod
    def is_configured(cls) -> bool:
        return bool(settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD)

    @classmethod
    def send_otp_email(cls, recipient_email: str, otp_code: str, purpose: str = "Admin Authentication") -> bool:
        """
        Deliver a 6-digit OTP to the registered email address.
        """
        subject = f"Farm Intelligence - Your {purpose} Code: {otp_code}"
        body_text = f"""
Hello,

Your verification code for {purpose} is:

    {otp_code}

This code will expire in {settings.OTP_EXPIRE_MINUTES} minutes.
If you did not initiate this request, please contact platform security immediately.

Regards,
Farm Intelligence Platform Team
"""
        body_html = f"""
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background-color: #F8F9FA; padding: 24px; color: #1F2937;">
  <div style="max-width: 500px; margin: auto; background-color: #ffffff; padding: 32px; border-radius: 8px; border: 1px solid #E5E7EB;">
    <h2 style="color: #1B4332; margin-top: 0;">Farm Intelligence</h2>
    <p>You requested a verification code for <strong>{purpose}</strong>.</p>
    <div style="background-color: #F0FDF4; border: 1px solid #86EFAC; border-radius: 6px; padding: 16px; text-align: center; margin: 24px 0;">
      <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #166534;">{otp_code}</span>
    </div>
    <p style="font-size: 14px; color: #6B7280;">This single-use code is valid for <strong>{settings.OTP_EXPIRE_MINUTES} minutes</strong>. Never share this code with anyone.</p>
    <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
    <p style="font-size: 12px; color: #9CA3AF;">If you did not request this, please secure your account.</p>
  </div>
</body>
</html>
"""

        if not cls.is_configured():
            logger.warning(
                f"[DEVELOPMENT / SANDBOX OTP] Recipient: {recipient_email} | "
                f"Purpose: {purpose} | OTP: {otp_code} (Expires in {settings.OTP_EXPIRE_MINUTES}m)"
            )
            return True

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
            msg["To"] = recipient_email

            part1 = MIMEText(body_text, "plain")
            part2 = MIMEText(body_html, "html")
            msg.attach(part1)
            msg.attach(part2)

            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_FROM_EMAIL, recipient_email, msg.as_string())

            logger.info(f"OTP successfully delivered to {recipient_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to deliver email to {recipient_email}: {str(e)}")
            return False
