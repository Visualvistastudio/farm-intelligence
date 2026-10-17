import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Boolean, Column, DateTime, ForeignKey, Integer, String, Text
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Plan(Base):
    __tablename__ = "plans"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)  # Free Explore, Farmer Plus, Professional, Extension / Organization
    code = Column(String(50), unique=True, index=True, nullable=False)  # free, farmer_plus, professional, organization
    description = Column(Text, nullable=True)
    billing_interval = Column(String(20), default="month", nullable=False)  # month, year
    price_minor_units = Column(Integer, default=0, nullable=False)  # e.g., 300000 = ₦3,000.00
    currency = Column(String(5), default="NGN", nullable=False)
    feature_limits_json = Column(Text, nullable=False)  # max_farms, max_assessments_per_month, export_reports, seasonal_reminders
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    
    subscriptions = relationship("Subscription", back_populates="plan")

class Subscription(Base):
    __tablename__ = "subscriptions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    organization_id = Column(String(36), nullable=True)
    plan_id = Column(String(36), ForeignKey("plans.id"), nullable=False, index=True)
    provider = Column(String(50), default="paystack", nullable=False)
    provider_subscription_id = Column(String(100), nullable=True)
    provider_customer_code = Column(String(100), nullable=True)
    status = Column(String(50), default="active", nullable=False)  # active, past_due, canceled, trialing
    current_period_start = Column(DateTime, default=utc_now, nullable=False)
    current_period_end = Column(DateTime, nullable=False)
    cancel_at_period_end = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    user = relationship("User", back_populates="subscriptions")
    plan = relationship("Plan", back_populates="subscriptions")
    payments = relationship("Payment", back_populates="subscription")

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subscription_id = Column(String(36), ForeignKey("subscriptions.id", ondelete="SET NULL"), nullable=True, index=True)
    provider = Column(String(50), default="paystack", nullable=False)
    provider_reference = Column(String(100), unique=True, index=True, nullable=False)
    amount_minor_units = Column(Integer, nullable=False)  # in kobo (100 kobo = 1 NGN)
    currency = Column(String(5), default="NGN", nullable=False)
    fee_minor_units = Column(Integer, default=0, nullable=False)
    status = Column(String(50), default="initiated", nullable=False)  # initiated, pending, successful, failed, refunded
    verified_at = Column(DateTime, nullable=True)
    provider_metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    user = relationship("User", back_populates="payments")
    subscription = relationship("Subscription", back_populates="payments")
    refunds = relationship("Refund", back_populates="payment", cascade="all, delete-orphan")

class Refund(Base):
    __tablename__ = "refunds"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    payment_id = Column(String(36), ForeignKey("payments.id", ondelete="CASCADE"), nullable=False, index=True)
    amount_minor_units = Column(Integer, nullable=False)
    reason = Column(Text, nullable=False)
    initiated_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    status = Column(String(50), default="pending", nullable=False)  # pending, successful, failed
    provider_reference = Column(String(100), nullable=True)
    provider_metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    payment = relationship("Payment", back_populates="refunds")

class WebhookEvent(Base):
    __tablename__ = "webhook_events"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    provider = Column(String(50), default="paystack", nullable=False)
    event_id = Column(String(100), unique=True, index=True, nullable=False)  # idempotency key
    event_type = Column(String(100), nullable=False)  # charge.success, subscription.create, etc.
    payload_json = Column(Text, nullable=False)
    signature = Column(String(255), nullable=True)
    processed = Column(Boolean, default=False, nullable=False)
    processing_error = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
