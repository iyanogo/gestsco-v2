"""Tests d'authentification API."""


class TestUserRegistration:
    def test_register_user_success(self, client):
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "testpassword123",
                "full_name": "Test User",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["full_name"] == "Test User"
        assert "id" in data
        assert "hashed_password" not in data

    def test_register_user_duplicate_email(self, client):
        client.post(
            "/api/v1/auth/register",
            json={
                "email": "duplicate@example.com",
                "password": "testpassword123",
            },
        )
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "duplicate@example.com",
                "password": "anotherpassword123",
            },
        )
        assert response.status_code == 400

    def test_register_user_invalid_email(self, client):
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "invalid-email",
                "password": "testpassword123",
            },
        )
        assert response.status_code == 422

    def test_register_user_short_password(self, client):
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "short@example.com",
                "password": "short",
            },
        )
        assert response.status_code == 422


class TestUserLogin:
    def test_login_success(self, client, admin_user):
        response = client.post(
            "/api/v1/auth/login",
            data={"username": "admin@test.com", "password": "adminpassword123"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_invalid_email(self, client):
        response = client.post(
            "/api/v1/auth/login",
            data={"username": "nonexistent@example.com", "password": "password123"},
        )
        assert response.status_code == 401

    def test_login_invalid_password(self, client, admin_user):
        response = client.post(
            "/api/v1/auth/login",
            data={"username": "admin@test.com", "password": "wrongpassword"},
        )
        assert response.status_code == 401

    def test_login_local_domain_email(self, client, db):
        from app.core.security import get_password_hash
        from app.models.user import User

        user = User(
            email="etudiant@test.local",
            hashed_password=get_password_hash("password123"),
            role="etudiant",
            is_active=True,
        )
        db.add(user)
        db.commit()

        response = client.post(
            "/api/v1/auth/login",
            data={"username": "etudiant@test.local", "password": "password123"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

        me = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {data['access_token']}"},
        )
        assert me.status_code == 200
        assert me.json()["email"] == "etudiant@test.local"

    def test_register_local_domain_email(self, client):
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "nouveau@test.local",
                "password": "testpassword123",
                "full_name": "Local User",
            },
        )
        assert response.status_code == 201
        assert response.json()["email"] == "nouveau@test.local"


class TestCurrentUser:
    def test_get_current_user_valid_token(self, client, admin_token):
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "admin@test.com"

    def test_get_current_user_invalid_token(self, client):
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid-token"},
        )
        assert response.status_code == 401

    def test_get_current_user_no_token(self, client):
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 401


class TestPermissionsMatrix:
    def test_permissions_matrix_requires_auth(self, client):
        response = client.get("/api/v1/auth/permissions-matrix")
        assert response.status_code == 401

    def test_permissions_matrix_returns_rows(self, client, admin_token):
        response = client.get(
            "/api/v1/auth/permissions-matrix",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        rows = response.json()
        assert isinstance(rows, list)
        assert len(rows) > 0
        first = rows[0]
        assert "module" in first
        assert "action" in first
        assert "roles" in first


class TestUpdateProfile:
    def test_update_profile_success(self, client, admin_token):
        response = client.put(
            "/api/v1/auth/me",
            json={"full_name": "Updated Name"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        assert response.json()["full_name"] == "Updated Name"
