from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, EmailStr, field_validator, constr
from typing import Optional, List
from datetime import datetime, timedelta
import os
import shutil
import uuid
import re
import csv
import io
import logging
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
load_dotenv()

from database import engine, Base, get_db, Report, User, calculate_level, POINTS_PER_REPORT, POINTS_PER_POTHOLE, POINTS_PER_RESOLVED
from model import detect_potholes
from agent import generate_report
from email_sender import send_complaint_email
from auth import hash_password, verify_password, create_access_token, get_current_user, get_current_user_optional, require_admin

# ============================================
# 🪵 STRUCTURED LOGGING (no sensitive payloads)
# ============================================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("potholeai")


# ============================================
# 🤖 GEMINI AI SETUP
# ============================================
import google.genai as genai
from google.genai import types as genai_types
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
gemini_client = None
gemini_model = None

if GEMINI_API_KEY:
    try:
        gemini_client = genai.Client(api_key=GEMINI_API_KEY)
        gemini_model = "gemini-1.5-flash"  # model name string for the new SDK
        logger.info("Gemini AI initialized")
    except Exception as e:
        logger.warning("Gemini init failed: %s", type(e).__name__)
else:
    logger.warning("GEMINI_API_KEY not set — chatbot will use fallback responses")

# ============================================
# 🚀 APP INITIALIZATION
# ============================================
from database import init_db
init_db()


# Rate-limiter (per IP)
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])

app = FastAPI(
    title="PotholeAI API",
    version="3.0",
    # Disable automatic /docs and /redoc in non-debug mode
    docs_url="/docs" if os.getenv("DEBUG", "false").lower() == "true" else None,
    redoc_url="/redoc" if os.getenv("DEBUG", "false").lower() == "true" else None,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ──────────────────────────────────────────────────────────────────────
# SECURITY: restrict to the actual frontend origin(s). Wildcards + credentials
# violate the CORS spec and allow any origin to make credentialed requests.
_RAW_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
ALLOWED_ORIGINS: list[str] = [o.strip() for o in _RAW_ORIGINS.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT"],
    allow_headers=["Authorization", "Content-Type"],
)

# ── Security response headers ─────────────────────────────────────────────────
@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), camera=()"
    # Note: set Strict-Transport-Security via your reverse-proxy/TLS terminator
    return response

# ── Upload directory (outside web root for safety; served via FastAPI only) ──
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Allowed image MIME types and extensions
ALLOWED_IMAGE_TYPES = {"jpeg", "png", "gif", "webp"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB

# ── Admin invite code ─────────────────────────────────────────────────────────
ADMIN_INVITE_CODE = os.getenv("ADMIN_CODE", "")
if not ADMIN_INVITE_CODE:
    logger.warning("ADMIN_CODE env var is not set. Admin registration is DISABLED.")


# ============================================
# 🏠 BASIC ROUTES
# ============================================
@app.get("/")
def home():
    return {
        "message": "PotholeAI API is running",
        "version": "3.0",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "pothole-api"}


@app.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    total = db.query(Report).count()
    resolved = db.query(Report).filter(Report.status == "resolved").count()
    pending = db.query(Report).filter(Report.status == "pending").count()
    return {"total": total, "resolved": resolved, "pending": pending}


# ============================================
# 🔐 AUTH ROUTES
# ============================================
class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    city: Optional[str] = "Noida"
    role: Optional[str] = "citizen"
    admin_code: Optional[str] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2 or len(v) > 100:
            raise ValueError("Name must be between 2 and 100 characters.")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters.")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one digit.")
        if not re.search(r"[^A-Za-z0-9]", v):
            raise ValueError("Password must contain at least one special character.")
        return v

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        if v not in ("citizen", "admin"):
            raise ValueError("Role must be 'citizen' or 'admin'.")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if v and not re.fullmatch(r"[\d\s\+\-\(\)]{7,20}", v):
            raise ValueError("Invalid phone number format.")
        return v

    @field_validator("city")
    @classmethod
    def validate_city(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return "Noida"
        v = v.strip()
        if len(v) > 50:
            raise ValueError("City name too long.")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) > 128:
            raise ValueError("Password too long.")
        return v


@app.post("/auth/register")
@limiter.limit("10/minute")
def register(request: Request, req: RegisterRequest, db: Session = Depends(get_db)):
    # Check if email exists
    existing = db.query(User).filter(User.email == req.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered. Please sign in.")

    # Validate role
    role = "citizen"
    if req.role == "admin":
        if not ADMIN_INVITE_CODE:
            raise HTTPException(status_code=403, detail="Admin registration is currently disabled.")
        if req.admin_code != ADMIN_INVITE_CODE:
            raise HTTPException(status_code=403, detail="Invalid admin invite code.")
        role = "admin"

    new_user = User(
        name=req.name,
        email=req.email.lower(),
        hashed_password=hash_password(req.password),
        phone=req.phone,
        city=req.city,
        role=role,
        civic_score=0,
        reports_count=0,
        resolved_count=0,
        level=1,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    logger.info("New user registered: id=%s role=%s", new_user.id, role)

    token = create_access_token({
        "sub": str(new_user.id),
        "email": new_user.email,
        "name": new_user.name,
        "role": new_user.role,
    })

    return {
        "token": token,
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
            "role": new_user.role,
            "civic_score": new_user.civic_score,
            "level": new_user.level,
            "city": new_user.city,
        }
    }


@app.post("/auth/login")
@limiter.limit("20/minute")
def login(request: Request, req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower()).first()
    # Use constant-time comparison via verify_password even on missing user
    dummy_hash = "$2b$12$dMTVWczgB07EV3vjFJ/ldeIFBjQpjxifNgQid1l0NFrOJISJvhtsG"
    if not user:
        verify_password(req.password, dummy_hash)  # prevent timing oracle
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account has been deactivated.")

    user.last_login = datetime.utcnow()
    db.commit()

    logger.info("Login: user_id=%s role=%s", user.id, user.role)

    token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "name": user.name,
        "role": user.role,
    })

    return {
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "civic_score": user.civic_score,
            "level": user.level,
            "city": user.city,
            "reports_count": user.reports_count,
            "resolved_count": user.resolved_count,
        }
    }


@app.get("/auth/me")
def get_me(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == int(current_user["sub"])).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "civic_score": user.civic_score,
        "level": user.level,
        "city": user.city,
        "reports_count": user.reports_count,
        "resolved_count": user.resolved_count,
        "created_at": user.created_at,
    }


# ============================================
# 📋 REPORT ROUTES
# ============================================

VALID_STATUSES = {"pending", "in_review", "resolved"}


def _validate_upload(image: UploadFile) -> None:
    """Raise HTTPException for disallowed upload types, extensions, or sizes."""
    # Check extension
    _, ext = os.path.splitext(image.filename or "")
    if ext.lower() not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Permitted types: {', '.join(ALLOWED_EXTENSIONS)}",
        )
    # Check Content-Type header
    if image.content_type and not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are accepted.")


@app.post("/report")
@limiter.limit("5/minute")
async def create_report(
    request: Request,
    image: UploadFile = File(...),
    location_address: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    # ── Input validation ───────────────────────────────────────────────────────
    _validate_upload(image)

    location_address = location_address.strip()
    if not location_address or len(location_address) > 500:
        raise HTTPException(status_code=400, detail="location_address must be 1-500 characters.")

    if not (-90 <= latitude <= 90):
        raise HTTPException(status_code=400, detail="Latitude out of valid range (-90 to 90).")
    if not (-180 <= longitude <= 180):
        raise HTTPException(status_code=400, detail="Longitude out of valid range (-180 to 180).")

    # ── Read and size-check the file ──────────────────────────────────────────
    contents = await image.read()
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Image exceeds 10 MB limit.")

    # ── Magic-byte content-type verification via Pillow ────────────────────────
    from PIL import Image as PILImage
    try:
        pil_img = PILImage.open(io.BytesIO(contents))
        detected_type = pil_img.format.lower() if pil_img.format else None
        # Normalize jpg
        if detected_type == "jpeg":
            detected_type = "jpeg"
        if detected_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(status_code=400, detail="File content does not match an allowed image type.")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Could not decode image file. Upload a valid image.")

    # ── Safe filename — strip user-supplied name entirely ─────────────────────
    safe_ext = f".{detected_type}" if detected_type != "jpeg" else ".jpg"
    saved_filename = f"{uuid.uuid4().hex}{safe_ext}"
    saved_path = os.path.join(UPLOAD_DIR, saved_filename)

    with open(saved_path, "wb") as buffer:
        buffer.write(contents)

    detection = detect_potholes(saved_path, save_dir=os.path.join(UPLOAD_DIR, "results"))

    report_text = generate_report(
        location=location_address,
        severity=detection["severity"],
        pothole_count=detection["pothole_count"],
        latitude=latitude,
        longitude=longitude
    )

    tracking_id = f"PTH-{uuid.uuid4().hex[:8].upper()}"

    user_id = None
    reporter_name = None
    if current_user:
        user_id = int(current_user["sub"])
        reporter_name = current_user.get("name")

    new_report = Report(
        tracking_id=tracking_id,
        location_address=location_address,
        latitude=latitude,
        longitude=longitude,
        severity=detection["severity"],
        pothole_count=detection["pothole_count"],
        status="pending",
        report_text=report_text,
        image_path=saved_path,
        user_id=user_id,
        reporter_name=reporter_name,
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    # Award civic points
    if user_id:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            points_earned = POINTS_PER_REPORT + (detection["pothole_count"] * POINTS_PER_POTHOLE)
            user.civic_score += points_earned
            user.reports_count += 1
            user.level = calculate_level(user.civic_score)
            db.commit()
            logger.info("Awarded %d points to user_id=%s", points_earned, user_id)

    logger.info("Report created: tracking_id=%s severity=%s", tracking_id, detection["severity"])
    try:
        send_complaint_email(
            tracking_id=tracking_id,
            location=location_address,
            severity=detection["severity"],
            pothole_count=detection["pothole_count"],
            report_text=report_text
        )
    except Exception as e:
        logger.warning("Email send failed: %s", type(e).__name__)

    return {
        "tracking_id": tracking_id,
        "pothole_count": detection["pothole_count"],
        "severity": detection["severity"],
        "report_text": report_text,
        "image_url": f"/uploads/{saved_filename}",
        "result_image_path": detection["result_image_path"],
        "status": "pending"
    }


@app.get("/reports")
def get_all_reports(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Admin-only: list all reports (paginated would be ideal at scale)."""
    reports = db.query(Report).order_by(Report.created_at.desc()).all()
    return reports


@app.get("/my-reports")
def get_my_reports(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Authenticated users: list their own reports."""
    user_id = int(current_user["sub"])
    reports = db.query(Report).filter(Report.user_id == user_id).order_by(Report.created_at.desc()).all()
    return [
        {
            "id": r.id,
            "tracking_id": r.tracking_id,
            "location_address": r.location_address,
            "latitude": r.latitude,
            "longitude": r.longitude,
            "severity": r.severity,
            "pothole_count": r.pothole_count,
            "status": r.status,
            "report_text": r.report_text,
            "image_url": f"/uploads/{os.path.basename(r.image_path)}" if r.image_path else None,
            "created_at": r.created_at,
            "user_id": r.user_id,
            "reporter_name": r.reporter_name,
        }
        for r in reports
    ]


@app.get("/dashboard/reports")
def get_dashboard_reports(db: Session = Depends(get_db)):
    """Public: all reports with safe fields for the city dashboard."""
    reports = db.query(Report).order_by(Report.created_at.desc()).all()
    return [
        {
            "id": r.id,
            "tracking_id": r.tracking_id,
            "location_address": r.location_address,
            "latitude": r.latitude,
            "longitude": r.longitude,
            "severity": r.severity,
            "pothole_count": r.pothole_count,
            "status": r.status,
            "created_at": r.created_at,
            "reporter_name": r.reporter_name,
        }
        for r in reports
    ]


@app.get("/reports/{tracking_id}")
def get_report(tracking_id: str, db: Session = Depends(get_db)):
    # Restrict tracking_id to safe characters only (prevents injection)
    if not re.fullmatch(r"PTH-[A-F0-9]{8}", tracking_id):
        raise HTTPException(status_code=400, detail="Invalid tracking ID format.")
    report = db.query(Report).filter(Report.tracking_id == tracking_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    # Return only safe public fields — don't expose image_path or user_id
    return {
        "tracking_id": report.tracking_id,
        "location_address": report.location_address,
        "latitude": report.latitude,
        "longitude": report.longitude,
        "severity": report.severity,
        "pothole_count": report.pothole_count,
        "status": report.status,
        "report_text": report.report_text,
        "image_url": f"/uploads/{os.path.basename(report.image_path)}" if report.image_path else None,
        "created_at": report.created_at,
    }


@app.put("/reports/{tracking_id}/status")
def update_status(
    tracking_id: str,
    status: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    # Validate tracking_id format
    if not re.fullmatch(r"PTH-[A-F0-9]{8}", tracking_id):
        raise HTTPException(status_code=400, detail="Invalid tracking ID format.")

    # Allowlist status values — prevent arbitrary status injection
    if status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(VALID_STATUSES)}",
        )

    report = db.query(Report).filter(Report.tracking_id == tracking_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")

    old_status = report.status
    report.status = status
    db.commit()
    logger.info("Status updated: tracking_id=%s %s->%s by admin_id=%s",
                tracking_id, old_status, status, current_user.get("sub"))

    if status == "resolved" and old_status != "resolved" and report.user_id:
        user = db.query(User).filter(User.id == report.user_id).first()
        if user:
            user.civic_score += POINTS_PER_RESOLVED
            user.resolved_count += 1
            user.level = calculate_level(user.civic_score)
            db.commit()

    return {"message": "Status updated", "tracking_id": tracking_id, "status": status}


# ============================================
# 🏆 LEADERBOARD
# ============================================
@app.get("/leaderboard")
def get_leaderboard(limit: int = 10, db: Session = Depends(get_db)):
    """Top civic contributors ranked by score"""
    if limit < 1 or limit > 100:
        raise HTTPException(status_code=400, detail="limit must be between 1 and 100.")
    top_users = (
        db.query(User)
        .filter(User.role == "citizen", User.reports_count > 0)
        .order_by(User.civic_score.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "rank": i + 1,
            "name": u.name,
            "city": u.city,
            "civic_score": u.civic_score,
            "level": u.level,
            "reports_count": u.reports_count,
            "resolved_count": u.resolved_count,
            "badge": _get_top_badge(u.civic_score, u.reports_count),
        }
        for i, u in enumerate(top_users)
    ]


def _get_top_badge(score: int, reports: int) -> str:
    if score >= 2000: return "🌟 Legend"
    if score >= 1000: return "⚡ Elite"
    if reports >= 10: return "🦸 Civic Hero"
    if reports >= 5: return "🏹 Hunter"
    if reports >= 1: return "🎯 Reporter"
    return "🌱 Newcomer"


# ============================================
# 📊 EXPORT ROUTES (Admin only)
# ============================================
@app.get("/export/csv")
def export_reports_csv(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Export all reports (or filtered by status) as a CSV file"""
    # Validate status_filter
    if status_filter and status_filter != "all" and status_filter not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status_filter.")

    query = db.query(Report).order_by(Report.created_at.desc())
    if status_filter and status_filter != "all":
        query = query.filter(Report.status == status_filter)
    reports = query.all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Tracking ID", "Location", "Latitude", "Longitude",
        "Severity", "Pothole Count", "Status", "Reporter",
        "Report Text", "Created At"
    ])
    for r in reports:
        writer.writerow([
            r.tracking_id,
            r.location_address,
            r.latitude,
            r.longitude,
            r.severity,
            r.pothole_count,
            r.status,
            r.reporter_name or "Anonymous",
            (r.report_text or "").replace("\n", " "),
            r.created_at.strftime("%Y-%m-%d %H:%M") if r.created_at else "",
        ])

    csv_content = output.getvalue()
    filename = f"pothole_reports_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


# ============================================
# 🤖 CHATBOT ENDPOINT
# ============================================
class ChatMessage(BaseModel):
    sender: str
    text: str


class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[dict]] = None

    @field_validator("message")
    @classmethod
    def validate_message(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Message cannot be empty.")
        if len(v) > 1000:
            raise ValueError("Message exceeds maximum length of 1000 characters.")
        return v


class ChatResponse(BaseModel):
    reply: str
    intent: str
    data: Optional[dict] = None
    suggestions: Optional[List[str]] = None


def detect_intent(message: str) -> str:
    """Classify user intent"""
    msg = message.lower()
    if any(word in msg for word in ['hello', 'hi ', 'hey', 'help', 'what can you']):
        return 'greeting'
    elif re.search(r'pth[-\s]?\w+', msg) or 'track' in msg or 'my report' in msg or 'status of' in msg:
        return 'track_report'
    elif any(word in msg for word in ['stat', 'how many', 'count', 'total', 'numbers', 'overview']):
        return 'show_stats'
    elif any(word in msg for word in ['worst', 'most damaged', 'severe', 'critical', 'top', 'dangerous']):
        return 'worst_areas'
    elif any(word in msg for word in ['file', 'new', 'submit', 'complaint', 'create report']):
        return 'file_report'
    elif any(word in msg for word in ['pending', 'resolved', 'review', 'progress']):
        return 'status_query'
    elif any(word in msg for word in ['who', 'about', 'team', 'creator', 'made']):
        return 'about_us'
    elif any(word in msg for word in ['how', 'work', 'process', 'explain']):
        return 'how_it_works'
    elif any(word in msg for word in ['leaderboard', 'top', 'rank', 'score', 'points', 'xp']):
        return 'leaderboard'
    else:
        return 'general_query'


def extract_tracking_id(message: str) -> Optional[str]:
    """Extract tracking ID from message"""
    match = re.search(r'(pth[-\s]?[a-z0-9]+)', message.lower())
    if match:
        tid = match.group(1).replace(' ', '-').replace('--', '-').upper()
        if not tid.startswith('PTH-'):
            tid = 'PTH-' + tid.replace('PTH', '')
        return tid
    return None


def get_city_stats(db: Session) -> dict:
    total = db.query(Report).count()
    resolved = db.query(Report).filter(Report.status == 'resolved').count()
    pending = db.query(Report).filter(Report.status == 'pending').count()
    in_review = db.query(Report).filter(Report.status == 'in_review').count()
    avg_severity = db.query(func.avg(Report.severity)).scalar() or 0
    total_potholes = db.query(func.sum(Report.pothole_count)).scalar() or 0
    week_ago = datetime.utcnow() - timedelta(days=7)
    this_week = db.query(Report).filter(Report.created_at >= week_ago).count()
    return {
        "total_reports": total,
        "resolved": resolved,
        "pending": pending,
        "in_review": in_review,
        "resolution_rate": round((resolved / total * 100) if total > 0 else 0, 1),
        "avg_severity": round(float(avg_severity), 1),
        "total_potholes": int(total_potholes),
        "reports_this_week": this_week,
    }


def get_worst_areas(db: Session, limit: int = 5) -> list:
    reports = db.query(Report).filter(
        Report.severity >= 7
    ).order_by(Report.severity.desc()).limit(limit).all()
    return [{
        "tracking_id": r.tracking_id,
        "location": r.location_address,
        "severity": r.severity,
        "status": r.status,
    } for r in reports]


def generate_ai_response(message: str, intent: str, data: dict, history: list) -> str:
    if not gemini_client:
        return get_fallback_response(intent, data)

    history_text = ""
    if history:
        for msg in history[-3:]:
            role = "User" if msg.get('sender') == 'user' else "Assistant"
            text = str(msg.get('text', ''))[:500]
            history_text += f"{role}: {text}\n"

    safe_message = message[:500]

    prompt = f"""You are PotholeGPT, a friendly AI assistant for PotholeAI — a civic platform that helps citizens report road damage in JIIT Noida.

PERSONALITY:
- Helpful, concise, professional
- Use 1-2 emojis max per response
- Reply in 2-3 short sentences
- Encourage civic engagement

PREVIOUS CONVERSATION:
{history_text}

USER MESSAGE: "{safe_message}"
DETECTED INTENT: {intent}
AVAILABLE DATA: {data}

INSTRUCTIONS:
- Only use information from AVAILABLE DATA — never invent data
- If intent is 'file_report', tell them you'll redirect to /report page
- Be natural, not robotic

Generate a helpful response:"""

    try:
        response = gemini_client.models.generate_content(
            model=gemini_model,
            contents=prompt,
        )
        return response.text.strip()
    except Exception as e:
        logger.warning("Gemini chat error: %s", type(e).__name__)
        return get_fallback_response(intent, data)


def get_fallback_response(intent: str, data: dict) -> str:
    if intent == 'greeting':
        return "👋 Hi! I'm PotholeGPT. I can help you check city stats, track reports, or file new complaints. What would you like to do?"
    if intent == 'show_stats' and data.get('total_reports') is not None:
        return f"📊 We have **{data['total_reports']}** total reports — {data['resolved']} resolved, {data['pending']} pending. Resolution rate: **{data['resolution_rate']}%**."
    if intent == 'track_report':
        if data.get('error'):
            return f"⚠️ {data['error']}. Try a format like 'PTH-ABC12345'."
        return f"📋 Report **{data.get('tracking_id')}** at {data.get('location')} is currently **{data.get('status')}** with severity {data.get('severity')}/10."
    if intent == 'worst_areas' and data.get('worst_areas'):
        count = len(data['worst_areas'])
        return f"⚠️ Found **{count} critical areas** with severity 7+."
    if intent == 'file_report':
        return "📋 Great! I'll redirect you to the report page. You'll need to upload a photo and mark the location."
    if intent == 'about_us':
        return "🚀 PotholeAI was built by students at JIIT Noida to help citizens report road damage using AI."
    if intent == 'how_it_works':
        return "🎯 Simple! 1) Take a photo 2) AI detects severity 3) Gemini drafts a complaint 4) You get a tracking ID."
    if intent == 'leaderboard':
        return "🏆 Check the Leaderboard to see top civic contributors!"
    return "I can help with city statistics, tracking reports, or filing new complaints. Try asking 'show stats' or 'track PTH-XXX'."


@app.post("/chat/", response_model=ChatResponse)
@limiter.limit("30/minute")
async def chat(request: Request, req: ChatRequest, db: Session = Depends(get_db)):
    """Main chatbot endpoint"""
    message = req.message  # already validated by Pydantic
    intent = detect_intent(message)

    context_data: dict = {}
    suggestions: list = []

    try:
        if intent == 'show_stats':
            context_data = get_city_stats(db)
            suggestions = ["🏆 Show worst affected areas", "📋 File a new report", "🗺️ Open dashboard"]
        elif intent == 'track_report':
            tracking_id = extract_tracking_id(message)
            if tracking_id:
                report = db.query(Report).filter(
                    Report.tracking_id == tracking_id
                ).first()
                if report:
                    context_data = {
                        "tracking_id": report.tracking_id,
                        "location": report.location_address,
                        "severity": report.severity,
                        "pothole_count": report.pothole_count,
                        "status": report.status,
                        "created_at": report.created_at.strftime("%d %b %Y"),
                    }
                else:
                    context_data = {"error": f"No report found with ID {tracking_id}"}
            else:
                context_data = {"error": "Please provide a tracking ID like PTH-ABC12345"}
            suggestions = ["📋 File a new report", "📊 Show city statistics", "🔍 Track another report"]
        elif intent == 'worst_areas':
            worst = get_worst_areas(db)
            context_data = {"worst_areas": worst, "count": len(worst)}
            suggestions = ["🗺️ Open dashboard", "📊 Show all stats", "📋 File a new report"]
        elif intent == 'status_query':
            stats = get_city_stats(db)
            context_data = {"pending": stats["pending"], "resolved": stats["resolved"], "in_review": stats["in_review"]}
            suggestions = ["📈 Show full statistics", "🏆 Worst areas", "📋 File new report"]
        elif intent == 'file_report':
            context_data = {"action": "redirect_to_report"}
            suggestions = ["📊 Show statistics first", "❓ How does it work?", "🏆 Show worst areas"]
        elif intent == 'greeting':
            context_data = get_city_stats(db)
            suggestions = ["📊 Show me city stats", "🔍 Track my report", "📋 File a new complaint"]
        elif intent == 'leaderboard':
            top = db.query(User).filter(User.role == "citizen", User.reports_count > 0).order_by(User.civic_score.desc()).limit(3).all()
            context_data = {"top_users": [{"name": u.name, "score": u.civic_score, "reports": u.reports_count} for u in top]}
            suggestions = ["🏆 View full leaderboard", "📋 File a report", "📊 Show city stats"]
        elif intent in ['about_us', 'how_it_works']:
            suggestions = ["📊 Show city stats", "📋 File a report", "🏆 Show worst areas"]
        else:
            suggestions = ["📊 Show statistics", "📋 File report", "❓ How does it work?"]
    except Exception:
        logger.exception("DB error in chat handler")
        context_data = {"error": "Service temporarily unavailable."}

    history = req.conversation_history or []
    reply = generate_ai_response(message, intent, context_data, history)

    return ChatResponse(reply=reply, intent=intent, data=context_data, suggestions=suggestions)


# ============================================
# 🚀 STARTUP
# ============================================
@app.on_event("startup")
async def startup_event():
    logger.info("PotholeAI Backend v3.0 started")
    logger.info("Upload dir: %s", UPLOAD_DIR)
    logger.info("Allowed origins: %s", ALLOWED_ORIGINS)
    logger.info("Gemini AI: %s", "active" if gemini_model else "inactive")