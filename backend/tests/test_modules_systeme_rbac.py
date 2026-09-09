"""Tests RBAC - modules système (lecture auth, activation admin/superuser)."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.module_systeme import ModuleSysteme
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
def sample_module(db: Session) -> ModuleSysteme:
    module = ModuleSysteme(
        code="TEST_MOD_RBAC",
        libelle="Module test RBAC",
        ordre=999,
        est_obligatoire=False,
        is_active=True,
    )
    db.add(module)
    db.commit()
    db.refresh(module)
    return module


@pytest.fixture
def enseignant_token(client: TestClient, db: Session) -> str:
    _create_user(db, "enseignant-mod@test.com", "enseignant")
    return _login(client, "enseignant-mod@test.com", "password123")


@pytest.fixture
def admin_role_token(client: TestClient, db: Session) -> str:
    user = User(
        email="admin-role-mod@test.com",
        hashed_password=get_password_hash("password123"),
        full_name="Admin role",
        is_active=True,
        is_superuser=False,
        role="admin",
    )
    db.add(user)
    db.commit()
    return _login(client, "admin-role-mod@test.com", "password123")


class TestModulesSystemeRbac:
    def test_unauthenticated_list_401(self, client: TestClient):
        assert client.get("/api/v1/modules-systeme/").status_code == 401

    def test_authenticated_can_list_modules(self, client: TestClient, user_token: str):
        response = client.get(
            "/api/v1/modules-systeme/",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert response.status_code == 200

    def test_enseignant_cannot_activate_module(
        self, client: TestClient, enseignant_token: str, sample_module: ModuleSysteme
    ):
        response = client.post(
            f"/api/v1/modules-systeme/{sample_module.code}/activer",
            json={},
            headers={"Authorization": f"Bearer {enseignant_token}"},
        )
        assert response.status_code == 403

    def test_admin_role_can_activate_module(
        self, client: TestClient, admin_role_token: str, sample_module: ModuleSysteme
    ):
        response = client.post(
            f"/api/v1/modules-systeme/{sample_module.code}/activer",
            json={},
            headers={"Authorization": f"Bearer {admin_role_token}"},
        )
        assert response.status_code == 200, response.text

    def test_superuser_can_activate_module(
        self, client: TestClient, admin_token: str, sample_module: ModuleSysteme
    ):
        response = client.post(
            f"/api/v1/modules-systeme/{sample_module.code}/activer",
            json={},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200, response.text

    def test_enseignant_cannot_desactivate_module(
        self, client: TestClient, enseignant_token: str, admin_token: str, sample_module: ModuleSysteme
    ):
        client.post(
            f"/api/v1/modules-systeme/{sample_module.code}/activer",
            json={},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        response = client.post(
            f"/api/v1/modules-systeme/{sample_module.code}/desactiver",
            json={},
            headers={"Authorization": f"Bearer {enseignant_token}"},
        )
        assert response.status_code == 403
