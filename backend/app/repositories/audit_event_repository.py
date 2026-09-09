from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.models.audit_event import AuditEvent


class AuditEventRepository:
    @staticmethod
    def list_filtered(
        db: Session,
        *,
        action: Optional[str] = None,
        entity_type: Optional[str] = None,
        user_email: Optional[str] = None,
        search: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> list[AuditEvent]:
        query = db.query(AuditEvent)
        if action:
            query = query.filter(AuditEvent.action == action)
        if entity_type:
            query = query.filter(AuditEvent.entity_type == entity_type)
        if user_email:
            query = query.filter(AuditEvent.user_email.ilike(f"%{user_email}%"))
        if search:
            pattern = f"%{search}%"
            query = query.filter(
                (AuditEvent.entity_id.ilike(pattern))
                | (AuditEvent.details.ilike(pattern))
                | (AuditEvent.user_email.ilike(pattern))
            )
        if date_from:
            query = query.filter(AuditEvent.created_at >= date_from)
        if date_to:
            query = query.filter(AuditEvent.created_at <= date_to)
        return (
            query.order_by(AuditEvent.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def delete_older_than(db: Session, cutoff: datetime) -> int:
        deleted = (
            db.query(AuditEvent)
            .filter(AuditEvent.created_at < cutoff)
            .delete(synchronize_session=False)
        )
        return deleted
