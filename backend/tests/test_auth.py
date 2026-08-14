import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base
from app.api.dependencies import get_db

# Base de données de test en mémoire
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_database():
    """Crée les tables avant chaque test et les supprime après."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


class TestUserRegistration:
    """Tests pour l'inscription des utilisateurs."""

    def test_register_user_success(self):
        """Test de création d'un utilisateur avec succès."""
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

    def test_register_user_duplicate_email(self):
        """Test de création d'un utilisateur avec un email existant."""
        # Créer le premier utilisateur
        client.post(
            "/api/v1/auth/register",
            json={
                "email": "duplicate@example.com",
                "password": "testpassword123",
            },
        )
        # Tenter de créer un deuxième utilisateur avec le même email
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "duplicate@example.com",
                "password": "anotherpassword123",
            },
        )
        assert response.status_code == 400
        assert "existe déjà" in response.json()["detail"]

    def test_register_user_invalid_email(self):
        """Test de création d'un utilisateur avec un email invalide."""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "invalid-email",
                "password": "testpassword123",
            },
        )
        assert response.status_code == 422

    def test_register_user_short_password(self):
        """Test de création d'un utilisateur avec un mot de passe trop court."""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "short",
            },
        )
        assert response.status_code == 422


class TestUserLogin:
    """Tests pour la connexion des utilisateurs."""

    def test_login_success(self):
        """Test de connexion avec des identifiants valides."""
        # Créer un utilisateur
        client.post(
            "/api/v1/auth/register",
            json={
                "email": "login@example.com",
                "password": "testpassword123",
            },
        )
        # Se connecter
        response = client.post(
            "/api/v1/auth/login",
            data={
                "username": "login@example.com",
                "password": "testpassword123",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_invalid_email(self):
        """Test de connexion avec un email invalide."""
        response = client.post(
            "/api/v1/auth/login",
            data={
                "username": "nonexistent@example.com",
                "password": "testpassword123",
            },
        )
        assert response.status_code == 401
        assert "incorrect" in response.json()["detail"].lower()

    def test_login_invalid_password(self):
        """Test de connexion avec un mot de passe invalide."""
        # Créer un utilisateur
        client.post(
            "/api/v1/auth/register",
            json={
                "email": "wrongpass@example.com",
                "password": "correctpassword123",
            },
        )
        # Tenter de se connecter avec un mauvais mot de passe
        response = client.post(
            "/api/v1/auth/login",
            data={
                "username": "wrongpass@example.com",
                "password": "wrongpassword123",
            },
        )
        assert response.status_code == 401


class TestCurrentUser:
    """Tests pour la récupération du profil utilisateur."""

    def test_get_current_user_valid_token(self):
        """Test de récupération du profil avec un token valide."""
        # Créer et connecter un utilisateur
        client.post(
            "/api/v1/auth/register",
            json={
                "email": "profile@example.com",
                "password": "testpassword123",
                "full_name": "Profile User",
            },
        )
        login_response = client.post(
            "/api/v1/auth/login",
            data={
                "username": "profile@example.com",
                "password": "testpassword123",
            },
        )
        token = login_response.json()["access_token"]

        # Récupérer le profil
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "profile@example.com"
        assert data["full_name"] == "Profile User"

    def test_get_current_user_invalid_token(self):
        """Test de récupération du profil avec un token invalide."""
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid_token"},
        )
        assert response.status_code == 401

    def test_get_current_user_no_token(self):
        """Test de récupération du profil sans token."""
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 401


class TestUpdateProfile:
    """Tests pour la mise à jour du profil utilisateur."""

    def test_update_profile_success(self):
        """Test de mise à jour du profil avec succès."""
        # Créer et connecter un utilisateur
        client.post(
            "/api/v1/auth/register",
            json={
                "email": "update@example.com",
                "password": "testpassword123",
            },
        )
        login_response = client.post(
            "/api/v1/auth/login",
            data={
                "username": "update@example.com",
                "password": "testpassword123",
            },
        )
        token = login_response.json()["access_token"]

        # Mettre à jour le profil
        response = client.put(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
            json={"full_name": "Updated Name"},
        )
        assert response.status_code == 200
        assert response.json()["full_name"] == "Updated Name"
