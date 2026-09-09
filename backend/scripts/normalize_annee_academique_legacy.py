"""
Normalise les codes d'année académique legacy en base (dev / démo).

Corrige les inscriptions et années créées par des seeds ORM hors validation Pydantic
(ex. E2E-MANUAL-2025 → 2025-2026).

Les codes E2E-COMP-* (E2E-COMP-2025, E2E-COMP-2026) sont volontairement
hors périmètre - dette test sans impact portail (voir RAPPORT_E2E_PORTAIL_ETUDIANT.md).

Usage (depuis backend/) :
  python scripts/normalize_annee_academique_legacy.py --dry-run
  python scripts/normalize_annee_academique_legacy.py --apply
"""
from __future__ import annotations

import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault(
    "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/gestscov2"
)
os.environ.setdefault("SECRET_KEY", "dev-secret")

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models.annee_academique import AnneeAcademique
from app.models.inscription import Inscription
from app.schemas.validators import ANNEE_ACADEMIQUE_CODE_PATTERN, LEGACY_ANNEE_ACADEMIQUE_CODES
import re

LEGACY_REPLACEMENTS = {
    "E2E-MANUAL-2025": "2025-2026",
    "E2E-COMP-2025": "2025-2026",
    "E2E-COMP-2026": "2026-2027",
}


def _is_valid_code(code: str) -> bool:
    return bool(re.match(ANNEE_ACADEMIQUE_CODE_PATTERN, code))


def normalize(dry_run: bool = True) -> None:
    engine = create_engine(settings.DATABASE_URL)
    Session = sessionmaker(bind=engine)
    db = Session()

    inscriptions = db.query(Inscription).all()
    fixed_inscriptions = 0
    for insc in inscriptions:
        if _is_valid_code(insc.annee_academique):
            continue
        replacement = LEGACY_REPLACEMENTS.get(insc.annee_academique)
        if not replacement:
            print(f"  SKIP inscription id={insc.id} : {insc.annee_academique!r} (pas de mapping)")
            continue
        print(f"  inscription id={insc.id} : {insc.annee_academique!r} → {replacement!r}")
        if not dry_run:
            insc.annee_academique = replacement
        fixed_inscriptions += 1

    annees = db.query(AnneeAcademique).all()
    fixed_annees = 0
    for annee in annees:
        if _is_valid_code(annee.code):
            continue
        replacement = LEGACY_REPLACEMENTS.get(annee.code)
        if not replacement:
            print(f"  SKIP annee id={annee.id} : {annee.code!r} (pas de mapping)")
            continue
        target = db.query(AnneeAcademique).filter(AnneeAcademique.code == replacement).first()
        if target and target.id != annee.id:
            print(
                f"  SKIP annee id={annee.id} : {annee.code!r} - {replacement!r} existe déjà (id={target.id})"
            )
            continue
        print(f"  annee id={annee.id} : {annee.code!r} → {replacement!r}")
        if not dry_run:
            annee.code = replacement
            if not annee.libelle or annee.code in LEGACY_ANNEE_ACADEMIQUE_CODES:
                annee.libelle = replacement
        fixed_annees += 1

    if not dry_run and (fixed_inscriptions or fixed_annees):
        db.commit()

    db.close()
    mode = "DRY-RUN" if dry_run else "APPLIQUÉ"
    print(f"\n[{mode}] {fixed_inscriptions} inscription(s), {fixed_annees} année(s) corrigée(s).")


def main() -> None:
    parser = argparse.ArgumentParser(description="Normalise les années académiques legacy")
    parser.add_argument("--apply", action="store_true", help="Appliquer les corrections")
    parser.add_argument("--dry-run", action="store_true", default=True)
    args = parser.parse_args()
    dry_run = not args.apply
    normalize(dry_run=dry_run)


if __name__ == "__main__":
    main()
