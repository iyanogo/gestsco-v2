from datetime import datetime
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.system_log import SystemLog


class SystemLogRepository:
    @staticmethod
    def list_filtered(
        db: Session,
        *,
        level: Optional[str] = None,
        source: Optional[str] = None,
        user_email: Optional[str] = None,
        search: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> list[SystemLog]:
        query = db.query(SystemLog)
        if level:
            query = query.filter(SystemLog.level == level)
        if source:
            query = query.filter(SystemLog.source == source)
        if user_email:
            query = query.filter(SystemLog.user_email.ilike(f"%{user_email}%"))
        if search:
            pattern = f"%{search}%"
            query = query.filter(
                (SystemLog.message.ilike(pattern))
                | (SystemLog.action.ilike(pattern))
                | (SystemLog.path.ilike(pattern))
            )
        if date_from:
            query = query.filter(SystemLog.created_at >= date_from)
        if date_to:
            query = query.filter(SystemLog.created_at <= date_to)
        return (
            query.order_by(SystemLog.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def count_filtered(
        db: Session,
        *,
        level: Optional[str] = None,
        source: Optional[str] = None,
        user_email: Optional[str] = None,
        search: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
    ) -> int:
        query = db.query(func.count(SystemLog.id))
        if level:
            query = query.filter(SystemLog.level == level)
        if source:
            query = query.filter(SystemLog.source == source)
        if user_email:
            query = query.filter(SystemLog.user_email.ilike(f"%{user_email}%"))
        if search:
            pattern = f"%{search}%"
            query = query.filter(
                (SystemLog.message.ilike(pattern))
                | (SystemLog.action.ilike(pattern))
                | (SystemLog.path.ilike(pattern))
            )
        if date_from:
            query = query.filter(SystemLog.created_at >= date_from)
        if date_to:
            query = query.filter(SystemLog.created_at <= date_to)
        return query.scalar() or 0

    @staticmethod
    def summary(db: Session) -> dict[str, int]:
        rows = (
            db.query(SystemLog.level, func.count(SystemLog.id))
            .group_by(SystemLog.level)
            .all()
        )
        counts = {level: count for level, count in rows}
        return {
            "total": sum(counts.values()),
            "info": counts.get("INFO", 0),
            "warning": counts.get("WARNING", 0),
            "error": counts.get("ERROR", 0),
            "success": counts.get("SUCCESS", 0),
        }

    @staticmethod
    def delete_older_than(db: Session, cutoff: datetime) -> int:
        deleted = (
            db.query(SystemLog)
            .filter(SystemLog.created_at < cutoff)
            .delete(synchronize_session=False)
        )
        return deleted
