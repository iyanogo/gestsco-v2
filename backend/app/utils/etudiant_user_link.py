"""Utilitaires de liaison User ↔ Etudiant (backfill portail)."""

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass, field
from typing import Optional

from sqlalchemy.orm import Session

from app.models.etudiant import Etudiant
from app.models.user import User


def normalize_email(email: Optional[str]) -> Optional[str]:
    """Normalise un email pour comparaison (trim + lowercase)."""
    if not email:
        return None
    normalized = email.strip().lower()
    return normalized or None


@dataclass
class BackfillReport:
    """Rapport d'exécution du backfill etudiant.user_id."""

    already_linked: list[dict] = field(default_factory=list)
    would_link: list[dict] = field(default_factory=list)
    linked: list[dict] = field(default_factory=list)
    no_email: list[dict] = field(default_factory=list)
    no_user_found: list[dict] = field(default_factory=list)
    ambiguous_user: list[dict] = field(default_factory=list)
    user_already_taken: list[dict] = field(default_factory=list)
    duplicate_etudiant_email: list[dict] = field(default_factory=list)

    def print_summary(self, *, dry_run: bool) -> None:
        mode = "DRY-RUN" if dry_run else "APPLY"
        print(f"\n{'=' * 60}")
        print(f"RAPPORT BACKFILL etudiant.user_id [{mode}]")
        print("=" * 60)

        if dry_run:
            print(f"  Liens qui seraient créés     : {len(self.would_link)}")
        else:
            print(f"  Liens créés                  : {len(self.linked)}")

        print(f"  Déjà liés (ignorés)          : {len(self.already_linked)}")
        print(f"  Étudiants sans email         : {len(self.no_email)}")
        print(f"  Étudiants sans compte User   : {len(self.no_user_found)}")
        print(f"  Emails ambigus (plusieurs User): {len(self.ambiguous_user)}")
        print(f"  User déjà lié à un autre     : {len(self.user_already_taken)}")
        print(f"  Emails étudiants en doublon  : {len(self.duplicate_etudiant_email)}")

        def _detail(title: str, rows: list[dict], limit: int = 20) -> None:
            if not rows:
                return
            print(f"\n--- {title} ({len(rows)}) ---")
            for row in rows[:limit]:
                print(f"  {row}")
            if len(rows) > limit:
                print(f"  … et {len(rows) - limit} autres")

        if dry_run:
            _detail("Liens prévus", self.would_link)
        else:
            _detail("Liens créés", self.linked)

        _detail("Sans email", self.no_email)
        _detail("Sans compte User correspondant", self.no_user_found)
        _detail("Ambigus - résolution manuelle requise", self.ambiguous_user)
        _detail("User déjà rattaché à un autre étudiant", self.user_already_taken)
        _detail("Emails étudiants dupliqués (anomalie)", self.duplicate_etudiant_email)

        print("\n--- Cas non résolus automatiquement ---")
        print(
            "  • Étudiant sans compte : créer un User (rôle etudiant) avec le même email, "
            "puis relancer ce script."
        )
        print(
            "  • Ambiguïté ou User déjà pris : corriger les emails en base ou lier "
            "manuellement via UPDATE etudiant SET user_id = … WHERE id = …"
        )
        print("  • Ce script ne remplace jamais un user_id existant sur l'étudiant.")


def build_user_index(users: list[User]) -> dict[str, list[User]]:
    """Index des users par email normalisé."""
    index: dict[str, list[User]] = defaultdict(list)
    for user in users:
        key = normalize_email(user.email)
        if key:
            index[key].append(user)
    return index


def build_etudiant_email_conflicts(etudiants: list[Etudiant]) -> set[str]:
    """Emails normalisés présents sur plusieurs fiches étudiant."""
    counts: dict[str, int] = defaultdict(int)
    for etu in etudiants:
        key = normalize_email(etu.email)
        if key:
            counts[key] += 1
    return {email for email, count in counts.items() if count > 1}


def build_user_id_taken(etudiants: list[Etudiant]) -> dict[int, Etudiant]:
    """Map user_id → étudiant déjà lié."""
    return {etu.user_id: etu for etu in etudiants if etu.user_id is not None}


def run_backfill(
    db: Session,
    *,
    dry_run: bool = True,
    limit: Optional[int] = None,
) -> BackfillReport:
    """Lie etudiant.user_id par correspondance email normalisée."""
    report = BackfillReport()

    etudiants: list[Etudiant] = db.query(Etudiant).order_by(Etudiant.id).all()
    users: list[User] = db.query(User).order_by(User.id).all()

    user_by_email = build_user_index(users)
    duplicate_emails = build_etudiant_email_conflicts(etudiants)
    user_id_taken = build_user_id_taken(etudiants)

    processed = 0
    for etu in etudiants:
        if limit is not None and processed >= limit:
            break

        if etu.user_id is not None:
            report.already_linked.append(
                {
                    "etudiant_id": etu.id,
                    "matricule": etu.matricule,
                    "user_id": etu.user_id,
                    "email": etu.email,
                }
            )
            continue

        email_key = normalize_email(etu.email)
        if not email_key:
            report.no_email.append(
                {
                    "etudiant_id": etu.id,
                    "matricule": etu.matricule,
                    "nom": etu.nom,
                    "prenom": etu.prenom,
                }
            )
            continue

        if email_key in duplicate_emails:
            report.duplicate_etudiant_email.append(
                {
                    "etudiant_id": etu.id,
                    "matricule": etu.matricule,
                    "email": etu.email,
                    "email_normalized": email_key,
                }
            )
            continue

        candidates = user_by_email.get(email_key, [])
        if not candidates:
            report.no_user_found.append(
                {
                    "etudiant_id": etu.id,
                    "matricule": etu.matricule,
                    "email": etu.email,
                    "email_normalized": email_key,
                }
            )
            continue

        if len(candidates) > 1:
            report.ambiguous_user.append(
                {
                    "etudiant_id": etu.id,
                    "matricule": etu.matricule,
                    "email": etu.email,
                    "user_ids": [u.id for u in candidates],
                }
            )
            continue

        user = candidates[0]

        existing = user_id_taken.get(user.id)
        if existing and existing.id != etu.id:
            report.user_already_taken.append(
                {
                    "etudiant_id": etu.id,
                    "matricule": etu.matricule,
                    "email": etu.email,
                    "user_id": user.id,
                    "already_linked_etudiant_id": existing.id,
                }
            )
            continue

        link_info = {
            "etudiant_id": etu.id,
            "matricule": etu.matricule,
            "email": etu.email,
            "user_id": user.id,
            "user_role": user.role,
        }

        if dry_run:
            report.would_link.append(link_info)
        else:
            etu.user_id = user.id
            user_id_taken[user.id] = etu
            report.linked.append(link_info)

        processed += 1

    if not dry_run and report.linked:
        db.commit()

    return report
