"""
🔐 AUTH MODULE — JWT Token Management for PotholeAI
"""
from datetime import datetime, timedelta
from typing import Optional
import os
from dotenv import load_dotenv
import jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
load_dotenv()

# ============================================================
# 🔑 CONFIG
# ============================================================
SECRET_KEY = os.getenv("SECRET_KEY", "")
if not SECRET_KEY:
    raise RuntimeError(
        "SECRET_KEY environment variable is not set. "
        "Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\""
    )
if len(SECRET_KEY) < 32:
    raise RuntimeError(
        "SECRET_KEY is too short (minimum 32 characters). "
        "Generate a secure key with: python -c \"import secrets; print(secrets.token_hex(32))\""
    )

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days persistent session

bearer_scheme = HTTPBearer(auto_error=False)


# ============================================================
# 🔒 PASSWORD HASHING (Native bcrypt — no passlib wrap-bug)
# ============================================================
def hash_password(password: str) -> str:
    pwd_bytes = password.encode("utf-8")[:72]
    return bcrypt.hashpw(pwd_bytes, bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8")[:72], hashed.encode("utf-8"))
    except Exception:
        return False



# ============================================================
# 🎟 JWT TOKEN
# ============================================================
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


# ============================================================
# 🛡️ DEPENDENCY — Get current user from Bearer token
# ============================================================
def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme)):
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please login.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token. Please login again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # Verify required claims are present
    if not payload.get("sub") or not payload.get("role"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token. Please login again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme)):
    """Same as above but doesn't raise if no token — returns None"""
    if not credentials:
        return None
    return decode_token(credentials.credentials)


def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required for this action.",
        )
    return current_user
