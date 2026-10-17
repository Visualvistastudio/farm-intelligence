from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel

class PlanOut(BaseModel):
    id: str
    name: str
    code: str
    description: Optional[str] = None
    billing_interval: str
    price_minor_units: int
    currency: str
    price_formatted: str
    feature_limits: Dict[str, Any]
    is_active: bool

    class Config:
        from_attributes = True

class InitializePaymentRequest(BaseModel):
    plan_id: str
    callback_url: Optional[str] = None

class VerifyPaymentRequest(BaseModel):
    reference: str

class PaymentOut(BaseModel):
    id: str
    user_id: str
    provider: str
    provider_reference: str
    amount_minor_units: int
    amount_formatted: str
    currency: str
    status: str
    verified_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class RefundRequest(BaseModel):
    payment_id: str
    amount_minor_units: Optional[int] = None
    reason: str
