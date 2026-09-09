"""Tests RBAC - paramétrage (lecture auth, écriture superuser)."""

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


PARAMETRE_PAYLOAD = {
    "categorie": "general",
    "cle": "test_rbac_param",
    "valeur": "1",
    "type_valeur": "integer",
    "libelle": "Test RBAC",
    "est_modifiable": True,
    "est_visible": True,
    "ordre_affichage": 99,
}

BAREME_PAYLOAD = {
    "code": "RBAC_TEST",
    "libelle": "Barème test RBAC",
    "note_min": "0",
    "note_max": "20",
}

TEMPLATE_PAYLOAD = {
    "code": "RBAC_TPL",
    "libelle": "Template test RBAC",
    "type_document": "autre",
    "template_html": "<p>{{ nom }}</p>",
}

REGLE_PAYLOAD = {
    "code": "RBAC_REGLE",
    "libelle": "Règle test RBAC",
    "type_regle": "moyenne_matiere",
    "formule": "sum(notes)/count(notes)",
}

EMAIL_PAYLOAD = {
    "code": "RBAC_EMAIL",
    "libelle": "Email test RBAC",
    "type_destinataire": "etudiant",
    "objet": "Test",
    "corps_html": "<p>Test</p>",
}

CONFIG_PAYLOAD = {
    "etablissement_id": 1,
    "nom_complet": "Test Établissement RBAC",
    "nom_court": "TEST-RBAC",
}

WRITE_ENDPOINTS = [
    ("POST", "/api/v1/parametres/", PARAMETRE_PAYLOAD),
    ("PATCH", "/api/v1/parametres/valeur/test_rbac_param", {"valeur": "2"}),
    ("POST", "/api/v1/baremes/", BAREME_PAYLOAD),
    ("POST", "/api/v1/templates/", TEMPLATE_PAYLOAD),
    ("POST", "/api/v1/regles-calcul/", REGLE_PAYLOAD),
    ("POST", "/api/v1/modeles-communication/emails", EMAIL_PAYLOAD),
    ("POST", "/api/v1/configurations/", CONFIG_PAYLOAD),
]

READ_ENDPOINTS = [
    "/api/v1/parametres/",
    "/api/v1/baremes/",
    "/api/v1/templates/",
    "/api/v1/regles-calcul/",
    "/api/v1/modeles-communication/emails",
    "/api/v1/configurations/",
]


@pytest.fixture
def scolarite_token(client: TestClient, db: Session) -> str:
    _create_user(db, "scolarite-param@test.com", "scolarite")
    return _login(client, "scolarite-param@test.com", "password123")


class TestParametrageReadRbac:
    @pytest.mark.parametrize("path", READ_ENDPOINTS)
    def test_unauthenticated_read_401(self, client: TestClient, path: str):
        assert client.get(path).status_code == 401

    @pytest.mark.parametrize("path", READ_ENDPOINTS)
    def test_authenticated_can_read(self, client: TestClient, user_token: str, path: str):
        response = client.get(path, headers={"Authorization": f"Bearer {user_token}"})
        assert response.status_code == 200, f"{path}: {response.text}"


class TestParametrageWriteRbac:
    @pytest.mark.parametrize("method,path,payload", WRITE_ENDPOINTS)
    def test_non_superuser_write_forbidden(
        self, client: TestClient, user_token: str, method: str, path: str, payload: dict
    ):
        response = client.request(
            method,
            path,
            json=payload,
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert response.status_code == 403, f"{method} {path}: {response.text}"

    @pytest.mark.parametrize("method,path,payload", WRITE_ENDPOINTS)
    def test_scolarite_write_forbidden(
        self, client: TestClient, scolarite_token: str, method: str, path: str, payload: dict
    ):
        response = client.request(
            method,
            path,
            json=payload,
            headers={"Authorization": f"Bearer {scolarite_token}"},
        )
        assert response.status_code == 403, f"{method} {path}: {response.text}"

    def test_superuser_can_create_parametre(self, client: TestClient, admin_token: str):
        response = client.post(
            "/api/v1/parametres/",
            json=PARAMETRE_PAYLOAD,
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 201, response.text

    def test_superuser_can_patch_parametre_valeur(self, client: TestClient, admin_token: str):
        client.post(
            "/api/v1/parametres/",
            json={**PARAMETRE_PAYLOAD, "cle": "patch_rbac_param"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        response = client.patch(
            "/api/v1/parametres/valeur/patch_rbac_param",
            json={"valeur": "42"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200, response.text

    def test_superuser_can_create_bareme(self, client: TestClient, admin_token: str):
        response = client.post(
            "/api/v1/baremes/",
            json={**BAREME_PAYLOAD, "code": "RBAC_BAREME_OK"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 201, response.text

    def test_superuser_can_create_template(self, client: TestClient, admin_token: str):
        response = client.post(
            "/api/v1/templates/",
            json={**TEMPLATE_PAYLOAD, "code": "RBAC_TPL_OK"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 201, response.text

    def test_superuser_can_create_regle(self, client: TestClient, admin_token: str):
        response = client.post(
            "/api/v1/regles-calcul/",
            json={**REGLE_PAYLOAD, "code": "RBAC_REGLE_OK"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 201, response.text

    def test_superuser_can_create_modele_email(self, client: TestClient, admin_token: str):
        response = client.post(
            "/api/v1/modeles-communication/emails",
            json={**EMAIL_PAYLOAD, "code": "RBAC_EMAIL_OK"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 201, response.text
