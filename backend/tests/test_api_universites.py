"""Tests d'intégration pour les endpoints API des universités."""

from app.models import Universite
from tests.conftest import next_id


class TestCreateUniversite:
    def test_create_universite_as_admin(self, client, admin_token):
        response = client.post(
            "/api/v1/universites/",
            json={
                "code": "NEW-UNI",
                "nom": "Nouvelle Université",
                "sigle": "NU",
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["code"] == "NEW-UNI"
        assert data["libelle"] == "Nouvelle Université"

    def test_create_universite_duplicate_code(self, client, admin_token, sample_universite):
        response = client.post(
            "/api/v1/universites/",
            json={"code": "UO", "nom": "Autre Université"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 400
        assert "existe déjà" in response.json()["detail"]

    def test_create_universite_with_minimal_fields(self, client, admin_token):
        response = client.post(
            "/api/v1/universites/",
            json={"code": "MIN-UNI"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 201
        assert response.json()["code"] == "MIN-UNI"


class TestGetUniversites:
    def test_get_universites(self, client, user_token, sample_universite):
        response = client.get(
            "/api/v1/universites/",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert data[0]["code"] == "UO"

    def test_get_universites_with_pagination(self, client, admin_token, db):
        for i in range(5):
            db.add(Universite(id=next_id(), code=f"UNI-{i}", nom=f"Université {i}"))
        db.commit()

        response = client.get(
            "/api/v1/universites/?skip=0&limit=3",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        assert len(response.json()) == 3

    def test_get_universite_by_id(self, client, user_token, sample_universite):
        response = client.get(
            f"/api/v1/universites/{sample_universite.id}",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sample_universite.id
        assert data["code"] == "UO"

    def test_get_universite_not_found(self, client, user_token):
        response = client.get(
            "/api/v1/universites/99999",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert response.status_code == 404


class TestUpdateUniversite:
    def test_update_universite_as_admin(self, client, admin_token, sample_universite):
        response = client.put(
            f"/api/v1/universites/{sample_universite.id}",
            json={"nom": "Université Mise à Jour"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["libelle"] == "Université Mise à Jour"
        assert data["code"] == "UO"

    def test_update_universite_not_found(self, client, admin_token):
        response = client.put(
            "/api/v1/universites/99999",
            json={"nom": "Test"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 404


class TestDeleteUniversite:
    def test_delete_universite_as_admin(self, client, admin_token, sample_universite):
        response = client.delete(
            f"/api/v1/universites/{sample_universite.id}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        assert "supprimée" in response.json()["message"]

    def test_delete_universite_not_found(self, client, admin_token):
        response = client.delete(
            "/api/v1/universites/99999",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 404


class TestSearchUniversites:
    def test_search_universites(self, client, user_token, db):
        db.add(Universite(id=next_id(), code="PARIS", nom="Université de Paris"))
        db.add(Universite(id=next_id(), code="LYON", nom="Université de Lyon"))
        db.add(Universite(id=next_id(), code="UO2", nom="Université de Ouagadougou"))
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
    def test_get_universites_without_token(self, client):
        response = client.get("/api/v1/universites/")
        assert response.status_code == 401

    def test_create_universite_without_token(self, client):
        response = client.post(
            "/api/v1/universites/",
            json={"code": "TEST", "nom": "Test"},
        )
        assert response.status_code == 401


class TestNonAdminAccess:
    def test_non_admin_cannot_create(self, client, user_token):
        response = client.post(
            "/api/v1/universites/",
            json={"code": "TEST", "nom": "Test"},
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert response.status_code == 403

    def test_non_admin_cannot_update(self, client, user_token, sample_universite):
        response = client.put(
            f"/api/v1/universites/{sample_universite.id}",
            json={"nom": "Test"},
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert response.status_code == 403

    def test_non_admin_cannot_delete(self, client, user_token, sample_universite):
        response = client.delete(
            f"/api/v1/universites/{sample_universite.id}",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert response.status_code == 403

    def test_non_admin_can_read(self, client, user_token, sample_universite):
        response = client.get(
            "/api/v1/universites/",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert response.status_code == 200


class TestUniversiteCount:
    def test_get_universites_count(self, client, user_token, db):
        db.add(Universite(id=next_id(), code="U1", nom="Université 1"))
        db.add(Universite(id=next_id(), code="U2", nom="Université 2"))
        db.add(Universite(id=next_id(), code="U3", nom="Université 3"))
        db.commit()

        response = client.get(
            "/api/v1/universites/count",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert response.status_code == 200
        assert response.json()["total"] == 3
