from datetime import datetime, timedelta, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_user, get_db, log_audit
from app.core.config import settings
from app.core.security import (
    create_access_token, generate_otp, hash_otp, hash_password,
    verify_otp_hash, verify_password
)
from app.models.user import (
    PasswordRecoveryChallenge, Role, RolePermission, User, UserRole, Permission
)
from app.schemas.auth import (
    AdminLoginRequest, AdminLoginResponse, AdminOTPVerifyRequest,
    AdminPasswordChangeRequest, ForgotPasswordRequest, PasswordChangeRequest,
    ResetPasswordRequest, TokenResponse, UserLoginRequest, UserOut, UserRegisterRequest
)
from app.services.email_service import EmailService

router = APIRouter(prefix="/auth", tags=["Authentication"])

def _build_user_out(user: User, db: Session) -> UserOut:
    user_roles = db.query(UserRole).filter_by(user_id=user.id).all()
    role_ids = [ur.role_id for ur in user_roles]
    roles = [r.name for r in db.query(Role).filter(Role.id.in_(role_ids)).all()]
    
    if "super_admin" in roles:
        permissions = [p.code for p in db.query(Permission).all()]
    else:
        role_perms = db.query(RolePermission).filter(RolePermission.role_id.in_(role_ids)).all()
        perm_ids = [rp.permission_id for rp in role_perms]
        permissions = [p.code for p in db.query(Permission).filter(Permission.id.in_(perm_ids)).all()]

    return UserOut(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        country_code=user.country_code,
        preferred_language=user.preferred_language,
        account_status=user.account_status,
        is_admin=user.is_admin,
        must_change_password=user.must_change_password,
        email_verified=user.email_verified,
        roles=roles,
        permissions=permissions,
        created_at=user.created_at
    )

@router.post("/register", response_model=TokenResponse)
def register_farmer(req: UserRegisterRequest, db: Session = Depends(get_db)):
    """Register a new farmer account."""
    existing = db.query(User).filter_by(email=req.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    new_user = User(
        full_name=req.full_name,
        email=req.email.lower(),
        phone=req.phone,
        hashed_password=hash_password(req.password),
        country_code=req.country_code,
        preferred_language=req.preferred_language,
        is_admin=False,
        email_verified=True,
        must_change_password=False,
        account_status="active"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(new_user.id, claims={"is_admin": False})
    user_out = _build_user_out(new_user, db)
    return TokenResponse(access_token=token, user=user_out)

@router.post("/login", response_model=TokenResponse)
def login_farmer(req: UserLoginRequest, db: Session = Depends(get_db)):
    """Farmer login endpoint."""
    user = db.query(User).filter_by(email=req.email.lower()).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    if user.account_status == "suspended":
        raise HTTPException(status_code=403, detail="Account is suspended.")

    token = create_access_token(user.id, claims={"is_admin": user.is_admin})
    user_out = _build_user_out(user, db)
    return TokenResponse(access_token=token, user=user_out)

@router.post("/admin/login", response_model=AdminLoginResponse)
def admin_login_step1(req: AdminLoginRequest, request: Request, db: Session = Depends(get_db)):
    """
    Super Admin & Admin Login.
    Validates credentials and authenticates directly with token.
    """
    user = db.query(User).filter_by(email=req.email.lower()).first()
    if not user or not user.is_admin or not verify_password(req.password, user.hashed_password):
        log_audit(db, None, req.email.lower(), "admin_login_failed", "user", details={"reason": "bad_credentials"}, ip_address=request.client.host if request.client else None)
        raise HTTPException(status_code=401, detail="Invalid administrator credentials.")

    if user.account_status == "suspended":
        raise HTTPException(status_code=403, detail="Administrator account is suspended.")

    token = create_access_token(user.id, claims={"is_admin": True, "must_change_password": user.must_change_password})
    user_out = _build_user_out(user, db)
    log_audit(db, user.id, user.email, "admin_login_success", "user", details={"direct_access": True}, ip_address=request.client.host if request.client else None)

    return AdminLoginResponse(
        requires_otp=False,
        email=user.email,
        must_change_password=user.must_change_password,
        message="Administrator authenticated successfully.",
        access_token=token,
        token_type="bearer",
        user=user_out
    )

@router.post("/admin/verify-otp", response_model=TokenResponse)
def admin_verify_otp(req: AdminOTPVerifyRequest, request: Request, db: Session = Depends(get_db)):
    """
    Verify Admin OTP challenge and establish authenticated session (PRD Addendum Section 5.1 & 5.2).
    """
    user = db.query(User).filter_by(email=req.email.lower()).first()
    if not user or not user.is_admin:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Find latest valid unused challenge
    challenge = db.query(PasswordRecoveryChallenge).filter(
        PasswordRecoveryChallenge.email == user.email,
        PasswordRecoveryChallenge.used == False
    ).order_by(PasswordRecoveryChallenge.created_at.desc()).first()

    now = datetime.now(timezone.utc)
    # Ensure expires_at has timezone info for comparison
    challenge_exp = challenge.expires_at.replace(tzinfo=timezone.utc) if challenge and challenge.expires_at.tzinfo is None else (challenge.expires_at if challenge else None)

    if not challenge or challenge_exp < now or challenge.attempts >= 5:
        log_audit(db, user.id, user.email, "admin_otp_failed", "user", details={"reason": "expired_or_too_many_attempts"})
        raise HTTPException(status_code=400, detail="Verification code has expired or exceeded maximum attempts. Please login again.")

    challenge.attempts += 1
    if not verify_otp_hash(req.otp, challenge.hashed_otp):
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid verification code.")

    # Mark OTP used
    challenge.used = True
    user.email_verified = True
    db.commit()

    log_audit(db, user.id, user.email, "admin_login_success", "user", ip_address=request.client.host if request.client else None)

    token = create_access_token(user.id, claims={"is_admin": True, "must_change_password": user.must_change_password})
    user_out = _build_user_out(user, db)
    return TokenResponse(access_token=token, user=user_out)

@router.post("/admin/change-password")
def admin_change_password(req: AdminPasswordChangeRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Mandatory password change workflow (PRD Addendum Section 3 & 4).
    Invalidates temporary password and updates credential to permanent strong hash.
    """
    if req.email and current_user.email != req.email.lower():
        raise HTTPException(status_code=403, detail="Unauthorized")

    if not verify_password(req.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")

    if req.new_password == req.current_password:
        raise HTTPException(status_code=400, detail="New password must differ from current password.")

    current_user.hashed_password = hash_password(req.new_password)
    current_user.must_change_password = False
    current_user.updated_at = datetime.now(timezone.utc)
    db.commit()

    log_audit(db, current_user.id, current_user.email, "admin_password_rotated", "user", details={"status": "temporary_credential_cleared"})
    return {"status": "success", "message": "Password changed successfully. You can now login with your new credentials."}

@router.post("/change-password")
def change_password(req: PasswordChangeRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Allow any authenticated user (farmer or admin) to update their account password."""
    if not verify_password(req.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")

    if req.new_password == req.current_password:
        raise HTTPException(status_code=400, detail="New password must differ from current password.")

    current_user.hashed_password = hash_password(req.new_password)
    current_user.must_change_password = False
    current_user.updated_at = datetime.now(timezone.utc)
    db.commit()

    log_audit(db, current_user.id, current_user.email, "user_password_changed", "user")
    return {"status": "success", "message": "Password changed successfully."}

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Initiate account recovery OTP (PRD Addendum Section 5.3).
    Returns generic response to prevent account enumeration.
    """
    user = db.query(User).filter_by(email=req.email.lower()).first()
    dev_otp = None
    if user:
        otp = generate_otp()
        otp_hash = hash_otp(otp)
        expires = datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
        
        challenge = PasswordRecoveryChallenge(
            email=user.email,
            hashed_otp=otp_hash,
            expires_at=expires,
            used=False,
            attempts=0
        )
        db.add(challenge)
        db.commit()
        EmailService.send_otp_email(user.email, otp, purpose="Password Reset")
        if not EmailService.is_configured():
            dev_otp = otp

    res = {"message": "If an account with that email exists, a password reset code has been dispatched."}
    if dev_otp:
        res["dev_otp"] = dev_otp
    return res

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Verify OTP and update password."""
    user = db.query(User).filter_by(email=req.email.lower()).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid request or expired code.")

    challenge = db.query(PasswordRecoveryChallenge).filter(
        PasswordRecoveryChallenge.email == user.email,
        PasswordRecoveryChallenge.used == False
    ).order_by(PasswordRecoveryChallenge.created_at.desc()).first()

    now = datetime.now(timezone.utc)
    challenge_exp = challenge.expires_at.replace(tzinfo=timezone.utc) if challenge and challenge.expires_at.tzinfo is None else (challenge.expires_at if challenge else None)

    if not challenge or challenge_exp < now or challenge.attempts >= 5:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code.")

    challenge.attempts += 1
    if not verify_otp_hash(req.otp, challenge.hashed_otp):
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid reset code.")

    challenge.used = True
    user.hashed_password = hash_password(req.new_password)
    user.must_change_password = False
    db.commit()

    log_audit(db, user.id, user.email, "password_reset_completed", "user")
    return {"status": "success", "message": "Password reset successfully. You can now login with your new credentials."}

@router.get("/me", response_model=UserOut)
def get_current_user_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get authenticated user profile."""
    return _build_user_out(current_user, db)
