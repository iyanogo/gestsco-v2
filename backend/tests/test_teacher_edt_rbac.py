"""RBAC portail enseignant - réservations et liste présences."""

from datetime import date, time

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.annee_academique import AnneeAcademique
from app.models.batiment import Batiment
from app.models.etablissement import Etablissement
from app.models.salle import Salle
from app.models.user import User
from tests.conftest import next_id


def _login(client: TestClient, email: str, password: str = "password123") -> str:
    response = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password},
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


@pytest.fixture
def teacher_reservation_context(db: Session) -> dict:
    teacher = User(
        email="teacher.resa@test.com",
        hashed_password=get_password_hash("password123"),
        full_name="Prof Résa",
        is_active=True,
        is_superuser=False,
        role="enseignant",
    )
    other = User(
        email="other.resa@test.com",
        hashed_password=get_password_hash("password123"),
        full_name="Autre User",
        is_active=True,
        is_superuser=False,
        role="enseignant",
    )
    db.add_all([teacher, other])
    db.flush()

    etab_id = next_id()
    db.add(Etablissement(id=etab_id, code="ETAB-RESA", nom="Etab Resa"))
    db.flush()
    batiment = Batiment(
        id=next_id(),
        code="BAT-RESA",
        libelle="Bat Resa",
        etablissement_id=etab_id,
    )
    salle = Salle(
        id=next_id(),
        code="S-RESA",
        libelle="Salle Resa",
        batiment_id=batiment.id,
        type_salle="cours",
        capacite=30,
    )
    db.add_all([batiment, salle])
    db.commit()
    return {"teacher": teacher, "other": other, "salle": salle}


@pytest.fixture
def token_teacher_resa(client: TestClient, teacher_reservation_context: dict) -> str:
    return _login(client, teacher_reservation_context["teacher"].email)


class TestTeacherReservationRbac:
    def test_teacher_can_create_reservation(
        self, client: TestClient, teacher_reservation_context: dict, token_teacher_resa: str
    ):
        salle = teacher_reservation_context["salle"]
        response = client.post(
            "/api/v1/reservations-salles/",
            json={
                "salle_id": salle.id,
                "date_reservation": "2026-03-15",
                "heure_debut": "14:00:00",
                "heure_fin": "16:00:00",
                "motif": "Réunion pédagogique",
            },
            headers={"Authorization": f"Bearer {token_teacher_resa}"},
        )
        assert response.status_code == 201, response.text
        assert response.json()["statut"] == "en_attente"

    def test_teacher_list_reservations_only_own(
        self,
        client: TestClient,
        teacher_reservation_context: dict,
        token_teacher_resa: str,
        admin_token: str,
    ):
        salle = teacher_reservation_context["salle"]
        client.post(
            "/api/v1/reservations-salles/",
            json={
                "salle_id": salle.id,
                "date_reservation": "2026-03-16",
                "heure_debut": "10:00:00",
                "heure_fin": "12:00:00",
                "motif": "Cours teacher",
            },
            headers={"Authorization": f"Bearer {token_teacher_resa}"},
        )
        client.post(
            "/api/v1/reservations-salles/",
            json={
                "salle_id": salle.id,
                "date_reservation": "2026-03-17",
                "heure_debut": "10:00:00",
                "heure_fin": "12:00:00",
                "motif": "Cours admin",
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )

        teacher_list = client.get(
            "/api/v1/reservations-salles/",
            headers={"Authorization": f"Bearer {token_teacher_resa}"},
        )
        assert teacher_list.status_code == 200, teacher_list.text
        body = teacher_list.json()
        assert len(body) >= 1
        assert all(r["motif"] != "Cours admin" for r in body)

    def test_teacher_cannot_read_foreign_reservation(
        self,
        client: TestClient,
        teacher_reservation_context: dict,
        token_teacher_resa: str,
        admin_token: str,
    ):
        salle = teacher_reservation_context["salle"]
        created = client.post(
            "/api/v1/reservations-salles/",
            json={
                "salle_id": salle.id,
                "date_reservation": "2026-03-18",
                "heure_debut": "08:00:00",
                "heure_fin": "10:00:00",
                "motif": "Admin only",
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        resa_id = created.json()["id"]
        response = client.get(
            f"/api/v1/reservations-salles/{resa_id}",
            headers={"Authorization": f"Bearer {token_teacher_resa}"},
        )
        assert response.status_code == 403

    def test_teacher_cannot_list_presences_without_filter(
        self, client: TestClient, token_teacher_resa: str
    ):
        response = client.get(
            "/api/v1/presences/",
            headers={"Authorization": f"Bearer {token_teacher_resa}"},
        )
        assert response.status_code == 403

    def test_teacher_cannot_approve_reservation(
        self, client: TestClient, teacher_reservation_context: dict, token_teacher_resa: str
    ):
        salle = teacher_reservation_context["salle"]
        created = client.post(
            "/api/v1/reservations-salles/",
            json={
                "salle_id": salle.id,
                "date_reservation": "2026-03-19",
                "heure_debut": "14:00:00",
                "heure_fin": "16:00:00",
                "motif": "Ma demande",
            },
            headers={"Authorization": f"Bearer {token_teacher_resa}"},
        )
        resa_id = created.json()["id"]
        response = client.patch(
            f"/api/v1/reservations-salles/{resa_id}/approuver",
            headers={"Authorization": f"Bearer {token_teacher_resa}"},
        )
        assert response.status_code == 403
