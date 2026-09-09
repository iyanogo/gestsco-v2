"""
Test manuel finances - factures, paiement, compte (dev PostgreSQL).

Usage (depuis backend/) :
  python scripts/e2e_manual_test_finances.py
"""
from __future__ import annotations

import json
import os
import sys
from datetime import date
from decimal import Decimal

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault(
    "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/gestscov2"
)
os.environ.setdefault("SECRET_KEY", "dev-secret-e2e")

from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine

from app.core.config import settings
from app.models.annee_academique import AnneeAcademique
from app.models.etudiant import Etudiant
from app.models.user import User
from app.repositories.compte_etudiant_repository import compte_etudiant_repository
from app.repositories.facture_repository import facture_repository
from app.repositories.paiement_facture_repository import paiement_facture_repository
from app.schemas.paiement_facture import PaiementFactureCreate


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
            raise SystemExit("Aucun superuser en base")

        etudiant = db.query(Etudiant).filter(Etudiant.is_active.is_(True)).first()
        if not etudiant:
            raise SystemExit("Aucun étudiant en base")

        annee = db.query(AnneeAcademique).filter(AnneeAcademique.is_current.is_(True)).first()
        if not annee:
            annee = db.query(AnneeAcademique).first()
        if not annee:
            raise SystemExit("Aucune année académique en base")

        pp("ÉTAPE 1 - Factures étudiant", f"Étudiant #{etudiant.id}")
        factures = facture_repository.get_by_etudiant(db, etudiant.id, annee.id)
        pp("Factures", {"count": len(factures), "numeros": [f.numero_facture for f in factures[:5]]})

        if not factures:
            pp("Attention", "Aucune facture - lancez generate_pdf_preview_samples.py ou e2e_portail setup")
            return

        facture = factures[0]
        pp("ÉTAPE 2 - Enregistrement paiement test", facture.numero_facture)
        paiement = paiement_facture_repository.create_paiement(
            db,
            PaiementFactureCreate(
                facture_id=facture.id,
                etudiant_id=etudiant.id,
                montant=Decimal("10000"),
                mode_paiement="especes",
                observations="Test manuel e2e_manual_test_finances",
            ),
            admin.id,
        )
        pp("Paiement créé", {"id": paiement.id, "statut": paiement.statut, "montant": str(paiement.montant)})

        pp("ÉTAPE 3 - Compte étudiant", f"Année #{annee.id}")
        compte = compte_etudiant_repository.get_or_create(db, etudiant.id, annee.id)
        pp(
            "Compte",
            {
                "total_facture": float(compte.total_facture or 0),
                "total_paye": float(compte.total_paye or 0),
                "total_restant": float(compte.total_restant or 0),
                "statut": compte.statut_compte,
            },
        )

        print("\n" + "=" * 60)
        print("Test manuel finances terminé avec succès.")
        print("=" * 60)
    finally:
        db.close()


if __name__ == "__main__":
    main()
