"""
Test manuel conflits EDT - salle/créneau (dev PostgreSQL).

Usage (depuis backend/) :
  set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gestscov2
  python scripts/e2e_manual_test_edt_conflits.py
"""
from __future__ import annotations

import json
import os
import sys
from datetime import date, time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault(
    "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/gestscov2"
)
os.environ.setdefault("SECRET_KEY", "dev-secret-e2e")

from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine

from app.core.config import settings
from app.models.annee_academique import AnneeAcademique
from app.models.batiment import Batiment
from app.models.creneau_horaire import CreneauHoraire
from app.models.etablissement import Etablissement
from app.models.matiere import Matiere
from app.models.niveau import Niveau
from app.models.salle import Salle
from app.models.user import User
from app.repositories.reservation_salle_repository import reservation_salle_repository
from app.repositories.seance_repository import seance_repository
from app.schemas.reservation_salle import ReservationSalleCreate
from app.schemas.seance import SeanceCreate


def pp(title: str, data) -> None:
    print(f"\n{'='*60}\n{title}\n{'='*60}")
    print(json.dumps(data, indent=2, default=str, ensure_ascii=False) if isinstance(data, (dict, list)) else data)


def main() -> None:
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.is_superuser.is_(True)).first()
        if not admin:
            raise SystemExit("Aucun superuser en base - impossible de lancer le test")

        etab = db.query(Etablissement).first()
        if not etab:
            etab = Etablissement(code="E2E-EDT-ETAB", nom="E2E Etab")
            db.add(etab)
            db.flush()

        batiment = db.query(Batiment).filter(Batiment.code == "E2E-EDT-BAT").first()
        if not batiment:
            batiment = Batiment(code="E2E-EDT-BAT", libelle="E2E Batiment", etablissement_id=etab.id)
            db.add(batiment)
            db.commit()
            db.refresh(batiment)

        salle = db.query(Salle).filter(Salle.code == "E2E-EDT-SALLE").first()
        if not salle:
            salle = Salle(
                code="E2E-EDT-SALLE",
                libelle="E2E Salle conflit",
                batiment_id=batiment.id,
                type_salle="cours",
                capacite=40,
            )
            db.add(salle)
            db.commit()
            db.refresh(salle)

        creneau = db.query(CreneauHoraire).filter(CreneauHoraire.code == "E2E-EDT-AM").first()
        if not creneau:
            creneau = CreneauHoraire(
                code="E2E-EDT-AM",
                libelle="E2E Matin",
                heure_debut=time(8, 0),
                heure_fin=time(10, 0),
                periode="matin",
                ordre=1,
                duree_minutes=120,
            )
            db.add(creneau)
            db.commit()
            db.refresh(creneau)

        niveau = db.query(Niveau).first()
        matiere = db.query(Matiere).first()
        annee = db.query(AnneeAcademique).filter(AnneeAcademique.is_active.is_(True)).first()
        if not all([niveau, matiere, annee]):
            raise SystemExit("Référentiel incomplet (niveau/matiere/annee)")

        conflict_date = date(2026, 4, 14)

        pp("ÉTAPE 1 - Création séance de référence", "…")
        seance_a = seance_repository.create_with_verification(
            db,
            SeanceCreate(
                matiere_id=matiere.id,
                niveau_id=niveau.id,
                enseignant_id=admin.id,
                salle_id=salle.id,
                creneau_id=creneau.id,
                type_seance="cours",
                semestre=1,
                annee_academique_id=annee.id,
                date_seance=conflict_date,
                statut="confirmee",
            ),
        )
        if isinstance(seance_a, dict):
            raise SystemExit(f"Échec création séance A: {seance_a}")
        pp("Séance A créée", {"id": seance_a.id, "code": seance_a.code})

        pp("ÉTAPE 2 - Conflit salle/créneau (même créneau)", "…")
        seance_b = seance_repository.create_with_verification(
            db,
            SeanceCreate(
                matiere_id=matiere.id,
                niveau_id=niveau.id,
                enseignant_id=admin.id,
                salle_id=salle.id,
                creneau_id=creneau.id,
                type_seance="cours",
                semestre=1,
                annee_academique_id=annee.id,
                date_seance=conflict_date,
                statut="confirmee",
            ),
        )
        if not isinstance(seance_b, dict) or "errors" not in seance_b:
            raise SystemExit("ÉCHEC : conflit salle/créneau non détecté")
        pp("Conflit détecté OK", seance_b)

        pp("ÉTAPE 3 - Réservation bloquée par séance existante", "…")
        resa = reservation_salle_repository.create_with_verification(
            db,
            ReservationSalleCreate(
                salle_id=salle.id,
                date_reservation=conflict_date,
                heure_debut=time(8, 30),
                heure_fin=time(9, 30),
                motif="E2E conflit réservation",
            ),
            admin.id,
        )
        if not isinstance(resa, dict) or "errors" not in resa:
            raise SystemExit("ÉCHEC : réservation aurait dû être bloquée")
        pp("Réservation bloquée OK", resa)

        pp("FIN", "Test manuel conflits EDT terminé avec succès.")
    except Exception as exc:
        db.rollback()
        pp("ERREUR", str(exc))
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
