from sqlalchemy import create_engine, Column, Integer, String, Float, Text, Enum, TIMESTAMP, Boolean
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.sql import func
from dotenv import load_dotenv
import os

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
load_dotenv()

DB_HOST = os.getenv("DB_HOST")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    if DB_HOST and DB_USER and DB_NAME:
        DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"
    else:
        DATABASE_URL = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'pothole_reports.db')}"

engine_kwargs = {}
if DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def init_db():
    """Create tables and ensure all columns exist (SQLite migration support)"""
    Base.metadata.create_all(bind=engine)
    if DATABASE_URL.startswith("sqlite"):
        try:
            with engine.connect() as conn:
                from sqlalchemy import text
                res = conn.execute(text("PRAGMA table_info(reports)"))
                cols = [r[1] for r in res.fetchall()]
                if cols and "user_id" not in cols:
                    conn.execute(text("ALTER TABLE reports ADD COLUMN user_id INTEGER"))
                if cols and "reporter_name" not in cols:
                    conn.execute(text("ALTER TABLE reports ADD COLUMN reporter_name VARCHAR(100)"))
                conn.commit()
        except Exception:
            pass



# ============================================
# 🛣️ REPORT MODEL
# ============================================
class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    tracking_id = Column(String(20), unique=True, nullable=False)
    location_address = Column(String(255))
    latitude = Column(Float)
    longitude = Column(Float)
    severity = Column(Integer)
    pothole_count = Column(Integer, default=0)
    status = Column(Enum("pending", "in_review", "resolved"), default="pending")
    report_text = Column(Text)
    image_path = Column(String(255))
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    # 👤 Link report to a user (optional — backward compatible)
    user_id = Column(Integer, nullable=True)
    reporter_name = Column(String(100), nullable=True)


# ============================================
# 👤 USER MODEL (for auth + gamification)
# ============================================
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    city = Column(String(50), default="Noida")
    role = Column(Enum("citizen", "admin"), default="citizen", nullable=False)
    is_active = Column(Boolean, default=True)

    # 🏆 Gamification fields
    civic_score = Column(Integer, default=0)    # Total score points
    reports_count = Column(Integer, default=0)  # Total reports filed
    resolved_count = Column(Integer, default=0) # Reports resolved (awarded bonus)
    level = Column(Integer, default=1)          # Computed level

    created_at = Column(TIMESTAMP, server_default=func.now())
    last_login = Column(TIMESTAMP, nullable=True)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ============================================
# 🧮 SCORING HELPERS
# ============================================
POINTS_PER_REPORT = 50
POINTS_PER_POTHOLE = 5
POINTS_PER_RESOLVED = 100

def calculate_level(score: int) -> int:
    """Level = 1 per 500 XP, starting at 1"""
    return max(1, score // 500 + 1)


# Test connection when this file runs directly
if __name__ == "__main__":
    try:
        connection = engine.connect()
        print("✅ Successfully connected to database!")
        connection.close()
    except Exception as e:
        print("❌ Connection failed:", e)