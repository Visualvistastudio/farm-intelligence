import json
from typing import Callable, Generator, List, Optional
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User, UserRole, Role, RolePermission, Permission, AuditLog

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
) -> User:
    """Validate bearer token and retrieve active user."""
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload["sub"]
    user = db.query(User).filter_by(id=user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    if user.account_status == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been suspended. Please contact platform support."
        )
    return user

def get_current_active_admin(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> User:
    """Ensure current user is an authorized platform administrator."""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Administrator privileges required."
        )
    return current_user

def require_permission(permission_code: str):
    """
    Dependency factory to enforce granular RBAC permissions (PRD Addendum Section 8).
    Super Admin has full access to all permissions.
    """
    def permission_checker(
        current_admin: User = Depends(get_current_active_admin),
        db: Session = Depends(get_db)
    ) -> User:
        user_roles = db.query(UserRole).filter_by(user_id=current_admin.id).all()
        role_ids = [ur.role_id for ur in user_roles]
        
        # Check if user has super_admin role
        super_admin_role = db.query(Role).filter(Role.id.in_(role_ids), Role.name == "super_admin").first()
        if super_admin_role:
            return current_admin

        # Check assigned permissions
        has_perm = db.query(RolePermission).join(Permission).filter(
            RolePermission.role_id.in_(role_ids),
            Permission.code == permission_code
        ).first()

        if not has_perm:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: Missing required permission '{permission_code}'"
            )
        return current_admin

    return permission_checker

def log_audit(
    db: Session,
    actor_user_id: Optional[str],
    actor_email: Optional[str],
    action: str,
    entity_type: str,
    entity_id: Optional[str] = None,
    details: Optional[dict] = None,
    ip_address: Optional[str] = None
):
    """Write an immutable audit log entry (PRD Addendum Section 15)."""
    log = AuditLog(
        actor_user_id=actor_user_id,
        actor_email=actor_email,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details_json=json.dumps(details or {}),
        ip_address=ip_address
    )
    db.add(log)
    db.commit()
