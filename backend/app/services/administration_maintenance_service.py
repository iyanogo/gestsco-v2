"""Maintenance planifiée - rétention logs/audit et sauvegarde automatique."""

from __future__ import annotations

from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.user import User
from app.repositories.audit_event_repository import AuditEventRepository
from app.repositories.backup_run_repository import BackupRunRepository
from app.repositories.system_log_repository import SystemLogRepository
from app.services.backup_service import BackupService


class AdministrationMaintenanceService:
    @staticmethod
    def purge_old_logs(db: Session) -> int:
        cutoff = datetime.utcnow() - timedelta(days=settings.ADMIN_LOG_RETENTION_DAYS)
        deleted = SystemLogRepository.delete_older_than(db, cutoff)
        db.commit()
        return deleted

    @staticmethod
    def purge_old_audit(db: Session) -> int:
        cutoff = datetime.utcnow() - timedelta(days=settings.ADMIN_AUDIT_RETENTION_DAYS)
        deleted = AuditEventRepository.delete_older_than(db, cutoff)
        db.commit()
        return deleted

    @staticmethod
    def run_scheduled_backup(db: Session) -> dict:
        user = (
            db.query(User)
            .filter(User.is_superuser.is_(True), User.is_active.is_(True))
            .order_by(User.id)
            .first()
        )
        if not user:
            return {"status": "skipped", "reason": "no_superuser"}
        run = BackupService.create_manual_backup(db, user)
        run.backup_type = "scheduled"
        BackupRunRepository.update(db, run)
        db.commit()
        db.refresh(run)
        return {
            "status": run.status,
            "filename": run.filename,
            "backup_id": run.id,
            "error_message": run.error_message,
        }

    @staticmethod
    def run_all(db: Session) -> dict:
        result: dict = {}
        if settings.ADMIN_LOG_RETENTION_DAYS > 0:
            result["logs_purged"] = AdministrationMaintenanceService.purge_old_logs(db)
        if settings.ADMIN_AUDIT_RETENTION_DAYS > 0:
            result["audit_purged"] = AdministrationMaintenanceService.purge_old_audit(db)
        if settings.ADMIN_SCHEDULED_BACKUP_ENABLED:
            result["backup"] = AdministrationMaintenanceService.run_scheduled_backup(db)
        return result
