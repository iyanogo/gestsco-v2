"""
Test manuel présences - feuille d'appel, bulk, taux (dev PostgreSQL).

Usage (depuis backend/) :
  set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gestscov2
  python scripts/e2e_manual_test_presences.py
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
from app.models.etudiant import Etudiant
from app.models.inscription import Inscription
from app.models.inscription_matiere import InscriptionMatiere
from app.models.matiere import Matiere
from app.models.niveau import Niveau
from app.models.salle import Salle
from app.models.user import User
from app.repositories.presence_repository import presence_repository
from app.repositories.seance_repository import seance_repository
from app.models.seance import Seance
from app.schemas.presence import PresenceBulkCreate, PresenceItem
from app.schemas.seance import SeanceCreate


def pp(title: str, data) -> None:
    print(f"\n{'='*60}\n{title}\n{'='*60}")
    if isinstance(data, (dict, list)):
        print(json.dumps(data, indent=2, default=str, ensure_ascii=False))
    else:
        print(data)


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
            etab = Etablissement(code="E2E-PRES-ETAB", nom="E2E Etab Présences")
            db.add(etab)
            db.flush()

        batiment = db.query(Batiment).filter(Batiment.code == "E2E-PRES-BAT").first()
        if not batiment:
            batiment = Batiment(code="E2E-PRES-BAT", libelle="E2E Batiment", etablissement_id=etab.id)
            db.add(batiment)
            db.commit()
            db.refresh(batiment)

        salle = db.query(Salle).filter(Salle.code == "E2E-PRES-SALLE").first()
        if not salle:
            salle = Salle(
                code="E2E-PRES-SALLE",
                libelle="E2E Salle présences",
                batiment_id=batiment.id,
                type_salle="cours",
                capacite=40,
            )
            db.add(salle)
            db.commit()
            db.refresh(salle)

        creneau = db.query(CreneauHoraire).filter(CreneauHoraire.code == "E2E-PRES-AM").first()
        if not creneau:
            creneau = CreneauHoraire(
                code="E2E-PRES-AM",
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

        matiere = db.query(Matiere).first()
        niveau = db.query(Niveau).first()
        annee = db.query(AnneeAcademique).filter(AnneeAcademique.is_current.is_(True)).first()
        if not matiere or not niveau or not annee:
            raise SystemExit("Référentiel incomplet (matière, niveau ou année courante manquants)")

        seance = (
            db.query(Seance)
            .filter(Seance.code.like("E2E-PRES-SEANCE%"))
            .first()
        )
        if not seance:
            created = seance_repository.create_with_verification(
                db,
                SeanceCreate(
                    code="E2E-PRES-SEANCE-001",
                    matiere_id=matiere.id,
                    niveau_id=niveau.id,
                    filiere_id=None,
                    enseignant_id=admin.id,
                    salle_id=salle.id,
                    creneau_id=creneau.id,
                    type_seance="cours",
                    date_seance=date(2026, 4, 14),
                    semestre=1,
                    annee_academique_id=annee.id,
                    duree_minutes=120,
                ),
            )
            if isinstance(created, dict):
                raise SystemExit(f"Impossible de créer la séance : {created}")
            seance = created
            seance.statut = "confirmee"
            db.commit()
            db.refresh(seance)

        pp("ÉTAPE 1 - Feuille d'appel", f"Séance #{seance.id}")
        feuille = presence_repository.get_feuille_appel_seance(db, seance.id)
        if feuille is None:
            raise SystemExit("Feuille d'appel introuvable")
        pp("Feuille d'appel", {"effectif": len(feuille), "premier": feuille[0] if feuille else None})

        if not feuille:
            etudiant = db.query(Etudiant).filter(Etudiant.is_active.is_(True)).first()
            if not etudiant:
                raise SystemExit("Aucun étudiant inscrit - feuille vide, test incomplet")
            pp("Attention", "Feuille vide - inscrivez un étudiant à la matière pour un test complet")
            return

        etudiant_id = feuille[0]["etudiant_id"]
        pp("ÉTAPE 2 - Bulk présence (présent)", f"Étudiant #{etudiant_id}")
        bulk = presence_repository.create_bulk(
            db,
            PresenceBulkCreate(
                seance_id=seance.id,
                presences=[PresenceItem(etudiant_id=etudiant_id, statut="present")],
            ),
            admin.id,
        )
        pp("Bulk OK", {"count": len(bulk), "statut": bulk[0].statut})

        pp("ÉTAPE 3 - Taux de présence étudiant", f"Étudiant #{etudiant_id}")
        stats = presence_repository.calculer_taux_presence_etudiant(
            db, etudiant_id, matiere_id=matiere.id
        )
        pp("Taux", stats)

        if stats["total_seances"] < 1:
            raise SystemExit("Échec : total_seances devrait être >= 1")

        print("\n" + "=" * 60)
        print("Test manuel présences terminé avec succès.")
        print("=" * 60)
    finally:
        db.close()


if __name__ == "__main__":
    main()
