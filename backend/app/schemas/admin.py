from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, EmailStr, Field

class AdminOverviewMetrics(BaseModel):
    total_users: int
    active_users: int
    total_farms: int
    total_fields: int
    total_assessments: int
    processing_jobs: int
    failed_jobs: int
    active_subscriptions: int
    confirmed_payments_count: int
    gross_revenue_ngn: float
    refund_totals_ngn: float
    net_revenue_ngn: float
    paystack_mode: str
    paystack_configured: bool
    email_service_configured: bool
    data_sources_status: Dict[str, str]

class AdminUserUpdate(BaseModel):
    account_status: Optional[str] = None  # active, suspended
    full_name: Optional[str] = None
    country_code: Optional[str] = None

class AdminInviteRequest(BaseModel):
    email: EmailStr
    full_name: str
    role_name: str  # super_admin, platform_admin, finance_admin, etc.

class RoleCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    display_name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    permission_codes: List[str] = []

class RoleAssignRequest(BaseModel):
    user_id: str
    role_id: str

class PlatformSettingsUpdate(BaseModel):
    settings: Dict[str, Any]

class PaystackSettingsUpdate(BaseModel):
    secret_key: Optional[str] = None
    public_key: Optional[str] = None
    webhook_secret: Optional[str] = None
    test_mode: bool = True

class AuditLogOut(BaseModel):
    id: str
    actor_user_id: Optional[str] = None
    actor_email: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    details: Dict[str, Any]
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
