"""Tests RBAC - années scolaires (écriture superuser)."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.user import User


def _login(client: TestClient, email: str, password: str) -> str:
    response = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password},
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


def _create_user(db: Session, email: str, role: str, password: str = "password123") -> User:
    user = User(
        email=email,
        hashed_password=get_password_hash(password),
        full_name=f"Test {role}",
        is_active=True,
        is_superuser=False,
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


ANNEE_PAYLOAD = {
    "code": "2099-2100",
    "libelle": "Année test RBAC",
    "statut": False,
    "etat": "preparation",
    "lier_enseignement": False,
}


@pytest.fixture
def admin_scolaire_token(client: TestClient, db: Session) -> str:
    _create_user(db, "admin-scol@test.com", "admin")
    return _login(client, "admin-scol@test.com", "password123")


class TestAnneesScolairesRbac:
    def test_unauthenticated_list_401(self, client: TestClient):
        assert client.get("/api/v1/annees-scolaires/").status_code == 401

    def test_authenticated_can_read(self, client: TestClient, user_token: str):
        response = client.get(
            "/api/v1/annees-scolaires/",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert response.status_code == 200

    def test_non_superuser_cannot_create(self, client: TestClient, user_token: str):
        response = client.post(
            "/api/v1/annees-scolaires/",
            json=ANNEE_PAYLOAD,
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert response.status_code == 403

    def test_admin_non_superuser_cannot_create(
        self, client: TestClient, admin_scolaire_token: str
    ):
        response = client.post(
            "/api/v1/annees-scolaires/",
            json=ANNEE_PAYLOAD,
            headers={"Authorization": f"Bearer {admin_scolaire_token}"},
        )
        assert response.status_code == 403

    def test_superuser_can_create(self, client: TestClient, admin_token: str):
        response = client.post(
            "/api/v1/annees-scolaires/",
            json=ANNEE_PAYLOAD,
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["code"] == ANNEE_PAYLOAD["code"]

    def test_non_superuser_cannot_activate(self, client: TestClient, admin_token: str, user_token: str):
        create_resp = client.post(
            "/api/v1/annees-scolaires/",
            json={**ANNEE_PAYLOAD, "code": "2098-2099"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert create_resp.status_code == 201
        annee_id = create_resp.json()["id"]

        response = client.put(
            f"/api/v1/annees-scolaires/{annee_id}/activate",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert response.status_code == 403

    def test_superuser_can_activate(self, client: TestClient, admin_token: str):
        create_resp = client.post(
            "/api/v1/annees-scolaires/",
            json={**ANNEE_PAYLOAD, "code": "2097-2098"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert create_resp.status_code == 201
        annee_id = create_resp.json()["id"]

        response = client.put(
            f"/api/v1/annees-scolaires/{annee_id}/activate",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        assert response.json()["statut"] is True
