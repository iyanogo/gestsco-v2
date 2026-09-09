"""Script temporaire - dump + vérifs pour test rollback Alembic."""
from __future__ import annotations

import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

from sqlalchemy import create_engine, text

from app.core.config import settings


def db_url_parts() -> dict[str, str]:
    parsed = urlparse(settings.DATABASE_URL)
    return {
        "host": parsed.hostname or "localhost",
        "port": str(parsed.port or 5432),
        "user": parsed.username or "postgres",
        "password": parsed.password or "",
        "dbname": (parsed.path or "/gestscov2").lstrip("/"),
    }


def run_pg_dump(out_path: Path) -> None:
    parts = db_url_parts()
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
    subprocess.run(cmd, check=True, env=env)


def snapshot(label: str) -> dict:
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        cols = conn.execute(
            text(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_name = 'matiere' AND column_name IN ('credit', 'obligatoire') "
                "ORDER BY 1"
            )
        ).fetchall()
        versions = conn.execute(text("SELECT version_num FROM alembic_version")).fetchall()
        exam_types = conn.execute(
            text(
                "SELECT type_evaluation, COUNT(*) FROM examens "
                "GROUP BY type_evaluation ORDER BY 1"
            )
        ).fetchall()
        matiere_count = conn.execute(text("SELECT COUNT(*) FROM matiere")).scalar()
    snap = {
        "label": label,
        "matiere_cols": [r[0] for r in cols],
        "alembic_version": [r[0] for r in versions],
        "examens_types": list(exam_types),
        "matiere_count": matiere_count,
    }
    print(f"\n=== {label} ===")
    for k, v in snap.items():
        if k != "label":
            print(f"  {k}: {v}")
    return snap


def main() -> int:
    action = sys.argv[1] if len(sys.argv) > 1 else "snapshot"
    if action == "dump":
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        out = Path(__file__).resolve().parents[1] / f"backup_avant_test_rollback_{ts}.sql"
        run_pg_dump(out)
        print(f"Dump OK: {out}")
        return 0
    if action == "snapshot":
        snapshot("current")
        return 0
    print(f"Unknown action: {action}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
