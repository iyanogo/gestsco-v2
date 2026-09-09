#!/usr/bin/env python3
"""Exécute la maintenance administration (rétention + sauvegarde planifiée).

Usage cron (quotidien 2h) :
  0 2 * * * cd /path/to/gestsco-v2/backend && python scripts/run_administration_maintenance.py
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import settings
from app.core.database import SessionLocal
from app.services.administration_maintenance_service import AdministrationMaintenanceService


def main() -> int:
    if not settings.ADMIN_MAINTENANCE_ENABLED:
        print("ADMIN_MAINTENANCE_ENABLED=false - rien à faire.")
        return 0

    db = SessionLocal()
    try:
        result = AdministrationMaintenanceService.run_all(db)
        print("Maintenance terminée:", result)
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
