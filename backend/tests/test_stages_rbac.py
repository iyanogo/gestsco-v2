"""Tests RBAC - endpoints stages et soutenances (admin/scolarité uniquement)."""

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
def enseignant_token(client: TestClient, db: Session) -> str:
    _create_user(db, "enseignant@test.com", "enseignant")
    return _login(client, "enseignant@test.com", "password123")


@pytest.fixture
def etudiant_token(client: TestClient, db: Session) -> str:
    _create_user(db, "etudiant@test.com", "etudiant")
    return _login(client, "etudiant@test.com", "password123")


@pytest.fixture
def scolarite_token(client: TestClient, db: Session) -> str:
    _create_user(db, "scolarite@test.com", "scolarite")
    return _login(client, "scolarite@test.com", "password123")


@pytest.fixture
def comptable_token(client: TestClient, db: Session) -> str:
    _create_user(db, "comptable@test.com", "comptable")
    return _login(client, "comptable@test.com", "password123")


FORBIDDEN_TOKENS = ("user_token", "enseignant_token", "etudiant_token", "comptable_token")
ALLOWED_TOKENS = ("admin_token", "scolarite_token")


class TestStagesRbac:
    def test_unauthenticated_get_stages_401(self, client: TestClient):
        assert client.get("/api/v1/stages/").status_code == 401

    @pytest.mark.parametrize("token_fixture", FORBIDDEN_TOKENS)
    def test_forbidden_roles_get_stages(self, client: TestClient, request, token_fixture: str):
        token = request.getfixturevalue(token_fixture)
        response = client.get(
            "/api/v1/stages/",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 403

    @pytest.mark.parametrize("token_fixture", ALLOWED_TOKENS)
    def test_allowed_roles_get_stages(self, client: TestClient, request, token_fixture: str):
        token = request.getfixturevalue(token_fixture)
        response = client.get(
            "/api/v1/stages/",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200


class TestSoutenancesRbac:
    def test_unauthenticated_get_soutenances_401(self, client: TestClient):
        assert client.get("/api/v1/soutenances/").status_code == 401

    def test_a_venir_not_captured_by_id_route(self, client: TestClient, admin_token: str):
        """GET /a-venir ne doit pas être interprété comme /{id} (422)."""
        response = client.get(
            "/api/v1/soutenances/a-venir",
            params={"jours": 14},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200, response.text

    @pytest.mark.parametrize("token_fixture", FORBIDDEN_TOKENS)
    def test_forbidden_roles_get_soutenances(self, client: TestClient, request, token_fixture: str):
        token = request.getfixturevalue(token_fixture)
        response = client.get(
            "/api/v1/soutenances/",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 403

    @pytest.mark.parametrize("token_fixture", ALLOWED_TOKENS)
    def test_allowed_roles_get_soutenances(self, client: TestClient, request, token_fixture: str):
        token = request.getfixturevalue(token_fixture)
        response = client.get(
            "/api/v1/soutenances/",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
