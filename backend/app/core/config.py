import os
from typing import List, Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Farm Intelligence"
    PROJECT_DESCRIPTION: str = "Mobile-first AI Agronomy and Spatial Intelligence Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "farm-intel-secret-key-production-grade-2026-safe-default-replace-in-env")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    OTP_EXPIRE_MINUTES: int = 10
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./farm_intelligence.db")
    
    # Initial Super Admin Bootstrap (PRD Addendum Section 3 & 4)
    INITIAL_SUPER_ADMIN_EMAIL: str = os.getenv("INITIAL_SUPER_ADMIN_EMAIL", "ologunemmanuel2015@gmail.com")
    INITIAL_SUPER_ADMIN_TEMP_PASSWORD: str = os.getenv("INITIAL_SUPER_ADMIN_TEMP_PASSWORD", "123456789")
    INITIAL_SUPER_ADMIN_NAME: str = os.getenv("INITIAL_SUPER_ADMIN_NAME", "Platform Owner")
    INITIAL_SUPER_ADMIN_ENABLED: bool = os.getenv("INITIAL_SUPER_ADMIN_ENABLED", "true").lower() in ("true", "1", "yes")
    
    # Payment Integration: Paystack (PRD Addendum Section 10)
    PAYSTACK_SECRET_KEY: str = os.getenv("PAYSTACK_SECRET_KEY", "")
    PAYSTACK_PUBLIC_KEY: str = os.getenv("PAYSTACK_PUBLIC_KEY", "")
    PAYSTACK_WEBHOOK_SECRET: str = os.getenv("PAYSTACK_WEBHOOK_SECRET", "")
    PAYSTACK_TEST_MODE: bool = os.getenv("PAYSTACK_TEST_MODE", "true").lower() in ("true", "1", "yes")
    
    # Email / SMTP
    SMTP_HOST: str = os.getenv("SMTP_HOST", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "noreply@farmintelligence.africa")
    SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "Farm Intelligence")
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
