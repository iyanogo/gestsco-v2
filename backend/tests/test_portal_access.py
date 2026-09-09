"""Tests sécurité portails - un étudiant ne peut jamais lire les données d'un autre."""

from datetime import date

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.etudiant import Etudiant
from app.models.filiere import Filiere
from app.models.inscription import Inscription
from app.models.niveau import Niveau
from app.models.user import User
from tests.conftest import next_id


def _login(client: TestClient, email: str, password: str = "password123") -> str:
    response = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password},
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


def _create_linked_student(
    db: Session,
    email: str,
    nom: str,
    prenom: str,
    matricule: str,
) -> tuple[User, Etudiant]:
    user = User(
        email=email,
        hashed_password=get_password_hash("password123"),
        full_name=f"{prenom} {nom}",
        is_active=True,
        is_superuser=False,
        role="etudiant",
    )
    db.add(user)
    db.flush()
    etudiant = Etudiant(
        id=next_id(),
        user_id=user.id,
        matricule=matricule,
        nom=nom,
        prenom=prenom,
        email=email,
        is_active=True,
    )
    db.add(etudiant)
    db.commit()
    db.refresh(user)
    db.refresh(etudiant)
    return user, etudiant


@pytest.fixture
def portal_context(db: Session, client: TestClient) -> dict:
    niveau = Niveau(id=next_id(), code="L3", libelle="Licence 3")
    filiere = Filiere(id=next_id(), code="INFO", libelle="Informatique")
    db.add_all([niveau, filiere])
    db.flush()

    user_a, etu_a = _create_linked_student(
        db, "etudiant.a@test.com", "DIALLO", "Amadou", "ETU-A-001"
    )
    user_b, etu_b = _create_linked_student(
        db, "etudiant.b@test.com", "KONE", "Fatou", "ETU-B-001"
    )

    for etu in (etu_a, etu_b):
        db.add(
            Inscription(
                id=next_id(),
                etudiant_id=etu.id,
                filiere_id=filiere.id,
                niveau_id=niveau.id,
                annee_academique="2025-2026",
                date_inscription=date(2025, 9, 1),
                type_inscription="normale",
                statut_inscription="en_cours",
                is_active=True,
            )
        )
    db.commit()

    enseignant = User(
        email="enseignant.portal@test.com",
        hashed_password=get_password_hash("password123"),
        full_name="Prof Portal",
        is_active=True,
        is_superuser=False,
        role="enseignant",
    )
    db.add(enseignant)
    db.commit()
    db.refresh(enseignant)

    return {
        "token_a": _login(client, user_a.email),
        "token_b": _login(client, user_b.email),
        "token_enseignant": _login(client, enseignant.email),
        "etu_a_id": etu_a.id,
        "etu_b_id": etu_b.id,
        "enseignant_id": enseignant.id,
    }


class TestEtudiantIsolation:
    @pytest.mark.parametrize(
        "path_template",
        [
            "/api/v1/resultats/semestres/etudiant/{other_id}",
            "/api/v1/resultats/matieres/etudiant/{other_id}",
            "/api/v1/resultats/annuels/etudiant/{other_id}",
            "/api/v1/presences/etudiant/{other_id}",
            "/api/v1/presences/etudiant/{other_id}/taux",
            "/api/v1/inscriptions/etudiant/{other_id}",
            "/api/v1/inscriptions/etudiant/{other_id}/current",
            "/api/v1/notes/etudiant/{other_id}",
            "/api/v1/factures/etudiant/{other_id}",
            "/api/v1/comptes-etudiants/etudiant/{other_id}?annee_id=1",
            "/api/v1/paiements-factures/etudiant/{other_id}",
            "/api/v1/stages/etudiant/{other_id}",
        ],
    )
    def test_etudiant_a_cannot_read_b_via_id_url(
        self, client: TestClient, portal_context: dict, path_template: str
    ):
        other_id = portal_context["etu_b_id"]
        path = path_template.format(other_id=other_id)
        response = client.get(
            path,
            headers={"Authorization": f"Bearer {portal_context['token_a']}"},
        )
        assert response.status_code == 403, f"{path} → {response.status_code} {response.text}"

    def test_mes_resultats_returns_own_id(self, client: TestClient, portal_context: dict):
        response = client.get(
            "/api/v1/resultats/mes-resultats",
            headers={"Authorization": f"Bearer {portal_context['token_a']}"},
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["etudiant_id"] == portal_context["etu_a_id"]
        assert "semestres" in data
        assert "matieres" in data
        assert "annuels" in data

    def test_mes_inscription_current(self, client: TestClient, portal_context: dict):
        response = client.get(
            "/api/v1/inscriptions/mes-inscription/current",
            headers={"Authorization": f"Bearer {portal_context['token_a']}"},
        )
        assert response.status_code == 200, response.text
        assert response.json()["etudiant_id"] == portal_context["etu_a_id"]

    def test_mes_inscription_current_legacy_annee_returns_503(
        self, client: TestClient, db: Session, portal_context: dict
    ):
        insc = (
            db.query(Inscription)
            .filter(Inscription.etudiant_id == portal_context["etu_a_id"])
            .first()
        )
        insc.annee_academique = "E2E-MANUAL-2025"
        db.commit()

        response = client.get(
            "/api/v1/inscriptions/mes-inscription/current",
            headers={"Authorization": f"Bearer {portal_context['token_a']}"},
        )
        assert response.status_code == 503
        assert "annee_academique" in response.json()["detail"]

    def test_mes_profil(self, client: TestClient, portal_context: dict):
        response = client.get(
            "/api/v1/inscriptions/mes-profil",
            headers={"Authorization": f"Bearer {portal_context['token_a']}"},
        )
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["etudiant"]["id"] == portal_context["etu_a_id"]
        assert body["inscription_active"]["etudiant_id"] == portal_context["etu_a_id"]

    def test_bulletin_other_etudiant_forbidden(
        self, client: TestClient, portal_context: dict
    ):
        response = client.get(
            f"/api/v1/bulletins/etudiant/{portal_context['etu_b_id']}/releve-notes",
            params={"annee_id": 1},
            headers={"Authorization": f"Bearer {portal_context['token_a']}"},
        )
        assert response.status_code == 403

    def test_enseignant_cannot_read_etudiant_resultats(
        self, client: TestClient, portal_context: dict
    ):
        response = client.get(
            f"/api/v1/resultats/semestres/etudiant/{portal_context['etu_a_id']}",
            headers={"Authorization": f"Bearer {portal_context['token_enseignant']}"},
        )
        assert response.status_code == 403

    def test_mes_presences_taux_ok(self, client: TestClient, portal_context: dict):
        response = client.get(
            "/api/v1/presences/mes-presences/taux",
            headers={"Authorization": f"Bearer {portal_context['token_a']}"},
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert "taux_presence" in data
        assert "total_seances" in data

    def test_mes_presences_ok(self, client: TestClient, portal_context: dict):
        response = client.get(
            "/api/v1/presences/mes-presences",
            headers={"Authorization": f"Bearer {portal_context['token_a']}"},
        )
        assert response.status_code == 200, response.text
        assert isinstance(response.json(), list)

    def test_mes_factures_ok(self, client: TestClient, portal_context: dict):
        response = client.get(
            "/api/v1/factures/mes-factures",
            headers={"Authorization": f"Bearer {portal_context['token_a']}"},
        )
        assert response.status_code == 200, response.text
        assert isinstance(response.json(), list)

    def test_mes_paiements_ok(self, client: TestClient, portal_context: dict):
        response = client.get(
            "/api/v1/paiements-factures/mes-paiements",
            headers={"Authorization": f"Bearer {portal_context['token_a']}"},
        )
        assert response.status_code == 200, response.text
        assert isinstance(response.json(), list)

    def test_mes_stages_ok(self, client: TestClient, portal_context: dict):
        response = client.get(
            "/api/v1/stages/mes-stages",
            headers={"Authorization": f"Bearer {portal_context['token_a']}"},
        )
        assert response.status_code == 200, response.text
        assert isinstance(response.json(), list)

    def test_factures_list_with_other_etudiant_id_forbidden(
        self, client: TestClient, portal_context: dict
    ):
        response = client.get(
            "/api/v1/factures/",
            params={"etudiant_id": portal_context["etu_b_id"]},
            headers={"Authorization": f"Bearer {portal_context['token_a']}"},
        )
        assert response.status_code == 403

    def test_presences_list_with_other_etudiant_id_forbidden(
        self, client: TestClient, portal_context: dict
    ):
        response = client.get(
            "/api/v1/presences/",
            params={"etudiant_id": portal_context["etu_b_id"]},
            headers={"Authorization": f"Bearer {portal_context['token_a']}"},
        )
        assert response.status_code == 403


class TestEncadrantIsolation:
    def test_enseignant_cannot_read_other_encadrant_stages(
        self, client: TestClient, portal_context: dict
    ):
        other_encadrant = portal_context["enseignant_id"] + 999
        response = client.get(
            f"/api/v1/stages/encadrant/{other_encadrant}",
            headers={"Authorization": f"Bearer {portal_context['token_enseignant']}"},
        )
        assert response.status_code == 403

    def test_enseignant_cannot_read_other_encadrant_seances(
        self, client: TestClient, portal_context: dict
    ):
        other_id = portal_context["enseignant_id"] + 999
        response = client.get(
            f"/api/v1/seances/enseignant/{other_id}",
            headers={"Authorization": f"Bearer {portal_context['token_enseignant']}"},
        )
        assert response.status_code == 403

    def test_mes_seances_ok(self, client: TestClient, portal_context: dict):
        response = client.get(
            "/api/v1/seances/mes-seances",
            headers={"Authorization": f"Bearer {portal_context['token_enseignant']}"},
        )
        assert response.status_code == 200, response.text
        assert isinstance(response.json(), list)

    def test_mes_stages_encadres_ok(self, client: TestClient, portal_context: dict):
        response = client.get(
            "/api/v1/stages/mes-stages-encadres",
            headers={"Authorization": f"Bearer {portal_context['token_enseignant']}"},
        )
        assert response.status_code == 200, response.text
        assert isinstance(response.json(), list)
