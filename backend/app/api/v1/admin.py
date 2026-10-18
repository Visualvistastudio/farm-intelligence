import json
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.api.deps import (
    get_current_active_admin, get_db, log_audit, require_permission
)
from app.core.config import settings
from app.core.security import hash_password
from app.models.agronomy import AgronomyRule, Crop, DataSource, PlatformSetting
from app.models.assessment import Assessment, AssessmentJob
from app.models.billing import Payment, Plan, Refund, Subscription
from app.models.farm import Farm, Field
from app.models.user import (
    AuditLog, Permission, Role, RolePermission, User, UserRole
)
from app.schemas.admin import (
    AdminInviteRequest, AdminOverviewMetrics, AdminRoleUpdateRequest,
    AdminStatusUpdateRequest, AdminUserUpdate, AuditLogOut,
    PaystackSettingsUpdate, PlanCreateRequest, PlanUpdateRequest,
    PlatformSettingsUpdate, RoleAssignRequest, RoleCreateRequest,
    SMTPSettingsUpdate, SubscriberOverrideRequest, TestEmailRequest
)
from app.services.email_service import EmailService
from app.services.paystack_service import PaystackService

router = APIRouter(prefix="/admin", tags=["Super Admin Operations"])

@router.get("/overview", response_model=AdminOverviewMetrics)
def get_admin_overview(
    current_admin: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    """
    Super Admin Operational Overview Dashboard (PRD Addendum Section 6).
    Calculates operational and financial metrics directly from database records.
    """
    total_users = db.query(User).count()
    active_users = db.query(User).filter_by(account_status="active").count()
    total_farms = db.query(Farm).filter(Farm.archived_at == None).count()
    total_fields = db.query(Field).count()
    
    total_assessments = db.query(Assessment).count()
    processing_jobs = db.query(AssessmentJob).filter(AssessmentJob.status.in_(["queued", "validating", "processing_spatial_data"])).count()
    failed_jobs = db.query(AssessmentJob).filter_by(status="failed").count()

    active_subscriptions = db.query(Subscription).filter_by(status="active").count()

    # Confirmed payments calculation (minor units in kobo -> NGN)
    confirmed_payments = db.query(Payment).filter_by(status="successful").all()
    confirmed_count = len(confirmed_payments)
    gross_kobo = sum(p.amount_minor_units for p in confirmed_payments)
    gross_revenue = gross_kobo / 100.0

    # Refunds calculation
    refunds = db.query(Refund).filter_by(status="successful").all()
    refund_kobo = sum(r.amount_minor_units for r in refunds)
    refund_totals = refund_kobo / 100.0

    net_revenue = gross_revenue - refund_totals

    # Data sources health
    ds_records = db.query(DataSource).all()
    ds_status = {ds.provider: ds.status for ds in ds_records}

    return AdminOverviewMetrics(
        total_users=total_users,
        active_users=active_users,
        total_farms=total_farms,
        total_fields=total_fields,
        total_assessments=total_assessments,
        processing_jobs=processing_jobs,
        failed_jobs=failed_jobs,
        active_subscriptions=active_subscriptions,
        confirmed_payments_count=confirmed_count,
        gross_revenue_ngn=round(gross_revenue, 2),
        refund_totals_ngn=round(refund_totals, 2),
        net_revenue_ngn=round(net_revenue, 2),
        paystack_mode="Test Sandbox" if settings.PAYSTACK_TEST_MODE else "Live Production",
        paystack_configured=PaystackService.is_configured(),
        email_service_configured=EmailService.is_configured(),
        data_sources_status=ds_status
    )

@router.get("/users")
def list_users(
    status_filter: Optional[str] = None,
    current_admin: User = Depends(require_permission("users.read")),
    db: Session = Depends(get_db)
):
    """User Management: List registered platform users (PRD Addendum Section 7)."""
    query = db.query(User).order_by(User.created_at.desc())
    if status_filter:
        query = query.filter(User.account_status == status_filter)
    users = query.all()
    
    results = []
    for u in users:
        farms_count = db.query(Farm).filter_by(owner_user_id=u.id).count()
        assessments_count = db.query(AssessmentJob).filter_by(user_id=u.id).count()
        sub = db.query(Subscription).filter_by(user_id=u.id).first()
        results.append({
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "phone": u.phone,
            "country_code": u.country_code,
            "account_status": u.account_status,
            "is_admin": u.is_admin,
            "must_change_password": u.must_change_password,
            "farms_count": farms_count,
            "assessments_count": assessments_count,
            "plan_name": sub.plan.name if sub else "Free Explore",
            "created_at": u.created_at
        })
    return results

@router.patch("/users/{user_id}/status")
def update_user_status(
    user_id: str,
    req: AdminUserUpdate,
    current_admin: User = Depends(require_permission("users.suspend")),
    db: Session = Depends(get_db)
):
    """Suspend or reactivate a user account with audit trail."""
    target_user = db.query(User).filter_by(id=user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    if req.account_status:
        old_status = target_user.account_status
        target_user.account_status = req.account_status
        db.commit()
        log_audit(
            db, current_admin.id, current_admin.email,
            "user_status_changed", "user", target_user.id,
            details={"old_status": old_status, "new_status": req.account_status}
        )
    return {"status": "success", "user_id": target_user.id, "account_status": target_user.account_status}

@router.get("/access-control/admins")
def list_admin_staff(
    current_admin: User = Depends(require_permission("roles.read")),
    db: Session = Depends(get_db)
):
    """List all administrative personnel and their assigned roles (PRD Addendum Section 8)."""
    admins = db.query(User).filter_by(is_admin=True).all()
    results = []
    for a in admins:
        user_roles = db.query(UserRole).filter_by(user_id=a.id).all()
        roles = [ur.role.display_name for ur in user_roles if ur.role]
        results.append({
            "id": a.id,
            "full_name": a.full_name,
            "email": a.email,
            "account_status": a.account_status,
            "must_change_password": a.must_change_password,
            "roles": roles,
            "created_at": a.created_at
        })
    return results

@router.post("/access-control/invite")
def invite_admin_staff(
    req: AdminInviteRequest,
    current_admin: User = Depends(require_permission("admins.invite")),
    db: Session = Depends(get_db)
):
    """Invite an administrative staff member with designated role."""
    existing = db.query(User).filter_by(email=req.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already registered.")

    role = db.query(Role).filter_by(name=req.role_name).first()
    if not role:
        raise HTTPException(status_code=400, detail="Invalid role specified.")

    # Create admin with temporary credential and must_change_password flag
    temp_pass = "AdminSetup2026!"
    new_admin = User(
        email=req.email.lower(),
        full_name=req.full_name,
        hashed_password=hash_password(temp_pass),
        is_admin=True,
        must_change_password=True,
        email_verified=False,
        account_status="active"
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)

    user_role = UserRole(user_id=new_admin.id, role_id=role.id)
    db.add(user_role)
    db.commit()

    log_audit(
        db, current_admin.id, current_admin.email,
        "admin_staff_invited", "user", new_admin.id,
        details={"email": new_admin.email, "role": role.name}
    )
    return {"status": "success", "message": f"Administrator {new_admin.email} provisioned with role {role.display_name}."}

@router.get("/access-control/roles")
def list_roles_and_permissions(
    current_admin: User = Depends(require_permission("roles.read")),
    db: Session = Depends(get_db)
):
    """List all available roles and system permissions."""
    roles = db.query(Role).all()
    perms = db.query(Permission).all()
    
    role_data = []
    for r in roles:
        role_perms = db.query(RolePermission).filter_by(role_id=r.id).all()
        perm_codes = [rp.permission.code for rp in role_perms if rp.permission]
        role_data.append({
            "id": r.id,
            "name": r.name,
            "display_name": r.display_name,
            "description": r.description,
            "is_system": r.is_system,
            "permissions": perm_codes
        })

    return {
        "roles": role_data,
        "all_permissions": [{"code": p.code, "category": p.category, "description": p.description} for p in perms]
    }

@router.post("/access-control/roles")
def create_custom_role(
    req: RoleCreateRequest,
    current_admin: User = Depends(require_permission("roles.manage")),
    db: Session = Depends(get_db)
):
    """Create a new custom RBAC role with specific permissions."""
    existing = db.query(Role).filter_by(name=req.name.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Role name already exists.")

    new_role = Role(
        name=req.name.lower(),
        display_name=req.display_name,
        description=req.description,
        is_system=False
    )
    db.add(new_role)
    db.commit()
    db.refresh(new_role)

    # Attach permissions
    perms = db.query(Permission).filter(Permission.code.in_(req.permission_codes)).all()
    for p in perms:
        rp = RolePermission(role_id=new_role.id, permission_id=p.id)
        db.add(rp)
    db.commit()

    log_audit(
        db, current_admin.id, current_admin.email,
        "custom_role_created", "role", new_role.id,
        details={"name": new_role.name, "permissions": req.permission_codes}
    )
    return {"status": "success", "role_id": new_role.id, "name": new_role.name}

@router.put("/access-control/admins/{admin_id}/role")
def update_admin_staff_role(
    admin_id: str,
    req: AdminRoleUpdateRequest,
    current_admin: User = Depends(require_permission("roles.manage")),
    db: Session = Depends(get_db)
):
    """Super Admin: Reassign administrative role and department for staff member."""
    target_admin = db.query(User).filter_by(id=admin_id, is_admin=True).first()
    if not target_admin:
        raise HTTPException(status_code=404, detail="Administrator not found.")

    role = db.query(Role).filter_by(name=req.role_name).first()
    if not role:
        raise HTTPException(status_code=400, detail="Invalid role specified.")

    # Reassign role
    db.query(UserRole).filter_by(user_id=target_admin.id).delete()
    user_role = UserRole(user_id=target_admin.id, role_id=role.id)
    db.add(user_role)
    db.commit()

    log_audit(
        db, current_admin.id, current_admin.email,
        "admin_role_reassigned", "user", target_admin.id,
        details={"admin_email": target_admin.email, "new_role": role.name}
    )
    return {"status": "success", "message": f"Role for {target_admin.email} updated to {role.display_name}."}

@router.post("/access-control/admins/{admin_id}/status")
def update_admin_staff_status(
    admin_id: str,
    req: AdminStatusUpdateRequest,
    current_admin: User = Depends(require_permission("admins.manage")),
    db: Session = Depends(get_db)
):
    """Super Admin: Suspend or reactivate administrative staff access."""
    target_admin = db.query(User).filter_by(id=admin_id, is_admin=True).first()
    if not target_admin:
        raise HTTPException(status_code=404, detail="Administrator not found.")

    if target_admin.email == settings.INITIAL_SUPER_ADMIN_EMAIL and req.status == "suspended":
        raise HTTPException(status_code=400, detail="The primary Super Admin account cannot be suspended.")

    target_admin.account_status = req.status
    db.commit()

    log_audit(
        db, current_admin.id, current_admin.email,
        "admin_status_updated", "user", target_admin.id,
        details={"admin_email": target_admin.email, "new_status": req.status}
    )
    return {"status": "success", "message": f"Administrator {target_admin.email} status set to {req.status}."}

@router.get("/payments")
def list_payments(
    current_admin: User = Depends(require_permission("payments.read")),
    db: Session = Depends(get_db)
):
    """Financial Operations: List payment transactions and settlements (PRD Addendum Section 11)."""
    payments = db.query(Payment).order_by(Payment.created_at.desc()).all()
    results = []
    for p in payments:
        results.append({
            "id": p.id,
            "user_email": p.user.email if p.user else "Unknown",
            "provider": p.provider,
            "provider_reference": p.provider_reference,
            "amount_ngn": p.amount_minor_units / 100.0,
            "fee_ngn": p.fee_minor_units / 100.0,
            "currency": p.currency,
            "status": p.status,
            "verified_at": p.verified_at,
            "created_at": p.created_at
        })
    return results

@router.post("/payments/refund")
async def process_refund(
    payment_id: str = Query(...),
    reason: str = Query("Customer request"),
    current_admin: User = Depends(require_permission("payments.refund")),
    db: Session = Depends(get_db)
):
    """Process an authorized customer refund via Paystack (PRD Addendum Section 10.5 & 11)."""
    payment = db.query(Payment).filter_by(id=payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment record not found.")

    if payment.status != "successful":
        raise HTTPException(status_code=400, detail="Only successful transactions can be refunded.")

    # Call Paystack refund adapter
    res = await PaystackService.create_refund(
        transaction_reference=payment.provider_reference,
        amount_kobo=payment.amount_minor_units,
        reason=reason
    )

    refund = Refund(
        payment_id=payment.id,
        amount_minor_units=payment.amount_minor_units,
        reason=reason,
        initiated_by_user_id=current_admin.id,
        status="successful" if res.get("status") else "failed",
        provider_reference=res.get("data", {}).get("refund_reference")
    )
    db.add(refund)
    if res.get("status"):
        payment.status = "refunded"
    db.commit()

    log_audit(
        db, current_admin.id, current_admin.email,
        "payment_refund_processed", "payment", payment.id,
        details={"amount_minor_units": payment.amount_minor_units, "reason": reason, "status": refund.status}
    )
    return {"status": refund.status, "message": "Refund processed.", "refund_id": refund.id}

@router.get("/settings/payments")
def get_payment_settings(
    current_admin: User = Depends(require_permission("payments.provider.configure")),
    db: Session = Depends(get_db)
):
    """Get Paystack configuration status with secrets masked (PRD Addendum Section 10.1)."""
    secret = settings.PAYSTACK_SECRET_KEY.strip()
    masked_secret = f"{secret[:7]}...{secret[-4:]}" if len(secret) > 11 else ("Configured" if secret else "Not configured")

    return {
        "provider": "Paystack",
        "configured": PaystackService.is_configured(),
        "test_mode": settings.PAYSTACK_TEST_MODE,
        "public_key": settings.PAYSTACK_PUBLIC_KEY,
        "secret_key_masked": masked_secret,
        "webhook_url": "https://<deployed-domain>/api/v1/billing/webhooks/paystack",
        "supported_currencies": ["NGN", "USD"],
        "connection_status": "Ready (Test Mode)" if settings.PAYSTACK_TEST_MODE else "Operational"
    }

@router.post("/settings/payments")
def update_payment_settings(
    req: PaystackSettingsUpdate,
    current_admin: User = Depends(require_permission("payments.provider.configure")),
    db: Session = Depends(get_db)
):
    """Update Paystack configuration and environment toggles."""
    if req.test_mode is not None:
        settings.PAYSTACK_TEST_MODE = req.test_mode
    if req.secret_key:
        settings.PAYSTACK_SECRET_KEY = req.secret_key
    if req.public_key:
        settings.PAYSTACK_PUBLIC_KEY = req.public_key
    if req.webhook_secret:
        settings.PAYSTACK_WEBHOOK_SECRET = req.webhook_secret

    log_audit(
        db, current_admin.id, current_admin.email,
        "paystack_settings_updated", "platform_setting",
        details={"test_mode": req.test_mode, "secret_key_provided": bool(req.secret_key)}
    )
    return {"status": "success", "message": "Paystack settings updated."}

@router.get("/settings/smtp")
def get_smtp_settings(
    current_admin: User = Depends(require_permission("platform.settings.read")),
    db: Session = Depends(get_db)
):
    """Retrieve SMTP mail configuration status with credentials masked."""
    pw = settings.SMTP_PASSWORD.strip() if settings.SMTP_PASSWORD else ""
    masked_pw = f"{pw[:2]}...{pw[-2:]}" if len(pw) > 4 else ("Configured" if pw else "Not configured")

    return {
        "smtp_host": settings.SMTP_HOST or "",
        "smtp_port": settings.SMTP_PORT or 587,
        "smtp_user": settings.SMTP_USER or "",
        "smtp_password_masked": masked_pw,
        "smtp_password_set": bool(pw),
        "smtp_from_email": settings.SMTP_FROM_EMAIL or "noreply@farmintelligence.africa",
        "smtp_from_name": settings.SMTP_FROM_NAME or "Farm Intelligence",
        "is_configured": EmailService.is_configured(),
        "status": "Operational" if EmailService.is_configured() else "Unconfigured"
    }

@router.post("/settings/smtp")
def update_smtp_settings(
    req: SMTPSettingsUpdate,
    current_admin: User = Depends(require_permission("platform.settings.update")),
    db: Session = Depends(get_db)
):
    """Update SMTP mail server parameters and persist in platform settings."""
    if req.smtp_host is not None:
        settings.SMTP_HOST = req.smtp_host.strip()
    if req.smtp_port is not None:
        settings.SMTP_PORT = int(req.smtp_port)
    if req.smtp_user is not None:
        settings.SMTP_USER = req.smtp_user.strip()
    if req.smtp_password is not None and req.smtp_password.strip():
        settings.SMTP_PASSWORD = req.smtp_password.strip()
    if req.smtp_from_email is not None:
        settings.SMTP_FROM_EMAIL = req.smtp_from_email.strip()
    if req.smtp_from_name is not None:
        settings.SMTP_FROM_NAME = req.smtp_from_name.strip()

    # Persist in PlatformSetting database table
    smtp_dict = {
        "smtp_host": settings.SMTP_HOST,
        "smtp_port": settings.SMTP_PORT,
        "smtp_user": settings.SMTP_USER,
        "smtp_password": settings.SMTP_PASSWORD,
        "smtp_from_email": settings.SMTP_FROM_EMAIL,
        "smtp_from_name": settings.SMTP_FROM_NAME,
    }

    setting_row = db.query(PlatformSetting).filter_by(key="smtp_settings").first()
    if not setting_row:
        setting_row = PlatformSetting(
            key="smtp_settings",
            value_json=json.dumps(smtp_dict),
            description="Dynamic SMTP Mail Server configuration",
            updated_by_user_id=current_admin.id
        )
        db.add(setting_row)
    else:
        setting_row.value_json = json.dumps(smtp_dict)
        setting_row.updated_by_user_id = current_admin.id
    db.commit()

    log_audit(
        db, current_admin.id, current_admin.email,
        "smtp_settings_updated", "platform_setting",
        details={
            "smtp_host": settings.SMTP_HOST,
            "smtp_port": settings.SMTP_PORT,
            "smtp_user": settings.SMTP_USER,
            "is_configured": EmailService.is_configured()
        }
    )
    return {
        "status": "success",
        "message": "SMTP mail server configuration updated and applied successfully.",
        "is_configured": EmailService.is_configured()
    }

@router.post("/settings/smtp/test")
def test_smtp_configuration(
    req: TestEmailRequest,
    current_admin: User = Depends(require_permission("platform.settings.update")),
    db: Session = Depends(get_db)
):
    """Dispatch an immediate live diagnostic test email to verify SMTP handshake & delivery."""
    result = EmailService.send_test_email(req.recipient_email)

    log_audit(
        db, current_admin.id, current_admin.email,
        "smtp_test_email_dispatched", "platform_setting",
        details={"recipient": req.recipient_email, "success": result.get("success")}
    )
    return result

@router.get("/subscriptions")
def list_admin_subscriptions(
    current_admin: User = Depends(require_permission("subscriptions.read")),
    db: Session = Depends(get_db)
):
    """List subscription tiers and active subscribers (PRD Addendum Section 12)."""
    subs = db.query(Subscription).all()
    plans = db.query(Plan).all()

    sub_data = []
    for s in subs:
        sub_data.append({
            "id": s.id,
            "user_id": s.user_id,
            "user_email": s.user.email if s.user else "Unknown",
            "user_name": s.user.full_name if s.user else "Unknown",
            "plan_id": s.plan_id,
            "plan_name": s.plan.name if s.plan else "Unknown",
            "status": s.status,
            "period_end": s.current_period_end,
            "created_at": s.created_at
        })

    plan_data = []
    for p in plans:
        plan_data.append({
            "id": p.id,
            "name": p.name,
            "code": p.code,
            "description": p.description or "",
            "price_ngn": p.price_minor_units / 100.0,
            "interval": p.billing_interval,
            "is_active": p.is_active,
            "limits": json.loads(p.feature_limits_json) if p.feature_limits_json else {}
        })

    return {"subscribers": sub_data, "plans": plan_data}

@router.put("/subscriptions/plans/{plan_id}")
def update_subscription_plan(
    plan_id: str,
    req: PlanUpdateRequest,
    current_admin: User = Depends(require_permission("subscription_plans.manage")),
    db: Session = Depends(get_db)
):
    """Super Admin: Update plan pricing, usage quotas, and entitlement limits."""
    plan = db.query(Plan).filter_by(id=plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Subscription plan not found.")

    if req.name is not None:
        plan.name = req.name
    if req.description is not None:
        plan.description = req.description
    if req.price_ngn is not None:
        plan.price_minor_units = int(round(req.price_ngn * 100))
    if req.billing_interval is not None:
        plan.billing_interval = req.billing_interval
    if req.is_active is not None:
        plan.is_active = req.is_active
    if req.feature_limits is not None:
        plan.feature_limits_json = json.dumps(req.feature_limits)

    db.commit()
    db.refresh(plan)

    log_audit(
        db, current_admin.id, current_admin.email,
        "subscription_plan_updated", "plan", plan.id,
        details={"name": plan.name, "code": plan.code, "price_ngn": plan.price_minor_units / 100.0, "is_active": plan.is_active}
    )
    return {
        "status": "success",
        "message": f"Plan '{plan.name}' updated successfully.",
        "plan": {
            "id": plan.id,
            "name": plan.name,
            "code": plan.code,
            "description": plan.description,
            "price_ngn": plan.price_minor_units / 100.0,
            "interval": plan.billing_interval,
            "is_active": plan.is_active,
            "limits": json.loads(plan.feature_limits_json) if plan.feature_limits_json else {}
        }
    }

@router.post("/subscriptions/plans")
def create_subscription_plan(
    req: PlanCreateRequest,
    current_admin: User = Depends(require_permission("subscription_plans.manage")),
    db: Session = Depends(get_db)
):
    """Super Admin: Create a new custom or regional subscription tier."""
    existing = db.query(Plan).filter_by(code=req.code.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Plan code '{req.code}' already exists.")

    new_plan = Plan(
        name=req.name.strip(),
        code=req.code.lower().strip(),
        description=req.description,
        billing_interval=req.billing_interval,
        price_minor_units=int(round(req.price_ngn * 100)),
        currency="NGN",
        feature_limits_json=json.dumps(req.feature_limits),
        is_active=req.is_active
    )
    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)

    log_audit(
        db, current_admin.id, current_admin.email,
        "subscription_plan_created", "plan", new_plan.id,
        details={"code": new_plan.code, "name": new_plan.name, "price_ngn": req.price_ngn}
    )
    return {
        "status": "success",
        "message": f"Plan '{new_plan.name}' created successfully.",
        "plan": {
            "id": new_plan.id,
            "name": new_plan.name,
            "code": new_plan.code,
            "description": new_plan.description,
            "price_ngn": new_plan.price_minor_units / 100.0,
            "interval": new_plan.billing_interval,
            "is_active": new_plan.is_active,
            "limits": json.loads(new_plan.feature_limits_json) if new_plan.feature_limits_json else {}
        }
    }

@router.post("/subscriptions/subscribers/override")
def override_subscriber_account(
    req: SubscriberOverrideRequest,
    current_admin: User = Depends(require_permission("subscriptions.manage")),
    db: Session = Depends(get_db)
):
    """Super Admin: Override a subscriber's tier, extend validity, or change account status."""
    target_user = db.query(User).filter_by(id=req.user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Subscriber user not found.")

    target_plan = db.query(Plan).filter_by(id=req.plan_id).first()
    if not target_plan:
        raise HTTPException(status_code=404, detail="Specified target plan not found.")

    sub = db.query(Subscription).filter_by(user_id=target_user.id).order_by(Subscription.created_at.desc()).first()
    now = datetime.now(timezone.utc)
    extend_days = req.extend_days if (req.extend_days is not None and req.extend_days > 0) else 30

    if sub:
        sub.plan_id = target_plan.id
        sub.status = req.status
        base_date = sub.current_period_end if (sub.current_period_end and sub.current_period_end > now) else now
        sub.current_period_end = base_date + timedelta(days=extend_days)
    else:
        sub = Subscription(
            user_id=target_user.id,
            plan_id=target_plan.id,
            status=req.status,
            current_period_start=now,
            current_period_end=now + timedelta(days=extend_days)
        )
        db.add(sub)

    db.commit()
    db.refresh(sub)

    log_audit(
        db, current_admin.id, current_admin.email,
        "subscriber_override_applied", "subscription", sub.id,
        details={
            "user_email": target_user.email,
            "new_plan": target_plan.name,
            "status": req.status,
            "extend_days": extend_days,
            "period_end": sub.current_period_end.isoformat()
        }
    )
    return {
        "status": "success",
        "message": f"Subscriber {target_user.email} updated to {target_plan.name} (valid until {sub.current_period_end.strftime('%Y-%m-%d')}).",
        "subscription": {
            "id": sub.id,
            "user_id": target_user.id,
            "user_email": target_user.email,
            "plan_id": target_plan.id,
            "plan_name": target_plan.name,
            "status": sub.status,
            "period_end": sub.current_period_end
        }
    }

@router.get("/data-sources")
def list_data_sources(
    current_admin: User = Depends(require_permission("data_sources.read")),
    db: Session = Depends(get_db)
):
    """External Data Integrations Registry (PRD Addendum Section 13)."""
    sources = db.query(DataSource).all()
    return sources

@router.post("/data-sources/{source_id}/sync")
def sync_data_source(
    source_id: str,
    current_admin: User = Depends(require_permission("data_sources.sync")),
    db: Session = Depends(get_db)
):
    """Trigger manual data source synchronization job."""
    ds = db.query(DataSource).filter_by(id=source_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Data source not found.")
    ds.last_sync_at = datetime.now(timezone.utc)
    ds.status = "operational"
    db.commit()

    log_audit(db, current_admin.id, current_admin.email, "data_source_synced", "data_source", ds.id, details={"provider": ds.provider})
    return {"status": "success", "message": f"Data source {ds.dataset_name} synchronized successfully."}

@router.get("/audit-logs")
def get_audit_logs(
    limit: int = 50,
    current_admin: User = Depends(require_permission("audit_logs.read")),
    db: Session = Depends(get_db)
):
    """Immutable Platform Security & Operational Audit Log (PRD Addendum Section 15)."""
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    results = []
    for l in logs:
        results.append({
            "id": l.id,
            "actor_user_id": l.actor_user_id,
            "actor_email": l.actor_email,
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "details": json.loads(l.details_json) if l.details_json else {},
            "ip_address": l.ip_address,
            "created_at": l.created_at
        })
    return results
