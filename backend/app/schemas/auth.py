from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field

class UserRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=8)
    phone: Optional[str] = None
    country_code: str = "NG"
    preferred_language: str = "en"

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"

class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str

class AdminLoginResponse(BaseModel):
    requires_otp: bool = False
    email: str
    message: str
    # If temporary password must be changed:
    must_change_password: bool = False
    access_token: Optional[str] = None
    token_type: Optional[str] = "bearer"
    user: Optional["UserOut"] = None
    temp_session_token: Optional[str] = None

class AdminOTPVerifyRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)
    temp_session_token: Optional[str] = None

class AdminPasswordChangeRequest(BaseModel):
    email: EmailStr
    current_password: str
    new_password: str = Field(..., min_length=8)

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=8)

class UserOut(BaseModel):
    id: str
    full_name: str
    email: str
    phone: Optional[str] = None
    country_code: str
    preferred_language: str
    account_status: str
    is_admin: bool
    must_change_password: bool
    email_verified: bool
    roles: List[str] = []
    permissions: List[str] = []
    created_at: datetime

    class Config:
        from_attributes = True

TokenResponse.model_rebuild()
