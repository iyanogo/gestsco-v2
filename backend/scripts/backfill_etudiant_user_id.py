"""
Backfill etudiant.user_id - rattachement User ↔ Etudiant par email.

Usage (depuis backend/) :
  python scripts/backfill_etudiant_user_id.py              # dry-run (défaut)
  python scripts/backfill_etudiant_user_id.py --apply      # écriture en base
  python scripts/backfill_etudiant_user_id.py --apply --limit 50

La migration 002_add_etudiant_user_id ajoute la colonne FK sans lier les comptes
existants. Ce script comble ce gap de façon sûre et rejouable.

Limites :
  - Ne crée pas de comptes User manquants (étudiants sans login → résolution manuelle).
  - Ne remplace pas un user_id déjà renseigné sur l'étudiant.
  - À réexécuter après import de nouveaux étudiants/comptes si aucun flux automatique
    de liaison n'existe encore à la création.
"""
from __future__ import annotations

import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault(
    "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/gestscov2"
)
os.environ.setdefault("SECRET_KEY", "dev-secret-backfill")

from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.utils.etudiant_user_link import run_backfill


def _ensure_user_id_column(engine) -> None:
    """Vérifie que la migration 002 a été appliquée."""
    if not inspect(engine).has_table("etudiant"):
        print("ERREUR: table etudiant introuvable.")
        raise SystemExit(1)
    columns = {c["name"] for c in inspect(engine).get_columns("etudiant")}
    if "user_id" not in columns:
        print(
            "ERREUR: colonne etudiant.user_id absente. "
            "Exécutez d'abord : alembic upgrade head"
        )
        raise SystemExit(1)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Backfill etudiant.user_id par correspondance email (User ↔ Etudiant)."
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Appliquer les liens en base (sans ce flag : dry-run uniquement).",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Nombre max de nouveaux liens à traiter (étudiants sans user_id).",
    )
    args = parser.parse_args()
    dry_run = not args.apply

    print(f"Base cible : {settings.DATABASE_URL}")
    if dry_run:
        print("Mode dry-run - aucune modification. Utilisez --apply pour écrire.")
    else:
        print("Mode APPLY - les liens seront persistés.")

    engine = create_engine(settings.DATABASE_URL)
    _ensure_user_id_column(engine)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    try:
        report = run_backfill(db, dry_run=dry_run, limit=args.limit)
        report.print_summary(dry_run=dry_run)
    finally:
        db.close()

    unresolved = (
        len(report.no_email)
        + len(report.no_user_found)
        + len(report.ambiguous_user)
        + len(report.user_already_taken)
        + len(report.duplicate_etudiant_email)
    )
    if unresolved:
        print(f"\nATTENTION: {unresolved} cas necessitent une attention (voir details ci-dessus).")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
