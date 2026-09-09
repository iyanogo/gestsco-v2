"""RBAC module finances - listes globales et saisie paiement."""

from datetime import date
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.annee_academique import AnneeAcademique
from app.models.etudiant import Etudiant
from app.models.facture import Facture
from app.models.user import User
from tests.conftest import next_id


def _login(client: TestClient, email: str, password: str = "password123") -> str:
    response = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password},
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


@pytest.fixture
def finances_rbac_context(db: Session) -> dict:
    etudiant_user = User(
        email="etudiant.finance@test.com",
        hashed_password=get_password_hash("password123"),
        full_name="Étudiant Finance",
        is_active=True,
        is_superuser=False,
        role="etudiant",
    )
    comptable = User(
        email="comptable.finance@test.com",
        hashed_password=get_password_hash("password123"),
        full_name="Comptable Test",
        is_active=True,
        is_superuser=False,
        role="comptable",
    )
    db.add_all([etudiant_user, comptable])
    db.flush()

    etudiant = Etudiant(
        id=next_id(),
        user_id=etudiant_user.id,
        matricule="ETU-FIN-RBAC",
        nom="FINANCE",
        prenom="Test",
        email=etudiant_user.email,
        is_active=True,
    )
    annee = AnneeAcademique(
        id=next_id(),
        code="2025-2026-FIN",
        libelle="2025-2026 FIN",
        date_debut=date(2025, 9, 1),
        date_fin=date(2026, 8, 31),
        date_debut_inscriptions=date(2025, 6, 1),
        date_fin_inscriptions=date(2025, 10, 31),
        statut="en_cours",
        is_active=True,
        is_current=True,
    )
    db.add_all([etudiant, annee])
    db.flush()

    facture = Facture(
        numero_facture="FAC-FIN-RBAC-001",
        etudiant_id=etudiant.id,
        annee_academique_id=annee.id,
        date_emission=date(2026, 3, 1),
        date_echeance=date(2026, 3, 31),
        montant_total=Decimal("100000"),
        montant_paye=Decimal("0"),
        montant_restant=Decimal("100000"),
        devise="XOF",
        statut="en_attente",
        type_facture="scolarite",
    )
    db.add(facture)
    db.commit()
    db.refresh(facture)

    return {
        "etudiant": etudiant,
        "facture": facture,
        "comptable": comptable,
    }


@pytest.fixture
def token_etudiant_finance(client: TestClient, finances_rbac_context: dict) -> str:
    return _login(client, "etudiant.finance@test.com")


@pytest.fixture
def token_comptable_finance(client: TestClient, finances_rbac_context: dict) -> str:
    return _login(client, "comptable.finance@test.com")


class TestFinancesRbac:
    def test_etudiant_cannot_list_all_factures(
        self, client: TestClient, token_etudiant_finance: str
    ):
        response = client.get(
            "/api/v1/factures/",
            headers={"Authorization": f"Bearer {token_etudiant_finance}"},
        )
        assert response.status_code == 403

    def test_etudiant_cannot_list_all_paiements(
        self, client: TestClient, token_etudiant_finance: str
    ):
        response = client.get(
            "/api/v1/paiements-factures/",
            headers={"Authorization": f"Bearer {token_etudiant_finance}"},
        )
        assert response.status_code == 403

    def test_etudiant_can_read_mes_factures(
        self, client: TestClient, token_etudiant_finance: str, finances_rbac_context: dict
    ):
        response = client.get(
            "/api/v1/factures/mes-factures",
            headers={"Authorization": f"Bearer {token_etudiant_finance}"},
        )
        assert response.status_code == 200, response.text
        body = response.json()
        assert len(body) == 1
        assert body[0]["numero_facture"] == "FAC-FIN-RBAC-001"

    def test_etudiant_cannot_create_paiement(
        self,
        client: TestClient,
        token_etudiant_finance: str,
        finances_rbac_context: dict,
    ):
        ctx = finances_rbac_context
        response = client.post(
            "/api/v1/paiements-factures/",
            json={
                "facture_id": ctx["facture"].id,
                "etudiant_id": ctx["etudiant"].id,
                "montant": 50000,
                "mode_paiement": "especes",
            },
            headers={"Authorization": f"Bearer {token_etudiant_finance}"},
        )
        assert response.status_code == 403

    def test_comptable_can_list_factures(
        self, client: TestClient, token_comptable_finance: str
    ):
        response = client.get(
            "/api/v1/factures/",
            headers={"Authorization": f"Bearer {token_comptable_finance}"},
        )
        assert response.status_code == 200, response.text
        assert isinstance(response.json(), list)

    def test_comptable_can_create_paiement(
        self,
        client: TestClient,
        token_comptable_finance: str,
        finances_rbac_context: dict,
    ):
        ctx = finances_rbac_context
        response = client.post(
            "/api/v1/paiements-factures/",
            json={
                "facture_id": ctx["facture"].id,
                "etudiant_id": ctx["etudiant"].id,
                "montant": 25000,
                "mode_paiement": "especes",
            },
            headers={"Authorization": f"Bearer {token_comptable_finance}"},
        )
        assert response.status_code == 201, response.text

    def test_etudiant_can_read_own_facture_by_id(
        self,
        client: TestClient,
        token_etudiant_finance: str,
        finances_rbac_context: dict,
    ):
        facture_id = finances_rbac_context["facture"].id
        response = client.get(
            f"/api/v1/factures/{facture_id}",
            headers={"Authorization": f"Bearer {token_etudiant_finance}"},
        )
        assert response.status_code == 200, response.text
