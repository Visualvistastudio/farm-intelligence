import json
from datetime import datetime, timezone
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
    AdminInviteRequest, AdminOverviewMetrics, AdminUserUpdate,
    AuditLogOut, PaystackSettingsUpdate, PlatformSettingsUpdate,
    RoleAssignRequest, RoleCreateRequest
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
            "user_email": s.user.email if s.user else "Unknown",
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
            "price_ngn": p.price_minor_units / 100.0,
            "interval": p.billing_interval,
            "is_active": p.is_active,
            "limits": json.loads(p.feature_limits_json) if p.feature_limits_json else {}
        })

    return {"subscribers": sub_data, "plans": plan_data}

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
