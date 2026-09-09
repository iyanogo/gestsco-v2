"""Tests sécurité saisie notes - portail enseignant (sous-lot D)."""

from datetime import date, time

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.annee_academique import AnneeAcademique
from app.models.creneau_horaire import CreneauHoraire
from app.models.etudiant import Etudiant
from app.models.examen import Examen
from app.models.filiere import Filiere
from app.models.inscription import Inscription
from app.models.inscription_matiere import InscriptionMatiere
from app.models.matiere import Matiere
from app.models.niveau import Niveau
from app.models.seance import Seance
from app.models.session_examen import SessionExamen
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
def teacher_notes_context(db: Session) -> dict:
    """Enseignant A enseigne MAT-A ; enseignant B enseigne MAT-B uniquement."""
    teacher_a = User(
        email="teacher.notes.a@test.com",
        hashed_password=get_password_hash("password123"),
        full_name="Prof Notes A",
        is_active=True,
        is_superuser=False,
        role="enseignant",
    )
    teacher_b = User(
        email="teacher.notes.b@test.com",
        hashed_password=get_password_hash("password123"),
        full_name="Prof Notes B",
        is_active=True,
        is_superuser=False,
        role="enseignant",
    )
    db.add_all([teacher_a, teacher_b])
    db.flush()

    niveau = Niveau(id=next_id(), code="L3-NOTES", libelle="Licence 3 Notes")
    filiere = Filiere(id=next_id(), code="INFO-NOTES", libelle="Informatique Notes")
    matiere_a = Matiere(id=next_id(), code="MAT-A", libelle="Matière A", credit=3)
    matiere_b = Matiere(id=next_id(), code="MAT-B", libelle="Matière B", credit=3)
    annee = AnneeAcademique(
        id=next_id(),
        code="2025-2026",
        libelle="2025-2026",
        date_debut=date(2025, 9, 1),
        date_fin=date(2026, 8, 31),
        date_debut_inscriptions=date(2025, 6, 1),
        date_fin_inscriptions=date(2025, 10, 31),
        statut="en_cours",
        is_active=True,
        is_current=True,
    )
    creneau = CreneauHoraire(
        id=next_id(),
        code="AM-NOTES",
        libelle="Matin notes",
        heure_debut=time(8, 0),
        heure_fin=time(10, 0),
        periode="matin",
        ordre=1,
        duree_minutes=120,
    )
    session_open = SessionExamen(
        id=next_id(),
        code="SESS-NOTES-OPEN",
        libelle="Session ouverte",
        annee_academique_id=annee.id,
        type_session="normale",
        semestre=1,
        date_debut=date(2025, 9, 1),
        date_fin=date(2025, 12, 31),
        date_limite_saisie_notes=date(2026, 1, 15),
        statut="en_cours",
    )
    session_closed = SessionExamen(
        id=next_id(),
        code="SESS-NOTES-CLOSED",
        libelle="Session clôturée",
        annee_academique_id=annee.id,
        type_session="normale",
        semestre=2,
        date_debut=date(2026, 1, 1),
        date_fin=date(2026, 6, 30),
        date_limite_saisie_notes=date(2026, 1, 15),
        statut="cloturee",
    )
    etudiant = Etudiant(
        id=next_id(),
        matricule="ETU-NOTES-001",
        nom="TRAORE",
        prenom="Ibrahim",
        email="ibrahim.notes@test.com",
        is_active=True,
    )
    db.add_all(
        [
            niveau,
            filiere,
            matiere_a,
            matiere_b,
            annee,
            creneau,
            session_open,
            session_closed,
            etudiant,
        ]
    )
    db.flush()

    inscription = Inscription(
        id=next_id(),
        etudiant_id=etudiant.id,
        filiere_id=filiere.id,
        niveau_id=niveau.id,
        annee_academique=annee.code,
        date_inscription=date(2025, 9, 1),
        type_inscription="normale",
        statut_inscription="en_cours",
        is_active=True,
    )
    db.add(inscription)
    db.flush()

    im_a = InscriptionMatiere(
        id=next_id(),
        inscription_id=inscription.id,
        matiere_id=matiere_a.id,
        semestre=1,
        is_active=True,
    )
    im_b = InscriptionMatiere(
        id=next_id(),
        inscription_id=inscription.id,
        matiere_id=matiere_b.id,
        semestre=1,
        is_active=True,
    )
    db.add_all([im_a, im_b])
    db.flush()

    seance_a = Seance(
        id=next_id(),
        code="SEANCE-MAT-A",
        matiere_id=matiere_a.id,
        niveau_id=niveau.id,
        filiere_id=filiere.id,
        enseignant_id=teacher_a.id,
        creneau_id=creneau.id,
        type_seance="cours",
        date_seance=date(2026, 3, 10),
        jour_semaine=2,
        semestre=1,
        annee_academique_id=annee.id,
        duree_minutes=120,
        statut="confirmee",
    )
    seance_b = Seance(
        id=next_id(),
        code="SEANCE-MAT-B",
        matiere_id=matiere_b.id,
        niveau_id=niveau.id,
        filiere_id=filiere.id,
        enseignant_id=teacher_b.id,
        creneau_id=creneau.id,
        type_seance="cours",
        date_seance=date(2026, 3, 11),
        jour_semaine=3,
        semestre=1,
        annee_academique_id=annee.id,
        duree_minutes=120,
        statut="confirmee",
    )
    examen_b = Examen(
        id=next_id(),
        session_id=session_open.id,
        matiere_id=matiere_b.id,
        niveau_id=niveau.id,
        type_evaluation="controle_continu",
        coefficient=1.0,
        note_sur=20.0,
        bareme=20.0,
        enseignant_id=teacher_b.id,
        statut="planifie",
    )
    db.add_all([seance_a, seance_b, examen_b])
    db.commit()

    return {
        "teacher_a": teacher_a,
        "teacher_b": teacher_b,
        "matiere_a": matiere_a,
        "matiere_b": matiere_b,
        "niveau": niveau,
        "filiere": filiere,
        "session_open": session_open,
        "session_closed": session_closed,
        "etudiant": etudiant,
        "im_a": im_a,
        "im_b": im_b,
        "examen_b": examen_b,
    }


@pytest.fixture
def token_teacher_a(client: TestClient, teacher_notes_context: dict) -> str:
    return _login(client, teacher_notes_context["teacher_a"].email)


@pytest.fixture
def token_teacher_b(client: TestClient, teacher_notes_context: dict) -> str:
    return _login(client, teacher_notes_context["teacher_b"].email)


class TestTeacherNotesScope:
    def test_mes_matieres_enseignement_returns_own_only(
        self, client: TestClient, teacher_notes_context: dict, token_teacher_a: str
    ):
        response = client.get(
            "/api/v1/seances/mes-matieres-enseignement",
            headers={"Authorization": f"Bearer {token_teacher_a}"},
        )
        assert response.status_code == 200, response.text
        data = response.json()
        matiere_ids = {row["matiere_id"] for row in data}
        assert teacher_notes_context["matiere_a"].id in matiere_ids
        assert teacher_notes_context["matiere_b"].id not in matiere_ids

    def test_teacher_b_scope_excludes_mat_a(
        self, client: TestClient, teacher_notes_context: dict, token_teacher_b: str
    ):
        response = client.get(
            "/api/v1/seances/mes-matieres-enseignement",
            headers={"Authorization": f"Bearer {token_teacher_b}"},
        )
        assert response.status_code == 200
        matiere_ids = {row["matiere_id"] for row in response.json()}
        assert teacher_notes_context["matiere_b"].id in matiere_ids
        assert teacher_notes_context["matiere_a"].id not in matiere_ids


class TestTeacherExamenSaisie:
    def test_teacher_can_create_examen_on_own_matiere(
        self, client: TestClient, teacher_notes_context: dict, token_teacher_a: str
    ):
        ctx = teacher_notes_context
        payload = {
            "session_id": ctx["session_open"].id,
            "matiere_id": ctx["matiere_a"].id,
            "niveau_id": ctx["niveau"].id,
            "type_evaluation": "controle_continu",
        }
        response = client.post(
            "/api/v1/examens/saisie-enseignant",
            json=payload,
            headers={"Authorization": f"Bearer {token_teacher_a}"},
        )
        assert response.status_code == 201, response.text
        body = response.json()
        assert body["matiere_id"] == ctx["matiere_a"].id
        assert body["enseignant_id"] == ctx["teacher_a"].id

    def test_teacher_cannot_create_examen_on_foreign_matiere(
        self, client: TestClient, teacher_notes_context: dict, token_teacher_a: str
    ):
        ctx = teacher_notes_context
        payload = {
            "session_id": ctx["session_open"].id,
            "matiere_id": ctx["matiere_b"].id,
            "niveau_id": ctx["niveau"].id,
            "type_evaluation": "controle_continu",
        }
        response = client.post(
            "/api/v1/examens/saisie-enseignant",
            json=payload,
            headers={"Authorization": f"Bearer {token_teacher_a}"},
        )
        assert response.status_code == 403

    def test_teacher_cannot_saisie_when_session_not_en_cours(
        self, client: TestClient, teacher_notes_context: dict, token_teacher_a: str
    ):
        ctx = teacher_notes_context
        payload = {
            "session_id": ctx["session_closed"].id,
            "matiere_id": ctx["matiere_a"].id,
            "niveau_id": ctx["niveau"].id,
            "type_evaluation": "controle_continu",
        }
        response = client.post(
            "/api/v1/examens/saisie-enseignant",
            json=payload,
            headers={"Authorization": f"Bearer {token_teacher_a}"},
        )
        assert response.status_code == 400
        assert "en_cours" in response.json()["detail"]


class TestTeacherNotesWrite:
    def _create_examen_a(
        self, client: TestClient, ctx: dict, token: str
    ) -> int:
        payload = {
            "session_id": ctx["session_open"].id,
            "matiere_id": ctx["matiere_a"].id,
            "niveau_id": ctx["niveau"].id,
            "type_evaluation": "controle_continu",
        }
        response = client.post(
            "/api/v1/examens/saisie-enseignant",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 201, response.text
        return response.json()["id"]

    def test_teacher_bulk_notes_ok(
        self, client: TestClient, teacher_notes_context: dict, token_teacher_a: str
    ):
        ctx = teacher_notes_context
        examen_id = self._create_examen_a(client, ctx, token_teacher_a)
        bulk = {
            "examen_id": examen_id,
            "notes": [
                {
                    "etudiant_id": ctx["etudiant"].id,
                    "inscription_matiere_id": ctx["im_a"].id,
                    "note": 14.5,
                    "statut_presence": "present",
                }
            ],
        }
        response = client.post(
            "/api/v1/notes/bulk",
            json=bulk,
            headers={"Authorization": f"Bearer {token_teacher_a}"},
        )
        assert response.status_code == 200, response.text
        assert response.json()["count"] == 1

    def test_teacher_cannot_bulk_notes_foreign_examen(
        self, client: TestClient, teacher_notes_context: dict, token_teacher_a: str
    ):
        ctx = teacher_notes_context
        bulk = {
            "examen_id": ctx["examen_b"].id,
            "notes": [
                {
                    "etudiant_id": ctx["etudiant"].id,
                    "inscription_matiere_id": ctx["im_b"].id,
                    "note": 12.0,
                    "statut_presence": "present",
                }
            ],
        }
        response = client.post(
            "/api/v1/notes/bulk",
            json=bulk,
            headers={"Authorization": f"Bearer {token_teacher_a}"},
        )
        assert response.status_code == 403

    def test_teacher_cannot_create_single_note_foreign_examen(
        self, client: TestClient, teacher_notes_context: dict, token_teacher_a: str
    ):
        ctx = teacher_notes_context
        payload = {
            "examen_id": ctx["examen_b"].id,
            "etudiant_id": ctx["etudiant"].id,
            "inscription_matiere_id": ctx["im_b"].id,
            "note": 11.0,
            "statut_presence": "present",
        }
        response = client.post(
            "/api/v1/notes/",
            json=payload,
            headers={"Authorization": f"Bearer {token_teacher_a}"},
        )
        assert response.status_code == 403

    def test_teacher_update_note_ok(
        self, client: TestClient, teacher_notes_context: dict, token_teacher_a: str
    ):
        ctx = teacher_notes_context
        examen_id = self._create_examen_a(client, ctx, token_teacher_a)
        bulk = {
            "examen_id": examen_id,
            "notes": [
                {
                    "etudiant_id": ctx["etudiant"].id,
                    "inscription_matiere_id": ctx["im_a"].id,
                    "note": 10.0,
                    "statut_presence": "present",
                }
            ],
        }
        created = client.post(
            "/api/v1/notes/bulk",
            json=bulk,
            headers={"Authorization": f"Bearer {token_teacher_a}"},
        )
        note_id = created.json()["notes"][0]["id"]

        response = client.put(
            f"/api/v1/notes/{note_id}",
            json={"note": 15.5},
            headers={"Authorization": f"Bearer {token_teacher_a}"},
        )
        assert response.status_code == 200, response.text
        assert response.json()["note"] == 15.5

    def test_admin_can_update_teacher_created_note(
        self,
        client: TestClient,
        teacher_notes_context: dict,
        token_teacher_a: str,
        admin_token: str,
    ):
        ctx = teacher_notes_context
        examen_id = self._create_examen_a(client, ctx, token_teacher_a)
        bulk = {
            "examen_id": examen_id,
            "notes": [
                {
                    "etudiant_id": ctx["etudiant"].id,
                    "inscription_matiere_id": ctx["im_a"].id,
                    "note": 13.0,
                    "statut_presence": "present",
                }
            ],
        }
        created = client.post(
            "/api/v1/notes/bulk",
            json=bulk,
            headers={"Authorization": f"Bearer {token_teacher_a}"},
        )
        note_id = created.json()["notes"][0]["id"]

        response = client.put(
            f"/api/v1/notes/{note_id}",
            json={"note": 16.0},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        assert response.json()["note"] == 16.0

    def test_teacher_cannot_read_foreign_examen_match(
        self, client: TestClient, teacher_notes_context: dict, token_teacher_a: str
    ):
        ctx = teacher_notes_context
        response = client.get(
            "/api/v1/examens/match",
            params={
                "session_id": ctx["session_open"].id,
                "matiere_id": ctx["matiere_b"].id,
                "niveau_id": ctx["niveau"].id,
                "type_evaluation": "controle_continu",
            },
            headers={"Authorization": f"Bearer {token_teacher_a}"},
        )
        assert response.status_code == 403
