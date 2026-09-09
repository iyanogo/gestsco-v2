"""Tests RBAC - référentiel emploi du temps (bâtiments, salles, créneaux)."""

import uuid

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


@pytest.fixture
def scolarite_token(client: TestClient, db: Session) -> str:
    _create_user(db, "scolarite-edt@test.com", "scolarite")
    return _login(client, "scolarite-edt@test.com", "password123")


CRENEAU_PAYLOAD = {
    "code": "T-RBAC",
    "libelle": "Test RBAC 08h-10h",
    "heure_debut": "08:00:00",
    "heure_fin": "10:00:00",
    "periode": "matin",
    "ordre": 99,
}


class TestCreneauxRbac:
    def test_unauthenticated_get_creneaux_401(self, client: TestClient):
        assert client.get("/api/v1/creneaux-horaires/").status_code == 401

    def test_scolarite_can_read_creneaux(self, client: TestClient, scolarite_token: str):
        response = client.get(
            "/api/v1/creneaux-horaires/",
            headers={"Authorization": f"Bearer {scolarite_token}"},
        )
        assert response.status_code == 200

    def test_scolarite_cannot_create_creneau(self, client: TestClient, scolarite_token: str):
        response = client.post(
            "/api/v1/creneaux-horaires/",
            json=CRENEAU_PAYLOAD,
            headers={"Authorization": f"Bearer {scolarite_token}"},
        )
        assert response.status_code == 403

    def test_scolarite_cannot_update_creneau(self, client: TestClient, scolarite_token: str):
        response = client.put(
            "/api/v1/creneaux-horaires/1",
            json={"libelle": "Modifié"},
            headers={"Authorization": f"Bearer {scolarite_token}"},
        )
        assert response.status_code in (403, 404)

    def test_superuser_can_create_creneau(self, client: TestClient, admin_token: str):
        code = f"T-{uuid.uuid4().hex[:8].upper()}"
        payload = {**CRENEAU_PAYLOAD, "code": code, "ordre": 97}
        response = client.post(
            "/api/v1/creneaux-horaires/",
            json=payload,
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["code"] == code
        delete_resp = client.delete(
            f"/api/v1/creneaux-horaires/{data['id']}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert delete_resp.status_code == 204


class TestSallesRbac:
    def test_scolarite_can_read_salles(self, client: TestClient, scolarite_token: str):
        response = client.get(
            "/api/v1/salles/",
            headers={"Authorization": f"Bearer {scolarite_token}"},
        )
        assert response.status_code == 200

    def test_non_scolarite_cannot_create_salle(self, client: TestClient, user_token: str):
        response = client.post(
            "/api/v1/salles/",
            json={
                "code": "X",
                "libelle": "Test",
                "batiment_id": 1,
                "type_salle": "cours",
                "capacite": 10,
            },
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert response.status_code == 403
