import google.genai as genai
import os
import logging
from dotenv import load_dotenv

logger = logging.getLogger("potholeai.agent")

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
gemini_client = None
gemini_model = None

if GEMINI_API_KEY:
    try:
        gemini_client = genai.Client(api_key=GEMINI_API_KEY)
        gemini_model = "gemini-1.5-flash"
    except Exception as exc:
        logger.warning("Gemini initialization failed in agent: %s", type(exc).__name__)


def generate_report(location: str, severity: int, pothole_count: int, latitude: float = None, longitude: float = None):
    """
    Uses Gemini AI to generate a formal municipal complaint report.
    """
    fallback_report = (
        f"Subject: Urgent Road Repair Request for {location}\n\n"
        f"This complaint is submitted regarding the reported pothole damage at {location}. "
        f"The inspection indicates {pothole_count} pothole(s) with a severity score of {severity}/10. "
        f"The location coordinates are {latitude}, {longitude}. This condition creates a safety hazard "
        f"for commuters and pedestrians and requires prompt municipal attention. "
        f"We request that the concerned authorities carry out immediate inspection and repair work. "
        f"We appreciate timely action to ensure road safety and reduce further damage."
    )

    if not gemini_client or not gemini_model:
        return fallback_report

    prompt = f"""
You are an AI assistant for a Road Damage Reporting System. Write a FORMAL complaint report to be submitted to the local municipal corporation based on the following AI detection results:

- Location: {location}
- Coordinates: {latitude}, {longitude}
- Number of potholes detected: {pothole_count}
- Severity Score: {severity}/10 (10 = most severe/dangerous)

The report should include:
1. A formal subject line
2. Description of the road damage
3. Urgency level (based on severity)
4. Recommended action for the authority
5. A polite closing requesting timely repair

Keep it professional, concise, and suitable for an official government complaint portal. Do not use markdown formatting, just plain formal text.
"""

    try:
        response = gemini_client.models.generate_content(
            model=gemini_model,
            contents=prompt,
        )
        return response.text.strip() if getattr(response, "text", None) else fallback_report
    except Exception as exc:
        logger.warning("Gemini report generation failed: %s", type(exc).__name__)
        return fallback_report



# Quick test
if __name__ == "__main__":
    report = generate_report(
        location="Sector 62, Noida, Uttar Pradesh",
        severity=7,
        pothole_count=3,
        latitude=28.6139,
        longitude=77.3910
    )
    print("✅ Gemini Report Generated:\n")
    print(report)