"""Sauvegarde PostgreSQL via pg_dump."""

from __future__ import annotations

import os
import subprocess
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.backup_run import BackupRun
from app.models.user import User
from app.repositories.backup_run_repository import BackupRunRepository


def _db_url_parts() -> dict[str, str]:
    parsed = urlparse(settings.DATABASE_URL)
    return {
        "host": parsed.hostname or "localhost",
        "port": str(parsed.port or 5432),
        "user": parsed.username or "postgres",
        "password": parsed.password or "",
        "dbname": (parsed.path or "/gestscov2").lstrip("/"),
    }


def _backup_dir() -> Path:
    base = Path(__file__).resolve().parents[2]
    path = Path(settings.BACKUP_DIR)
    if not path.is_absolute():
        path = base / path
    path.mkdir(parents=True, exist_ok=True)
    return path


class BackupService:
    @staticmethod
    def list_backups(db: Session, skip: int = 0, limit: int = 50) -> list[BackupRun]:
        return BackupRunRepository.list_all(db, skip=skip, limit=limit)

    @staticmethod
    def create_manual_backup(db: Session, user: User) -> BackupRun:
        ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"gestsco_backup_{ts}.sql"
        out_path = _backup_dir() / filename

        run = BackupRun(
            filename=filename,
            file_path=str(out_path),
            backup_type="manual",
            status="running",
            triggered_by_id=user.id,
        )
        BackupRunRepository.create(db, run)
        db.commit()

        try:
            parts = _db_url_parts()
            cmd = [
                "pg_dump",
                "-h",
                parts["host"],
                "-p",
                parts["port"],
                "-U",
                parts["user"],
                "-d",
                parts["dbname"],
                "-f",
                str(out_path),
            ]
            env = os.environ.copy()
            if parts["password"]:
                env["PGPASSWORD"] = parts["password"]
            subprocess.run(cmd, check=True, env=env, capture_output=True, text=True)

            size = out_path.stat().st_size if out_path.exists() else None
            run.status = "success"
            run.file_size_bytes = size
            run.finished_at = datetime.utcnow()
        except FileNotFoundError:
            run.status = "failed"
            run.error_message = "pg_dump introuvable - installez les outils PostgreSQL client."
            run.finished_at = datetime.utcnow()
        except subprocess.CalledProcessError as exc:
            run.status = "failed"
            run.error_message = (exc.stderr or exc.stdout or str(exc))[:2000]
            run.finished_at = datetime.utcnow()
        except Exception as exc:  # noqa: BLE001 - persister l'échec pour l'UI admin
            run.status = "failed"
            run.error_message = str(exc)[:2000]
            run.finished_at = datetime.utcnow()

        BackupRunRepository.update(db, run)
        db.commit()
        db.refresh(run)
        return run

    @staticmethod
    def get_backup_file(db: Session, backup_id: int) -> tuple[BackupRun, Path] | None:
        run = BackupRunRepository.get_by_id(db, backup_id)
        if not run or run.status != "success":
            return None
        path = Path(run.file_path)
        if not path.is_file():
            return None
        return run, path

    @staticmethod
    def restore_backup(db: Session, backup_id: int, user: User) -> BackupRun:
        """Restaure une sauvegarde via psql (opération destructive)."""
        result = BackupService.get_backup_file(db, backup_id)
        if not result:
            raise ValueError("Sauvegarde introuvable ou fichier manquant")
        run, path = result

        restore_run = BackupRun(
            filename=run.filename,
            file_path=str(path),
            backup_type="restore",
            status="running",
            triggered_by_id=user.id,
        )
        BackupRunRepository.create(db, restore_run)
        db.commit()

        try:
            parts = _db_url_parts()
            cmd = [
                "psql",
                "-h",
                parts["host"],
                "-p",
                parts["port"],
                "-U",
                parts["user"],
                "-d",
                parts["dbname"],
                "-f",
                str(path),
                "-v",
                "ON_ERROR_STOP=1",
            ]
            env = os.environ.copy()
            if parts["password"]:
                env["PGPASSWORD"] = parts["password"]
            subprocess.run(cmd, check=True, env=env, capture_output=True, text=True)
            restore_run.status = "success"
            restore_run.finished_at = datetime.utcnow()
        except FileNotFoundError:
            restore_run.status = "failed"
            restore_run.error_message = "psql introuvable - installez les outils PostgreSQL client."
            restore_run.finished_at = datetime.utcnow()
        except subprocess.CalledProcessError as exc:
            restore_run.status = "failed"
            restore_run.error_message = (exc.stderr or exc.stdout or str(exc))[:2000]
            restore_run.finished_at = datetime.utcnow()
        except Exception as exc:  # noqa: BLE001
            restore_run.status = "failed"
            restore_run.error_message = str(exc)[:2000]
            restore_run.finished_at = datetime.utcnow()

        BackupRunRepository.update(db, restore_run)
        db.commit()
        db.refresh(restore_run)
        return restore_run
