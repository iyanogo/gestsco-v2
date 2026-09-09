"""
Vérification E2E portail étudiant - préparation compte + collecte données de référence.

Usage (depuis backend/) :
  python scripts/e2e_portail_etudiant_verify.py setup     # crée User + backfill
  python scripts/e2e_portail_etudiant_verify.py inspect   # affiche données de référence
  python scripts/e2e_portail_etudiant_verify.py api       # parcours API post-login (token JWT)
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import date
from typing import Any

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault(
    "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/gestscov2"
)
os.environ.setdefault("SECRET_KEY", "dev-secret-e2e-portail")

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.security import get_password_hash
from app.models.etudiant import Etudiant
from app.models.user import User
from app.models.inscription import Inscription
from app.repositories import inscription_repository
from app.repositories.resultat_semestre_repository import resultat_semestre_repository
from app.repositories.resultat_matiere_repository import resultat_matiere_repository
from app.utils.etudiant_user_link import run_backfill

E2E_EMAIL = "e2e-manual@example.com"
E2E_PASSWORD = "E2E-Portail-2026!"
E2E_MATRICULE = "E2E-MANUAL-001"
API_BASE = os.environ.get("API_BASE", "http://127.0.0.1:8000")
SAMPLE_PREFIX = "PDF_PREVIEW_"


def _ensure_e2e_finances(db, etu) -> None:
    """Facture preview + compte étudiant pour E2E portail finances."""
    from decimal import Decimal

    from app.models.annee_academique import AnneeAcademique
    from app.models.compte_etudiant import CompteEtudiant
    from app.models.facture import Facture
    from app.models.ligne_facture import LigneFacture

    annee = db.query(AnneeAcademique).filter(AnneeAcademique.is_current.is_(True)).first()
    if not annee:
        annee = db.query(AnneeAcademique).filter(AnneeAcademique.code == "2025-2026").first()
    if not annee:
        return

    facture = (
        db.query(Facture)
        .filter(
            Facture.etudiant_id == etu.id,
            Facture.numero_facture.like(f"{SAMPLE_PREFIX}%"),
        )
        .first()
    )
    if not facture:
        facture = (
            db.query(Facture)
            .filter(Facture.numero_facture.like(f"{SAMPLE_PREFIX}%"))
            .first()
        )
        if facture:
            facture.etudiant_id = etu.id
            facture.annee_academique_id = annee.id
        else:
            facture = Facture(
                numero_facture=f"{SAMPLE_PREFIX}FAC-2026-00001",
                etudiant_id=etu.id,
                annee_academique_id=annee.id,
                date_emission=date(2026, 3, 1),
                date_echeance=date(2026, 3, 31),
                montant_total=Decimal("185000"),
                montant_paye=Decimal("50000"),
                montant_restant=Decimal("135000"),
                devise="XOF",
                statut="partiellement_payee",
                type_facture="scolarite",
                description="Frais de scolarité semestre 1",
            )
            db.add(facture)
            db.flush()
            for libelle, prix in [
                ("Frais d'inscription", 25000),
                ("Scolarité semestre 1", 150000),
                ("Assurance étudiante", 10000),
            ]:
                montant = Decimal(str(prix))
                db.add(
                    LigneFacture(
                        facture_id=facture.id,
                        libelle=libelle,
                        quantite=1,
                        prix_unitaire=montant,
                        montant_ligne=montant,
                        tva_taux=Decimal("0"),
                        tva_montant=Decimal("0"),
                        montant_ttc=montant,
                    )
                )

    compte = db.query(CompteEtudiant).filter(CompteEtudiant.etudiant_id == etu.id).first()
    if not compte:
        compte = CompteEtudiant(
            etudiant_id=etu.id,
            annee_academique_id=annee.id,
            total_facture=Decimal("185000"),
            total_paye=Decimal("50000"),
            total_restant=Decimal("135000"),
            solde_actuel=Decimal("-135000"),
            statut_compte="actif",
        )
        db.add(compte)
    else:
        compte.annee_academique_id = annee.id
        compte.total_facture = Decimal("185000")
        compte.total_paye = Decimal("50000")
        compte.total_restant = Decimal("135000")
        compte.solde_actuel = Decimal("-135000")
        compte.statut_compte = "actif"

    db.commit()
    pp(
        "FINANCES E2E",
        {
            "facture": facture.numero_facture if facture else None,
            "compte_etudiant": "OK",
            "montant_restant": "135000 XOF",
        },
    )


def pp(title: str, data: Any) -> None:
    print(f"\n{'=' * 60}")
    print(title)
    print("=" * 60)
    if isinstance(data, (dict, list)):
        print(json.dumps(data, indent=2, default=str, ensure_ascii=False))
    else:
        print(data)


def cmd_inspect(db) -> dict:
    etu = db.query(Etudiant).filter(Etudiant.matricule == E2E_MATRICULE).first()
    if not etu:
        etu = db.query(Etudiant).filter(Etudiant.email == E2E_EMAIL).first()
    if not etu:
        raise SystemExit(f"Étudiant {E2E_MATRICULE} / {E2E_EMAIL} introuvable. Lancez e2e_manual_test_resultats.py d'abord.")

    user = db.query(User).filter(User.email == E2E_EMAIL).first()

    insc = inscription_repository.get_current_inscription(db, etu.id)

    rs_rows = []
    rm_rows = []
    if insc:
        rs_list = (
            db.query(resultat_semestre_repository.model)
            .filter(resultat_semestre_repository.model.inscription_id == insc.id)
            .order_by(resultat_semestre_repository.model.semestre)
            .all()
        )
        for rs in rs_list:
            rs_rows.append(
                {
                    "semestre": rs.semestre,
                    "moyenne_generale": float(rs.moyenne_generale) if rs.moyenne_generale is not None else None,
                    "decision": rs.decision,
                    "statut": rs.statut,
                    "total_credits_obtenus": rs.total_credits_obtenus,
                    "total_credits_inscrits": rs.total_credits_inscrits,
                    "rang": rs.rang,
                }
            )
        from app.models.inscription_matiere import InscriptionMatiere
        from app.models.matiere import Matiere

        ims = db.query(InscriptionMatiere).filter(InscriptionMatiere.inscription_id == insc.id).all()
        for im in ims:
            rm = resultat_matiere_repository.get_by_inscription_matiere(db, im.id)
            mat = db.query(Matiere).filter(Matiere.id == im.matiere_id).first()
            if rm and mat:
                rm_rows.append(
                    {
                        "code": mat.code,
                        "moyenne_matiere": float(rm.moyenne_matiere) if rm.moyenne_matiere is not None else None,
                        "statut": rm.statut,
                        "decision": rm.decision,
                        "credit_obtenu": rm.credit_obtenu,
                    }
                )

    engine = db.get_bind()
    with engine.connect() as c:
        pres = c.execute(
            text("SELECT COUNT(*) AS n FROM presences WHERE etudiant_id = :eid"),
            {"eid": etu.id},
        ).scalar()
        fact = c.execute(
            text("SELECT COUNT(*) AS n FROM factures WHERE etudiant_id = :eid"),
            {"eid": etu.id},
        ).scalar()

    ref = {
        "etudiant": {
            "id": etu.id,
            "matricule": etu.matricule,
            "email": etu.email,
            "nom": etu.nom,
            "prenom": etu.prenom,
            "user_id": etu.user_id,
        },
        "user": {
            "id": user.id if user else None,
            "email": user.email if user else None,
            "role": user.role if user else None,
        },
        "inscription_active": {
            "id": insc.id,
            "annee_academique": insc.annee_academique,
            "filiere_id": insc.filiere_id,
            "niveau_id": insc.niveau_id,
            "statut_inscription": insc.statut_inscription,
        }
        if insc
        else None,
        "resultats_semestres": rs_rows,
        "resultats_matieres": rm_rows,
        "nb_presences": pres,
        "nb_factures": fact,
    }
    pp("DONNÉES DE RÉFÉRENCE (base dev)", ref)
    return ref


def cmd_setup(db) -> None:
    etu = db.query(Etudiant).filter(Etudiant.matricule == E2E_MATRICULE).first()
    if not etu:
        etu = db.query(Etudiant).filter(Etudiant.email == E2E_EMAIL).first()
    if not etu:
        raise SystemExit(
            f"Étudiant {E2E_MATRICULE} introuvable. Exécutez : python scripts/e2e_manual_test_resultats.py"
        )

    if etu.email != E2E_EMAIL:
        etu.email = E2E_EMAIL
        db.flush()

    user = db.query(User).filter(User.email == E2E_EMAIL).first()
    legacy_user = db.query(User).filter(User.email == "e2e-manual@test.local").first()
    if legacy_user and legacy_user.id != (user.id if user else -1):
        db.delete(legacy_user)
        db.flush()
    if not user:
        user = User(
            email=E2E_EMAIL,
            hashed_password=get_password_hash(E2E_PASSWORD),
            full_name=f"{etu.prenom} {etu.nom}",
            is_active=True,
            is_superuser=False,
            role="etudiant",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        pp("User créé", {"id": user.id, "email": user.email, "role": user.role})
    else:
        user.hashed_password = get_password_hash(E2E_PASSWORD)
        user.role = "etudiant"
        user.is_active = True
        db.commit()
        pp("User existant mis à jour (mot de passe réinitialisé)", {"id": user.id, "email": user.email})

    report = run_backfill(db, dry_run=False)
    report.print_summary(dry_run=False)
    db.refresh(etu)

    if not etu.user_id:
        raise SystemExit("ÉCHEC backfill : etudiant.user_id toujours NULL")

    # Migration legacy : codes année hors format YYYY-YYYY (seeds ORM anciens)
    from app.models.annee_academique import AnneeAcademique

    insc = inscription_repository.get_current_inscription(db, etu.id)
    if insc and insc.annee_academique == "E2E-MANUAL-2025":
        annee = (
            db.query(AnneeAcademique)
            .filter(AnneeAcademique.code == insc.annee_academique)
            .first()
        )
        if annee:
            annee.code = "2025-2026"
            annee.libelle = annee.libelle or "2025-2026"
        insc.annee_academique = "2025-2026"
        db.commit()

    _ensure_e2e_finances(db, etu)

    pp(
        "LIEN CONFIRMÉ",
        {
            "etudiant_id": etu.id,
            "matricule": etu.matricule,
            "user_id": etu.user_id,
            "login_email": E2E_EMAIL,
            "login_password": E2E_PASSWORD,
        },
    )


def cmd_api() -> None:
    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app)
    login = client.post(
        "/api/v1/auth/login",
        data={"username": E2E_EMAIL, "password": E2E_PASSWORD},
    )
    if login.status_code != 200:
        raise SystemExit(f"Login échoué : {login.status_code} {login.text}")
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    endpoints = [
        ("GET", "/api/v1/inscriptions/mes-profil"),
        ("GET", "/api/v1/inscriptions/mes-inscription/current"),
        ("GET", "/api/v1/resultats/mes-resultats"),
        ("GET", "/api/v1/presences/mes-presences/taux"),
        ("GET", "/api/v1/presences/mes-presences"),
        ("GET", "/api/v1/factures/mes-factures"),
        ("GET", "/api/v1/paiements-factures/mes-paiements"),
        ("GET", "/api/v1/comptes-etudiants/mon-compte"),
    ]

    results: dict[str, Any] = {"login": "OK", "token_type": login.json().get("token_type")}
    for method, path in endpoints:
        r = client.request(method, path, headers=headers)
        body: Any
        try:
            body = r.json()
        except Exception:
            body = r.text[:200]
        results[path] = {"status": r.status_code, "body": body}

    etu_id = results["/api/v1/inscriptions/mes-profil"]["body"]["etudiant"]["id"]
    # Utiliser un autre étudiant réel (E2E-COMP-001 id=3) pour tester le 403, pas un ID inexistant
    other_id = 3 if etu_id != 3 else 2
    neg = client.get(
        f"/api/v1/resultats/semestres/etudiant/{other_id}",
        headers=headers,
    )
    results["negative_test"] = {
        "path": f"/api/v1/resultats/semestres/etudiant/{other_id}",
        "status": neg.status_code,
        "expected": 403,
    }

    pp("PARCOURS API POST-LOGIN", results)

    if neg.status_code != 403:
        raise SystemExit(f"ÉCHEC test négatif : attendu 403, obtenu {neg.status_code}")


def main() -> int:
    parser = argparse.ArgumentParser(description="E2E portail étudiant")
    parser.add_argument("command", choices=["setup", "inspect", "api"])
    args = parser.parse_args()

    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    try:
        if args.command == "setup":
            cmd_setup(db)
            cmd_inspect(db)
        elif args.command == "inspect":
            cmd_inspect(db)
        elif args.command == "api":
            cmd_api()
    finally:
        db.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
