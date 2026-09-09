"""Tests maintenance administration planifiée."""

from datetime import datetime, timedelta

import pytest
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.audit_event import AuditEvent
from app.models.system_log import SystemLog
from app.services.administration_maintenance_service import AdministrationMaintenanceService


class TestAdministrationMaintenance:
    def test_purge_old_logs(self, db: Session):
        db.add(
            SystemLog(
                level="INFO",
                source="test",
                message="old",
                created_at=datetime.utcnow() - timedelta(days=200),
            )
        )
        db.add(
            SystemLog(
                level="INFO",
                source="test",
                message="recent",
                created_at=datetime.utcnow() - timedelta(days=1),
            )
        )
        db.commit()

        deleted = AdministrationMaintenanceService.purge_old_logs(db)
        assert deleted >= 1
        assert db.query(SystemLog).filter(SystemLog.message == "recent").count() == 1

    def test_run_all_respects_flags(self, db: Session, monkeypatch: pytest.MonkeyPatch):
        monkeypatch.setattr(settings, "ADMIN_MAINTENANCE_ENABLED", True)
        monkeypatch.setattr(settings, "ADMIN_SCHEDULED_BACKUP_ENABLED", False)
        db.add(
            AuditEvent(
                action="update",
                entity_type="user",
                entity_id="x",
                created_at=datetime.utcnow() - timedelta(days=400),
            )
        )
        db.commit()

        result = AdministrationMaintenanceService.run_all(db)
        assert "audit_purged" in result
        assert "backup" not in result
