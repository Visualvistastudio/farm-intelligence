import json
import logging
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_user, get_db, log_audit
from app.core.config import settings
from app.models.billing import Payment, Plan, Subscription, WebhookEvent
from app.models.user import User
from app.schemas.billing import (
    InitializePaymentRequest, PaymentOut, PlanOut, VerifyPaymentRequest
)
from app.services.paystack_service import PaystackService

logger = logging.getLogger("farm_intelligence.billing")
router = APIRouter(prefix="/billing", tags=["Billing & Subscriptions"])

def _format_naira(minor_units: int) -> str:
    naira = minor_units / 100.0
    return f"₦{naira:,.2f}"

@router.get("/plans", response_model=List[PlanOut])
def list_plans(db: Session = Depends(get_db)):
    """List all available subscription plans."""
    plans = db.query(Plan).filter_by(is_active=True).order_by(Plan.price_minor_units.asc()).all()
    results = []
    for p in plans:
        limits = json.loads(p.feature_limits_json) if p.feature_limits_json else {}
        results.append(
            PlanOut(
                id=p.id,
                name=p.name,
                code=p.code,
                description=p.description,
                billing_interval=p.billing_interval,
                price_minor_units=p.price_minor_units,
                currency=p.currency,
                price_formatted=_format_naira(p.price_minor_units),
                feature_limits=limits,
                is_active=p.is_active
            )
        )
    return results

@router.post("/initialize")
async def initialize_payment(req: InitializePaymentRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Initialize payment with Paystack for subscription plan upgrade (PRD Addendum Section 10.2).
    """
    plan = db.query(Plan).filter_by(id=req.plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Subscription plan not found.")

    if plan.price_minor_units == 0:
        # Free plan - activate immediately
        sub = db.query(Subscription).filter_by(user_id=current_user.id).first()
        if not sub:
            sub = Subscription(
                user_id=current_user.id,
                plan_id=plan.id,
                status="active",
                current_period_start=datetime.now(timezone.utc),
                current_period_end=datetime.now(timezone.utc) + timedelta(days=365)
            )
            db.add(sub)
        else:
            sub.plan_id = plan.id
            sub.status = "active"
        db.commit()
        return {"status": "success", "message": "Free plan activated", "free": True}

    # Generate unique transaction reference
    ref = f"fi_pay_{current_user.id[:8]}_{int(datetime.now(timezone.utc).timestamp())}"
    
    # Create pending payment record
    payment = Payment(
        user_id=current_user.id,
        provider="paystack",
        provider_reference=ref,
        amount_minor_units=plan.price_minor_units,
        currency="NGN",
        status="initiated"
    )
    db.add(payment)
    db.commit()

    # Call Paystack initialize
    res = await PaystackService.initialize_transaction(
        email=current_user.email,
        amount_kobo=plan.price_minor_units,
        reference=ref,
        callback_url=req.callback_url or "http://localhost:3000/app/settings/billing",
        metadata={"plan_id": plan.id, "user_id": current_user.id, "plan_name": plan.name}
    )

    if not res.get("status"):
        payment.status = "failed"
        db.commit()
        raise HTTPException(status_code=400, detail=res.get("message", "Payment initialization failed."))

    return res

@router.post("/verify")
async def verify_payment(req: VerifyPaymentRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Verify payment status with Paystack and activate subscription entitlements (PRD Addendum Section 10.2).
    Never rely on client-side status.
    """
    payment = db.query(Payment).filter_by(provider_reference=req.reference).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment record not found.")

    verify_res = await PaystackService.verify_transaction(req.reference)
    data = verify_res.get("data", {})
    paystack_status = data.get("status")

    if paystack_status == "success":
        payment.status = "successful"
        payment.verified_at = datetime.now(timezone.utc)
        payment.fee_minor_units = data.get("fees", 0)
        payment.provider_metadata_json = json.dumps(data)

        # Retrieve plan from metadata or default to Farmer Plus
        plan = db.query(Plan).filter_by(price_minor_units=payment.amount_minor_units).first()
        if not plan:
            plan = db.query(Plan).filter_by(code="farmer_plus").first()

        # Activate or update subscription
        sub = db.query(Subscription).filter_by(user_id=current_user.id).first()
        if not sub:
            sub = Subscription(
                user_id=current_user.id,
                plan_id=plan.id,
                status="active",
                current_period_start=datetime.now(timezone.utc),
                current_period_end=datetime.now(timezone.utc) + timedelta(days=30)
            )
            db.add(sub)
        else:
            sub.plan_id = plan.id
            sub.status = "active"
            sub.current_period_start = datetime.now(timezone.utc)
            sub.current_period_end = datetime.now(timezone.utc) + timedelta(days=30)

        db.commit()
        log_audit(db, current_user.id, current_user.email, "payment_successful", "payment", payment.id, details={"reference": req.reference, "plan": plan.name})

        return {
            "status": "success",
            "message": "Payment verified and subscription activated.",
            "plan_name": plan.name,
            "current_period_end": sub.current_period_end
        }
    else:
        payment.status = "failed"
        db.commit()
        raise HTTPException(status_code=400, detail="Payment was not successful.")

@router.get("/subscription")
def get_user_subscription(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get current user's subscription and active limits."""
    sub = db.query(Subscription).filter_by(user_id=current_user.id).first()
    if not sub:
        free_plan = db.query(Plan).filter_by(code="free").first()
        return {
            "plan_name": free_plan.name if free_plan else "Free Explore",
            "plan_code": "free",
            "status": "active",
            "price_formatted": "₦0.00/month",
            "current_period_end": None,
            "feature_limits": json.loads(free_plan.feature_limits_json) if free_plan else {"max_farms": 1, "max_assessments_per_month": 3}
        }

    plan = sub.plan
    return {
        "id": sub.id,
        "plan_name": plan.name,
        "plan_code": plan.code,
        "status": sub.status,
        "price_formatted": _format_naira(plan.price_minor_units) + f"/{plan.billing_interval}",
        "current_period_start": sub.current_period_start,
        "current_period_end": sub.current_period_end,
        "feature_limits": json.loads(plan.feature_limits_json) if plan.feature_limits_json else {}
    }

@router.post("/webhooks/paystack")
async def paystack_webhook(request: Request, x_paystack_signature: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """
    Paystack Webhook Handler (PRD Addendum Section 10.3).
    Validates HMAC-SHA512 signature and processes events idempotently.
    """
    raw_body = await request.body()
    
    # Verify HMAC signature if secret key configured
    if PaystackService.is_configured():
        if not PaystackService.verify_webhook_signature(raw_body, x_paystack_signature):
            logger.warning("Paystack webhook HMAC signature verification failed.")
            raise HTTPException(status_code=400, detail="Invalid webhook signature")

    try:
        event_payload = json.loads(raw_body)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid payload")

    event_id = event_payload.get("data", {}).get("reference") or event_payload.get("event")
    event_type = event_payload.get("event")

    # Idempotency check: Reject duplicate webhook events
    existing_event = db.query(WebhookEvent).filter_by(event_id=event_id).first()
    if existing_event:
        logger.info(f"Duplicate webhook event ignored: {event_id}")
        return {"status": "ignored", "message": "Event already processed"}

    webhook_record = WebhookEvent(
        provider="paystack",
        event_id=event_id,
        event_type=event_type,
        payload_json=json.dumps(event_payload),
        signature=x_paystack_signature,
        processed=True
    )
    db.add(webhook_record)

    # Process charge.success
    if event_type == "charge.success":
        data = event_payload.get("data", {})
        reference = data.get("reference")
        payment = db.query(Payment).filter_by(provider_reference=reference).first()
        if payment:
            payment.status = "successful"
            payment.verified_at = datetime.now(timezone.utc)
            payment.fee_minor_units = data.get("fees", 0)
            payment.provider_metadata_json = json.dumps(data)

    db.commit()
    return {"status": "success"}
