import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Optional, Union
import jwt
from app.core.config import settings

def hash_password(password: str) -> str:
    """
    Hash a password using PBKDF2-HMAC-SHA256 with a cryptographically secure random salt.
    Format: pbkdf2_sha256$iterations$salt$hash
    """
    iterations = 100000
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        iterations
    )
    return f"pbkdf2_sha256${iterations}${salt}${key.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against the stored PBKDF2 hash."""
    if not hashed_password or not plain_password:
        return False
    try:
        parts = hashed_password.split('$')
        if len(parts) != 4 or parts[0] != "pbkdf2_sha256":
            return False
        iterations = int(parts[1])
        salt = parts[2]
        expected_key_hex = parts[3]
        
        computed_key = hashlib.pbkdf2_hmac(
            'sha256',
            plain_password.encode('utf-8'),
            salt.encode('utf-8'),
            iterations
        )
        return hmac.compare_digest(computed_key.hex(), expected_key_hex)
    except Exception:
        return False

def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None, claims: Optional[dict] = None) -> str:
    """Generate a signed JWT token with standard expiration and custom claims."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    if claims:
        to_encode.update(claims)
    
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    """Decode and validate a JWT access token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except (jwt.PyJWTError, Exception):
        return None

def generate_otp() -> str:
    """Generate a 6-digit numeric OTP using cryptographically secure random generator."""
    return f"{secrets.SystemRandom().randint(100000, 999999)}"

def hash_otp(otp: str) -> str:
    """Hash an OTP for secure storage so plain text is never stored in DB."""
    return hashlib.sha256(otp.encode('utf-8')).hexdigest()

def verify_otp_hash(plain_otp: str, hashed_otp: str) -> bool:
    """Verify plain OTP against stored hash."""
    return hmac.compare_digest(hash_otp(plain_otp), hashed_otp)
