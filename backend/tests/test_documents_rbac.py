"""RBAC documents administratifs étudiants."""

from datetime import date

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.etudiant import Etudiant
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
def documents_rbac_context(db: Session) -> dict:
    etudiant_user = User(
        email="etudiant.doc@test.com",
        hashed_password=get_password_hash("password123"),
        full_name="Étudiant Doc",
        is_active=True,
        is_superuser=False,
        role="etudiant",
    )
    other_user = User(
        email="other.doc@test.com",
        hashed_password=get_password_hash("password123"),
        full_name="Autre Étudiant",
        is_active=True,
        is_superuser=False,
        role="etudiant",
    )
    db.add_all([etudiant_user, other_user])
    db.flush()

    etudiant = Etudiant(
        id=next_id(),
        user_id=etudiant_user.id,
        matricule="ETU-DOC-A",
        nom="DOC",
        prenom="Test",
        email=etudiant_user.email,
        is_active=True,
    )
    other = Etudiant(
        id=next_id(),
        user_id=other_user.id,
        matricule="ETU-DOC-B",
        nom="AUTRE",
        prenom="Test",
        email=other_user.email,
        is_active=True,
    )
    db.add_all([etudiant, other])
    db.commit()
    return {"etudiant": etudiant, "other": other}


@pytest.fixture
def token_etudiant_doc(client: TestClient, documents_rbac_context: dict) -> str:
    return _login(client, "etudiant.doc@test.com")


class TestDocumentsRbac:
    def test_etudiant_cannot_list_all_documents(
        self, client: TestClient, token_etudiant_doc: str
    ):
        response = client.get(
            "/api/v1/documents-etudiant/",
            headers={"Authorization": f"Bearer {token_etudiant_doc}"},
        )
        assert response.status_code == 403

    def test_etudiant_can_read_mes_documents(
        self, client: TestClient, token_etudiant_doc: str
    ):
        response = client.get(
            "/api/v1/documents-etudiant/mes-documents",
            headers={"Authorization": f"Bearer {token_etudiant_doc}"},
        )
        assert response.status_code == 200, response.text
        assert isinstance(response.json(), list)

    def test_etudiant_can_create_own_document(
        self,
        client: TestClient,
        token_etudiant_doc: str,
        documents_rbac_context: dict,
    ):
        etu_id = documents_rbac_context["etudiant"].id
        response = client.post(
            "/api/v1/documents-etudiant/",
            json={
                "etudiant_id": etu_id,
                "type_document": "Acte de naissance",
                "libelle": "Acte test",
                "statut": "en_attente",
            },
            headers={"Authorization": f"Bearer {token_etudiant_doc}"},
        )
        assert response.status_code == 201, response.text

    def test_etudiant_cannot_create_document_for_other(
        self,
        client: TestClient,
        token_etudiant_doc: str,
        documents_rbac_context: dict,
    ):
        other_id = documents_rbac_context["other"].id
        response = client.post(
            "/api/v1/documents-etudiant/",
            json={
                "etudiant_id": other_id,
                "type_document": "Photo",
                "libelle": "Photo test",
                "statut": "en_attente",
            },
            headers={"Authorization": f"Bearer {token_etudiant_doc}"},
        )
        assert response.status_code == 403

    def test_etudiant_cannot_read_other_etudiant_documents(
        self,
        client: TestClient,
        token_etudiant_doc: str,
        documents_rbac_context: dict,
    ):
        other_id = documents_rbac_context["other"].id
        response = client.get(
            f"/api/v1/documents-etudiant/etudiant/{other_id}",
            headers={"Authorization": f"Bearer {token_etudiant_doc}"},
        )
        assert response.status_code == 403

    def test_admin_can_list_all_documents(
        self, client: TestClient, admin_token: str
    ):
        response = client.get(
            "/api/v1/documents-etudiant/",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200, response.text
