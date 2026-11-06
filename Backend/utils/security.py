import hmac
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt
import bcrypt
from config import settings

def hash_password(password: str) -> str:
    """Hash password using bcrypt."""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password using bcrypt."""
    return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())

def create_password_fingerprint(password_hash: str) -> str:
    """
    Create a password fingerprint: first 16 hex chars of
    HMAC-SHA256(JWT_SECRET_KEY, users.password_hash)
    """
    key = settings.JWT_SECRET_KEY.encode()
    msg = password_hash.encode()
    fingerprint = hmac.new(key, msg, hashlib.sha256).hexdigest()
    return fingerprint[:16]

def create_token(subject: str, token_type: str, expires_delta: timedelta, password_hash: str) -> str:
    """
    Create a stateless JWT.
    token_type: 'access', 'refresh', or 'reset'
    """
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
        "pwf": create_password_fingerprint(password_hash)
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def decode_token(token: str) -> Optional[dict]:
    """
    Decode JWT. Only accepts HS256.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise
    except jwt.InvalidTokenError:
        raise
