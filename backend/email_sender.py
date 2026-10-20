import smtplib
import html as html_lib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv
import logging

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
load_dotenv()

logger = logging.getLogger("potholeai.email")

EMAIL_SENDER = os.getenv("EMAIL_SENDER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
EMAIL_RECEIVER = os.getenv("EMAIL_RECEIVER")


def _escape(value: str) -> str:
    """HTML-escape a value before embedding it in an HTML email."""
    return html_lib.escape(str(value), quote=True)


def send_complaint_email(tracking_id: str, location: str, severity: int,
                          pothole_count: int, report_text: str):
    if not all([EMAIL_SENDER, EMAIL_PASSWORD, EMAIL_RECEIVER]) or any("REPLACE_WITH" in str(s) for s in [EMAIL_SENDER, EMAIL_PASSWORD, EMAIL_RECEIVER]):
        logger.info("Email credentials not configured or placeholder — skipping notification")
        return False


    try:
        # Escape all user-controlled values before embedding in HTML
        safe_tracking_id = _escape(tracking_id)
        safe_location = _escape(location)
        safe_severity = _escape(str(severity))
        safe_pothole_count = _escape(str(pothole_count))
        safe_report_text = _escape(report_text)

        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Road Damage Complaint #{safe_tracking_id} — Severity {safe_severity}/10"
        msg["From"] = EMAIL_SENDER
        msg["To"] = EMAIL_RECEIVER

        priority_text = "HIGH PRIORITY" if severity >= 7 else "MEDIUM" if severity >= 4 else "LOW"
        priority_color = "#dc3545" if severity >= 7 else "#fd7e14" if severity >= 4 else "#28a745"
        safe_priority_color = _escape(priority_color)

        html_body = f"""
<html>
<body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #00d4ff, #7b2ff7); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0;">PotholeAI</h1>
      <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0;">Road Damage Reporting System</p>
    </div>
    <div style="padding: 24px;">
      <div style="background: {safe_priority_color}15; border-left: 5px solid {safe_priority_color}; padding: 16px; margin-bottom: 20px;">
        <h2 style="margin: 0; color: {safe_priority_color};">{priority_text} — Complaint #{safe_tracking_id}</h2>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr style="background: #f8f9fa;">
          <td style="padding: 12px; border: 1px solid #e9ecef; font-weight: bold;">Location</td>
          <td style="padding: 12px; border: 1px solid #e9ecef;">{safe_location}</td>
        </tr>
        <tr>
          <td style="padding: 12px; border: 1px solid #e9ecef; font-weight: bold;">Potholes</td>
          <td style="padding: 12px; border: 1px solid #e9ecef;">{safe_pothole_count} detected</td>
        </tr>
        <tr style="background: #f8f9fa;">
          <td style="padding: 12px; border: 1px solid #e9ecef; font-weight: bold;">Severity</td>
          <td style="padding: 12px; border: 1px solid #e9ecef;">
            <strong style="color: {safe_priority_color};">{safe_severity}/10</strong>
          </td>
        </tr>
      </table>
      <div style="background: #f8f9fa; border-left: 4px solid #7b2ff7; padding: 16px; border-radius: 4px;">
        <h3 style="color: #7b2ff7; margin: 0 0 10px;">AI Generated Report</h3>
        <p style="color: #444; line-height: 1.7; white-space: pre-wrap;">{safe_report_text}</p>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;">
        Filed by PotholeAI — Tracking ID: <strong>{safe_tracking_id}</strong>
      </div>
    </div>
  </div>
</body>
</html>
        """

        text_body = (
            f"Complaint #{tracking_id}\n"
            f"Location: {location}\n"
            f"Potholes: {pothole_count}\n"
            f"Severity: {severity}/10\n\n"
            f"{report_text}"
        )

        msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=10) as server:
            server.login(EMAIL_SENDER, EMAIL_PASSWORD)
            server.send_message(msg)


        logger.info("Complaint email sent for tracking_id=%s", tracking_id)
        return True

    except Exception as e:
        logger.error("Email send error: %s", type(e).__name__)
        return False


if __name__ == "__main__":
    send_complaint_email("PTH-TEST", "Sector 62, Noida", 7, 3, "Test report.")