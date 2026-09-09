"""Tests RBAC - gestion utilisateurs (superuser uniquement)."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import get_password_hash, verify_password
from app.models.user import User
from app.repositories.user_repository import UserRepository


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


USER_CREATE_PAYLOAD = {
    "email": "new.user@test.com",
    "password": "securepass123",
    "full_name": "New User",
    "role": "enseignant",
    "is_active": True,
    "is_superuser": False,
}


@pytest.fixture
def scolarite_token(client: TestClient, db: Session) -> str:
    _create_user(db, "scolarite-users@test.com", "scolarite")
    return _login(client, "scolarite-users@test.com", "password123")


class TestUsersRbac:
    def test_unauthenticated_list_users_401(self, client: TestClient):
        assert client.get("/api/v1/users/").status_code == 401

    def test_non_superuser_cannot_list_users(self, client: TestClient, user_token: str):
        response = client.get(
            "/api/v1/users/",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert response.status_code == 403

    def test_scolarite_cannot_list_users(self, client: TestClient, scolarite_token: str):
        response = client.get(
            "/api/v1/users/",
            headers={"Authorization": f"Bearer {scolarite_token}"},
        )
        assert response.status_code == 403

    def test_superuser_can_list_users(self, client: TestClient, admin_token: str):
        response = client.get(
            "/api/v1/users/",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_non_superuser_cannot_create_user(self, client: TestClient, user_token: str):
        response = client.post(
            "/api/v1/users/",
            json=USER_CREATE_PAYLOAD,
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert response.status_code == 403

    def test_superuser_can_create_user(self, client: TestClient, admin_token: str):
        response = client.post(
            "/api/v1/users/",
            json=USER_CREATE_PAYLOAD,
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 201, response.text
        assert response.json()["email"] == USER_CREATE_PAYLOAD["email"]

    def test_superuser_can_change_password(self, client: TestClient, admin_token: str, db: Session):
        create_resp = client.post(
            "/api/v1/users/",
            json={
                **USER_CREATE_PAYLOAD,
                "email": "pwd.change@test.com",
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert create_resp.status_code == 201
        user_id = create_resp.json()["id"]

        new_password = "NewSecurePass99"
        update_resp = client.put(
            f"/api/v1/users/{user_id}",
            json={"password": new_password},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert update_resp.status_code == 200

        user = UserRepository.get_by_id(db, user_id)
        assert user is not None
        assert verify_password(new_password, user.hashed_password)

        login_resp = client.post(
            "/api/v1/auth/login",
            data={"username": "pwd.change@test.com", "password": new_password},
        )
        assert login_resp.status_code == 200

    def test_cannot_remove_last_superuser_flag(
        self, client: TestClient, admin_token: str, admin_user: User
    ):
        response = client.put(
            f"/api/v1/users/{admin_user.id}",
            json={"is_superuser": False},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 400
        assert "dernier super-utilisateur" in response.json()["detail"].lower()

    def test_superuser_cannot_delete_self(self, client: TestClient, admin_token: str, admin_user: User):
        response = client.delete(
            f"/api/v1/users/{admin_user.id}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 400

    def test_scolarite_can_list_users_for_select(
        self, client: TestClient, scolarite_token: str, db: Session
    ):
        _create_user(db, "select.teacher@test.com", "enseignant")
        response = client.get(
            "/api/v1/users/select",
            headers={"Authorization": f"Bearer {scolarite_token}"},
        )
        assert response.status_code == 200
        body = response.json()
        assert isinstance(body, list)
        assert all(u["role"] in ("enseignant", "teacher", "admin", "administrateur", "scolarite") for u in body)

    def test_enseignant_cannot_list_users_for_select(
        self, client: TestClient, db: Session
    ):
        _create_user(db, "teacher.select@test.com", "enseignant", "password123")
        token = _login(client, "teacher.select@test.com", "password123")
        response = client.get(
            "/api/v1/users/select",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 403

    def test_non_superuser_cannot_delete_user(
        self, client: TestClient, user_token: str, admin_token: str
    ):
        create_resp = client.post(
            "/api/v1/users/",
            json={**USER_CREATE_PAYLOAD, "email": "delete.target@test.com"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        user_id = create_resp.json()["id"]

        response = client.delete(
            f"/api/v1/users/{user_id}",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert response.status_code == 403
