"""Enregistrement centralisé des logs système et événements d'audit."""

from __future__ import annotations

from typing import Any, Optional

from fastapi import Request
from sqlalchemy.orm import Session

from app.models.audit_event import AuditEvent
from app.models.system_log import SystemLog
from app.models.user import User


def client_ip(request: Request | None) -> Optional[str]:
    if request and request.client:
        return request.client.host
    return None


def audit_and_commit(
    db: Session,
    *,
    request: Request | None,
    user: User | None,
    action: str,
    entity_type: str,
    entity_id: str | int,
    old_values: Optional[dict[str, Any]] = None,
    new_values: Optional[dict[str, Any]] = None,
    details: Optional[str] = None,
) -> AuditEvent:
    """Enregistre un événement d'audit et commit la transaction."""
    entry = record_audit_event(
        db,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id),
        user=user,
        ip_address=client_ip(request),
        old_values=old_values,
        new_values=new_values,
        details=details,
    )
    db.commit()
    return entry


def audit_publish(
    db: Session,
    *,
    request: Request | None,
    user: User | None,
    entity_type: str,
    entity_id: str | int,
    old_values: Optional[dict[str, Any]] = None,
    new_values: Optional[dict[str, Any]] = None,
) -> AuditEvent:
    return audit_and_commit(
        db,
        request=request,
        user=user,
        action="publish",
        entity_type=entity_type,
        entity_id=entity_id,
        old_values=old_values,
        new_values=new_values,
    )


def audit_calculate(
    db: Session,
    *,
    request: Request | None,
    user: User | None,
    scope: str,
    entity_id: str | int,
    payload: Optional[dict[str, Any]] = None,
) -> AuditEvent:
    """Audit d'un recalcul de résultats."""
    return audit_and_commit(
        db,
        request=request,
        user=user,
        action="calculate",
        entity_type="resultat",
        entity_id=entity_id,
        new_values=payload,
        details=scope,
    )


def _user_email(user: Optional[User]) -> Optional[str]:
    return user.email if user else None


def record_system_log(
    db: Session,
    *,
    level: str,
    source: str,
    message: str,
    action: Optional[str] = None,
    user: Optional[User] = None,
    user_email: Optional[str] = None,
    ip_address: Optional[str] = None,
    method: Optional[str] = None,
    path: Optional[str] = None,
    status_code: Optional[int] = None,
    extra: Optional[dict[str, Any]] = None,
) -> SystemLog:
    entry = SystemLog(
        level=level,
        source=source,
        action=action,
        message=message,
        user_id=user.id if user else None,
        user_email=user_email or _user_email(user),
        ip_address=ip_address,
        method=method,
        path=path,
        status_code=status_code,
        extra=extra,
    )
    db.add(entry)
    db.flush()
    return entry


def record_audit_event(
    db: Session,
    *,
    action: str,
    entity_type: str,
    entity_id: str,
    user: Optional[User] = None,
    user_email: Optional[str] = None,
    old_values: Optional[dict[str, Any]] = None,
    new_values: Optional[dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    details: Optional[str] = None,
) -> AuditEvent:
    entry = AuditEvent(
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        user_id=user.id if user else None,
        user_email=user_email or _user_email(user),
        old_values=old_values,
        new_values=new_values,
        ip_address=ip_address,
        details=details,
    )
    db.add(entry)
    db.flush()
    return entry


def user_audit_snapshot(user: User) -> dict[str, Any]:
    return {
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "is_active": user.is_active,
        "is_superuser": user.is_superuser,
    }
