"""
Tests d'intégration pour les endpoints API des universités.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base
from app.core.security import get_password_hash
from app.main import app
from app.api.deps import get_db
from app.models import User, Universite

# Base de données de test en mémoire
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Override de la dépendance get_db pour les tests."""
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


@pytest.fixture
def db():
    """Fournit une session de base de données pour les tests."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def admin_user(db):
    """Crée un utilisateur administrateur pour les tests."""
    user = User(
        email="admin@test.com",
        hashed_password=get_password_hash("adminpassword123"),
        full_name="Admin Test",
        is_active=True,
        is_superuser=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def normal_user(db):
    """Crée un utilisateur normal pour les tests."""
    user = User(
        email="user@test.com",
        hashed_password=get_password_hash("userpassword123"),
        full_name="User Test",
        is_active=True,
        is_superuser=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def admin_token(admin_user):
    """Récupère un token JWT pour l'admin."""
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@test.com", "password": "adminpassword123"},
    )
    return response.json()["access_token"]


@pytest.fixture
def user_token(normal_user):
    """Récupère un token JWT pour l'utilisateur normal."""
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "user@test.com", "password": "userpassword123"},
    )
    return response.json()["access_token"]


@pytest.fixture
def sample_universite(db):
    """Crée une université de test."""
    universite = Universite(
        code="UO",
        libelle="Université de Ouagadougou",
        sigle="UO",
        is_active=True,
    )
    db.add(universite)
    db.commit()
    db.refresh(universite)
    return universite


class TestCreateUniversite:
    """Tests pour la création d'universités."""

    def test_create_universite_as_admin(self, admin_token):
        """Test de création d'une université par un admin."""
        response = client.post(
            "/api/v1/universites/",
            json={
                "code": "NEW-UNI",
                "libelle": "Nouvelle Université",
                "sigle": "NU",
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["code"] == "NEW-UNI"
        assert data["libelle"] == "Nouvelle Université"
        assert data["is_active"] is True

    def test_create_universite_duplicate_code(self, admin_token, sample_universite):
        """Test de création avec un code déjà existant."""
        response = client.post(
            "/api/v1/universites/",
            json={
                "code": "UO",
                "libelle": "Autre Université",
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 400
        assert "existe déjà" in response.json()["detail"]

    def test_create_universite_validation_error(self, admin_token):
        """Test de création avec des données invalides."""
        response = client.post(
            "/api/v1/universites/",
            json={
                "code": "",  # Code vide invalide
                "libelle": "Test",
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 422


class TestGetUniversites:
    """Tests pour la récupération des universités."""

    def test_get_universites(self, user_token, sample_universite):
        """Test de récupération de la liste des universités."""
        response = client.get(
            "/api/v1/universites/",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert data[0]["code"] == "UO"

    def test_get_universites_with_pagination(self, admin_token, db):
        """Test de pagination."""
        # Créer plusieurs universités
        for i in range(5):
            uni = Universite(code=f"UNI-{i}", libelle=f"Université {i}")
            db.add(uni)
        db.commit()

        response = client.get(
            "/api/v1/universites/?skip=0&limit=3",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        assert len(response.json()) == 3

    def test_get_universite_by_id(self, user_token, sample_universite):
        """Test de récupération par ID."""
        response = client.get(
            f"/api/v1/universites/{sample_universite.id}",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sample_universite.id
        assert data["code"] == "UO"

    def test_get_universite_not_found(self, user_token):
        """Test de récupération d'une université inexistante."""
        response = client.get(
            "/api/v1/universites/99999",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert response.status_code == 404


class TestUpdateUniversite:
    """Tests pour la mise à jour des universités."""

    def test_update_universite_as_admin(self, admin_token, sample_universite):
        """Test de mise à jour par un admin."""
        response = client.put(
            f"/api/v1/universites/{sample_universite.id}",
            json={"libelle": "Université Mise à Jour"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["libelle"] == "Université Mise à Jour"
        assert data["code"] == "UO"  # Non modifié

    def test_update_universite_not_found(self, admin_token):
        """Test de mise à jour d'une université inexistante."""
        response = client.put(
            "/api/v1/universites/99999",
            json={"libelle": "Test"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 404


class TestDeleteUniversite:
    """Tests pour la suppression des universités."""

    def test_delete_universite_as_admin(self, admin_token, sample_universite):
        """Test de suppression par un admin."""
        response = client.delete(
            f"/api/v1/universites/{sample_universite.id}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        assert "supprimée" in response.json()["message"]

    def test_delete_universite_not_found(self, admin_token):
        """Test de suppression d'une université inexistante."""
        response = client.delete(
            "/api/v1/universites/99999",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 404


class TestSearchUniversites:
    """Tests pour la recherche d'universités."""

    def test_search_universites(self, user_token, db):
        """Test de recherche."""
        # Créer des universités
        db.add(Universite(code="PARIS", libelle="Université de Paris"))
        db.add(Universite(code="LYON", libelle="Université de Lyon"))
        db.add(Universite(code="UO", libelle="Université de Ouagadougou"))
        db.commit()

        response = client.get(
            "/api/v1/universites/?search=Paris",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["code"] == "PARIS"


class TestUnauthorizedAccess:
    """Tests pour les accès non autorisés."""

    def test_get_universites_without_token(self):
        """Test d'accès sans token."""
        response = client.get("/api/v1/universites/")
        assert response.status_code == 401

    def test_create_universite_without_token(self):
        """Test de création sans token."""
        response = client.post(
            "/api/v1/universites/",
            json={"code": "TEST", "libelle": "Test"},
        )
        assert response.status_code == 401


class TestNonAdminAccess:
    """Tests pour les accès utilisateur non-admin."""

    def test_non_admin_cannot_create(self, user_token):
        """Test qu'un utilisateur normal ne peut pas créer."""
        response = client.post(
            "/api/v1/universites/",
            json={"code": "TEST", "libelle": "Test"},
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert response.status_code == 403

    def test_non_admin_cannot_update(self, user_token, sample_universite):
        """Test qu'un utilisateur normal ne peut pas modifier."""
        response = client.put(
            f"/api/v1/universites/{sample_universite.id}",
            json={"libelle": "Test"},
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert response.status_code == 403

    def test_non_admin_cannot_delete(self, user_token, sample_universite):
        """Test qu'un utilisateur normal ne peut pas supprimer."""
        response = client.delete(
            f"/api/v1/universites/{sample_universite.id}",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert response.status_code == 403

    def test_non_admin_can_read(self, user_token, sample_universite):
        """Test qu'un utilisateur normal peut lire."""
        response = client.get(
            "/api/v1/universites/",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert response.status_code == 200


class TestUniversiteCount:
    """Tests pour le comptage des universités."""

    def test_get_universites_count(self, user_token, db):
        """Test du comptage."""
        db.add(Universite(code="U1", libelle="Université 1"))
        db.add(Universite(code="U2", libelle="Université 2"))
        db.add(Universite(code="U3", libelle="Université 3"))
        db.commit()

        response = client.get(
            "/api/v1/universites/count",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert response.status_code == 200
        assert response.json()["total"] == 3
