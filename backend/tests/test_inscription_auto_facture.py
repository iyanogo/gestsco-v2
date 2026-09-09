"""Tests génération auto facture à la validation d'inscription."""

from datetime import date
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.annee_academique import AnneeAcademique
from app.models.compte_etudiant import CompteEtudiant
from app.models.etudiant import Etudiant
from app.models.facture import Facture
from app.models.frais_scolarite import FraisScolarite
from app.models.inscription import Inscription
from app.models.type_frais import TypeFrais
from app.models.user import User
from app.repositories.compte_etudiant_repository import compte_etudiant_repository
from tests.conftest import next_id


@pytest.fixture
def auto_facture_context(db: Session) -> dict:
    scolarite = User(
        email="scolarite.autofact@test.com",
        hashed_password=get_password_hash("password123"),
        full_name="Scolarité Auto",
        is_active=True,
        is_superuser=False,
        role="scolarite",
    )
    db.add(scolarite)
    db.flush()

    etudiant = Etudiant(
        id=next_id(),
        matricule="ETU-AUTO-FAC",
        nom="AUTO",
        prenom="Facture",
        email="auto.facture@test.com",
        is_active=True,
    )
    annee = AnneeAcademique(
        id=next_id(),
        code="2026-2027",
        libelle="2026-2027",
        date_debut=date(2026, 9, 1),
        date_fin=date(2027, 8, 31),
        date_debut_inscriptions=date(2026, 6, 1),
        date_fin_inscriptions=date(2026, 10, 31),
        statut="en_cours",
        is_active=True,
        is_current=True,
    )
    db.add_all([etudiant, annee])
    db.flush()

    niveau_id = next_id()
    filiere_id = next_id()

    type_frais = TypeFrais(
        code="INS-AF",
        libelle="Frais inscription auto",
        categorie="inscription",
        montant_defaut=Decimal("50000"),
        est_obligatoire=True,
        is_active=True,
    )
    db.add(type_frais)
    db.flush()

    frais = FraisScolarite(
        type_frais_id=type_frais.id,
        niveau_id=niveau_id,
        filiere_id=filiere_id,
        annee_academique_id=annee.id,
        montant=Decimal("50000"),
        date_debut_validite=date(2026, 1, 1),
        date_fin_validite=date(2027, 12, 31),
        is_active=True,
    )
    inscription = Inscription(
        id=next_id(),
        etudiant_id=etudiant.id,
        filiere_id=filiere_id,
        niveau_id=niveau_id,
        annee_academique=annee.code,
        type_inscription="nouvelle",
        statut_inscription="en_cours",
        is_active=True,
    )
    db.add_all([frais, inscription])
    db.commit()
    db.refresh(inscription)

    return {
        "scolarite": scolarite,
        "inscription": inscription,
        "annee": annee,
        "etudiant": etudiant,
    }


def _login(client: TestClient, email: str) -> str:
    resp = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": "password123"},
    )
    assert resp.status_code == 200
    return resp.json()["access_token"]


class TestInscriptionAutoFacture:
    def test_valider_inscription_generates_facture(
        self, client: TestClient, auto_facture_context: dict
    ):
        ctx = auto_facture_context
        token = _login(client, ctx["scolarite"].email)
        resp = client.patch(
            f"/api/v1/inscriptions/{ctx['inscription'].id}/valider",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200, resp.text

        factures = (
            client.get(
                "/api/v1/factures/",
                params={"etudiant_id": ctx["etudiant"].id},
                headers={"Authorization": f"Bearer {token}"},
            )
            .json()
        )
        assert len(factures) >= 1
        assert any(f["type_facture"] == "inscription" for f in factures)

    def test_valider_inscription_writes_audit(
        self,
        client: TestClient,
        auto_facture_context: dict,
        admin_token: str,
    ):
        ctx = auto_facture_context
        token = _login(client, ctx["scolarite"].email)
        inscription_id = ctx["inscription"].id
        resp = client.patch(
            f"/api/v1/inscriptions/{inscription_id}/valider",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200, resp.text

        audit = client.get(
            "/api/v1/administration/audit",
            params={"entity_type": "inscription", "action": "validate"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert audit.status_code == 200
        assert any(
            item["entity_id"] == str(inscription_id) and item["action"] == "validate"
            for item in audit.json()
        )

    def test_compte_etudiant_multi_annee(
        self, db: Session, auto_facture_context: dict
    ):
        ctx = auto_facture_context
        annee2 = AnneeAcademique(
            id=next_id(),
        code="2027-2028",
        libelle="2027-2028",
            date_debut=date(2027, 9, 1),
            date_fin=date(2028, 8, 31),
            date_debut_inscriptions=date(2027, 6, 1),
            date_fin_inscriptions=date(2027, 10, 31),
            statut="en_cours",
            is_active=True,
        )
        db.add(annee2)
        db.commit()

        compte_etudiant_repository.get_or_create(db, ctx["etudiant"].id, ctx["annee"].id)
        compte_etudiant_repository.get_or_create(db, ctx["etudiant"].id, annee2.id)

        comptes = (
            db.query(CompteEtudiant)
            .filter(CompteEtudiant.etudiant_id == ctx["etudiant"].id)
            .all()
        )
        assert len(comptes) == 2
