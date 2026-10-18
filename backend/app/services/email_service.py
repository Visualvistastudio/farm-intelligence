import logging
import smtplib
import socket
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger("farm_intelligence.email")

class EmailService:
    """
    Email delivery service for authentication challenges, OTP codes, alerts, and notifications.
    Supports standard STARTTLS (port 587 / 25) and direct SSL (port 465).
    """

    @classmethod
    def is_configured(cls) -> bool:
        return bool(settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD)

    @classmethod
    def _create_smtp_connection(cls):
        """Helper to establish an authenticated SMTP connection with timeout."""
        host = settings.SMTP_HOST.strip()
        port = int(settings.SMTP_PORT)
        user = settings.SMTP_USER.strip()
        password = settings.SMTP_PASSWORD.strip()
        timeout = 15

        if port == 465:
            server = smtplib.SMTP_SSL(host, port, timeout=timeout)
        else:
            server = smtplib.SMTP(host, port, timeout=timeout)
            server.ehlo()
            server.starttls()
            server.ehlo()

        server.login(user, password)
        return server

    @classmethod
    def send_otp_email(cls, recipient_email: str, otp_code: str, purpose: str = "Authentication") -> bool:
        """
        Deliver a 6-digit OTP to the registered email address.
        """
        subject = f"Farm Intelligence - Your {purpose} Code: {otp_code}"
        body_text = f"""Hello,

Your verification code for {purpose} is:

    {otp_code}

This code will expire in {settings.OTP_EXPIRE_MINUTES} minutes.
If you did not initiate this request, please contact platform security immediately.

Regards,
Farm Intelligence Platform Team
"""
        body_html = f"""<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F9FA; padding: 24px; color: #1F2937;">
  <div style="max-width: 500px; margin: auto; background-color: #ffffff; padding: 32px; border-radius: 12px; border: 1px solid #E5E7EB; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="display: flex; align-items: center; margin-bottom: 20px;">
      <h2 style="color: #1B4332; margin: 0; font-size: 20px; font-weight: 800;">Farm<span style="color: #2D6A4F;">Intelligence</span></h2>
    </div>
    <p style="font-size: 15px; line-height: 1.5; color: #374151;">You requested a verification code for <strong>{purpose}</strong>.</p>
    <div style="background-color: #F0FDF4; border: 1px solid #86EFAC; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
      <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #166534; font-family: monospace;">{otp_code}</span>
    </div>
    <p style="font-size: 13px; color: #6B7280; line-height: 1.5;">This single-use code is valid for <strong>{settings.OTP_EXPIRE_MINUTES} minutes</strong>. For your security, never share this code with anyone.</p>
    <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
    <p style="font-size: 12px; color: #9CA3AF; margin: 0;">Automated message from Farm Intelligence. Initial market: Nigeria.</p>
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
            from_addr = settings.SMTP_FROM_EMAIL.strip() or "noreply@farmintelligence.africa"
            from_name = settings.SMTP_FROM_NAME.strip() or "Farm Intelligence"
            msg["From"] = f"{from_name} <{from_addr}>"
            msg["To"] = recipient_email

            msg.attach(MIMEText(body_text, "plain"))
            msg.attach(MIMEText(body_html, "html"))

            server = cls._create_smtp_connection()
            try:
                server.sendmail(from_addr, recipient_email, msg.as_string())
            finally:
                server.quit()

            logger.info(f"OTP successfully delivered to {recipient_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to deliver email to {recipient_email}: {str(e)}")
            return False

    @classmethod
    def send_test_email(cls, recipient_email: str) -> Dict[str, Any]:
        """
        Sends a test email to verify SMTP host, port, credentials, and TLS handshake.
        Returns a dictionary with status and diagnostic message.
        """
        if not cls.is_configured():
            return {
                "success": False,
                "error": "SMTP is not configured. Please supply SMTP Host, Port, Username, and Password."
            }

        subject = "Farm Intelligence - SMTP Integration Test"
        body_text = f"""Hello,

This is a test message from your Farm Intelligence platform.
If you are reading this email, your SMTP mail server settings are configured correctly!

Configuration Summary:
- SMTP Host: {settings.SMTP_HOST}
- SMTP Port: {settings.SMTP_PORT}
- Sender Address: {settings.SMTP_FROM_EMAIL}
- Sender Name: {settings.SMTP_FROM_NAME}

Regards,
Farm Intelligence Technical Operations
"""
        body_html = f"""<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F9FA; padding: 24px; color: #1F2937;">
  <div style="max-width: 500px; margin: auto; background-color: #ffffff; padding: 32px; border-radius: 12px; border: 1px solid #E5E7EB;">
    <h2 style="color: #1B4332; margin-top: 0;">Farm Intelligence</h2>
    <div style="background-color: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <h3 style="color: #065F46; margin: 0 0 8px 0; font-size: 16px;">SMTP Mail Server Connected Successfully!</h3>
      <p style="color: #047857; margin: 0; font-size: 13px;">Your email configuration is live and operational. Verification OTPs, password reset links, and agronomy alerts will now be delivered to users directly.</p>
    </div>
    <table style="width: 100%; font-size: 12px; border-collapse: collapse; margin-top: 16px;">
      <tr><td style="padding: 6px 0; color: #6B7280;">SMTP Host:</td><td style="font-weight: 600; font-family: monospace;">{settings.SMTP_HOST}</td></tr>
      <tr><td style="padding: 6px 0; color: #6B7280;">SMTP Port:</td><td style="font-weight: 600; font-family: monospace;">{settings.SMTP_PORT}</td></tr>
      <tr><td style="padding: 6px 0; color: #6B7280;">Sender Email:</td><td style="font-weight: 600;">{settings.SMTP_FROM_EMAIL}</td></tr>
      <tr><td style="padding: 6px 0; color: #6B7280;">Sender Name:</td><td style="font-weight: 600;">{settings.SMTP_FROM_NAME}</td></tr>
    </table>
  </div>
</body>
</html>
"""

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            from_addr = settings.SMTP_FROM_EMAIL.strip() or "noreply@farmintelligence.africa"
            from_name = settings.SMTP_FROM_NAME.strip() or "Farm Intelligence"
            msg["From"] = f"{from_name} <{from_addr}>"
            msg["To"] = recipient_email

            msg.attach(MIMEText(body_text, "plain"))
            msg.attach(MIMEText(body_html, "html"))

            server = cls._create_smtp_connection()
            try:
                server.sendmail(from_addr, recipient_email, msg.as_string())
            finally:
                server.quit()

            return {
                "success": True,
                "message": f"Test email dispatched successfully to {recipient_email}."
            }
        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"SMTP Authentication Error: {e}")
            return {
                "success": False,
                "error": f"Authentication failed (code {e.smtp_code}): Check your SMTP Username and Password. If using Gmail, make sure you generated an App Password with 2-Step Verification enabled."
            }
        except (smtplib.SMTPConnectError, socket.timeout) as e:
            logger.error(f"SMTP Connection Error: {e}")
            return {
                "success": False,
                "error": f"Connection timed out or failed to connect to {settings.SMTP_HOST}:{settings.SMTP_PORT}. Verify that the host and port are correct and open."
            }
        except Exception as e:
            logger.error(f"SMTP Error: {str(e)}")
            return {
                "success": False,
                "error": f"SMTP delivery error: {str(e)}"
            }
