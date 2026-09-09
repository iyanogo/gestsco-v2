"""Tests portail enseignant - présences et résultats (compléments portails)."""

from datetime import date, time

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.annee_academique import AnneeAcademique
from app.models.creneau_horaire import CreneauHoraire
from app.models.etudiant import Etudiant
from app.models.filiere import Filiere
from app.models.inscription import Inscription
from app.models.inscription_matiere import InscriptionMatiere
from app.models.matiere import Matiere
from app.models.niveau import Niveau
from app.models.resultat_matiere import ResultatMatiere
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
def teacher_portal_context(db: Session) -> dict:
    teacher_a = User(
        email="teacher.portal.a@test.com",
        hashed_password=get_password_hash("password123"),
        full_name="Prof Portal A",
        is_active=True,
        is_superuser=False,
        role="enseignant",
    )
    teacher_b = User(
        email="teacher.portal.b@test.com",
        hashed_password=get_password_hash("password123"),
        full_name="Prof Portal B",
        is_active=True,
        is_superuser=False,
        role="enseignant",
    )
    db.add_all([teacher_a, teacher_b])
    db.flush()

    niveau = Niveau(id=next_id(), code="L3-PORT", libelle="Licence 3 Portal")
    filiere = Filiere(id=next_id(), code="INFO-PORT", libelle="Info Portal")
    matiere_a = Matiere(id=next_id(), code="MAT-PORT-A", libelle="Matière Portal A", credit=3)
    matiere_b = Matiere(id=next_id(), code="MAT-PORT-B", libelle="Matière Portal B", credit=3)
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
        code="AM-PORT",
        libelle="Matin portal",
        heure_debut=time(8, 0),
        heure_fin=time(10, 0),
        periode="matin",
        ordre=1,
        duree_minutes=120,
    )
    session = SessionExamen(
        id=next_id(),
        code="SESS-PORT-01",
        libelle="Session portal",
        annee_academique_id=annee.id,
        type_session="normale",
        semestre=1,
        date_debut=date(2025, 9, 1),
        date_fin=date(2025, 12, 31),
        date_limite_saisie_notes=date(2026, 1, 15),
        statut="en_cours",
    )
    etudiant = Etudiant(
        id=next_id(),
        matricule="ETU-PORT-001",
        nom="SOW",
        prenom="Aissatou",
        email="aissatou.portal@test.com",
        is_active=True,
    )
    db.add_all(
        [niveau, filiere, matiere_a, matiere_b, annee, creneau, session, etudiant]
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
    db.add(im_a)
    db.flush()

    seance_a = Seance(
        id=next_id(),
        code="SEANCE-PORT-A",
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
        code="SEANCE-PORT-B",
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
    seance_annulee = Seance(
        id=next_id(),
        code="SEANCE-PORT-ANN",
        matiere_id=matiere_a.id,
        niveau_id=niveau.id,
        filiere_id=filiere.id,
        enseignant_id=teacher_a.id,
        creneau_id=creneau.id,
        type_seance="cours",
        date_seance=date(2026, 3, 12),
        jour_semaine=4,
        semestre=1,
        annee_academique_id=annee.id,
        duree_minutes=120,
        statut="annulee",
    )
    resultat_a = ResultatMatiere(
        id=next_id(),
        inscription_matiere_id=im_a.id,
        etudiant_id=etudiant.id,
        matiere_id=matiere_a.id,
        session_id=session.id,
        note_cc=14.0,
        moyenne_matiere=14.0,
        credit_matiere=3.0,
        credit_obtenu=3.0,
        statut="valide",
        decision="admis",
        is_valide=True,
    )
    db.add_all([seance_a, seance_b, seance_annulee, resultat_a])
    db.commit()

    return {
        "teacher_a": teacher_a,
        "teacher_b": teacher_b,
        "seance_a": seance_a,
        "seance_b": seance_b,
        "seance_annulee": seance_annulee,
        "matiere_a": matiere_a,
        "matiere_b": matiere_b,
        "niveau": niveau,
        "session": session,
        "etudiant": etudiant,
        "im_a": im_a,
    }


@pytest.fixture
def token_teacher_a(client: TestClient, teacher_portal_context: dict) -> str:
    return _login(client, teacher_portal_context["teacher_a"].email)


@pytest.fixture
def token_teacher_b(client: TestClient, teacher_portal_context: dict) -> str:
    return _login(client, teacher_portal_context["teacher_b"].email)


class TestTeacherPresencesAccess:
    def test_teacher_can_read_feuille_appel_own_seance(
        self, client: TestClient, teacher_portal_context: dict, token_teacher_a: str
    ):
        seance_id = teacher_portal_context["seance_a"].id
        response = client.get(
            f"/api/v1/presences/seance/{seance_id}",
            headers={"Authorization": f"Bearer {token_teacher_a}"},
        )
        assert response.status_code == 200, response.text
        assert isinstance(response.json(), list)

    def test_teacher_cannot_read_feuille_foreign_seance(
        self, client: TestClient, teacher_portal_context: dict, token_teacher_a: str
    ):
        seance_id = teacher_portal_context["seance_b"].id
        response = client.get(
            f"/api/v1/presences/seance/{seance_id}",
            headers={"Authorization": f"Bearer {token_teacher_a}"},
        )
        assert response.status_code == 403

    def test_teacher_cannot_emarger_seance_annulee(
        self, client: TestClient, teacher_portal_context: dict, token_teacher_a: str
    ):
        ctx = teacher_portal_context
        response = client.post(
            "/api/v1/presences/bulk",
            json={
                "seance_id": ctx["seance_annulee"].id,
                "presences": [
                    {
                        "etudiant_id": ctx["etudiant"].id,
                        "statut": "present",
                    }
                ],
            },
            headers={"Authorization": f"Bearer {token_teacher_a}"},
        )
        assert response.status_code == 400

    def test_teacher_bulk_presence_own_seance(
        self, client: TestClient, teacher_portal_context: dict, token_teacher_a: str
    ):
        ctx = teacher_portal_context
        response = client.post(
            "/api/v1/presences/bulk",
            json={
                "seance_id": ctx["seance_a"].id,
                "presences": [
                    {
                        "etudiant_id": ctx["etudiant"].id,
                        "statut": "present",
                    }
                ],
            },
            headers={"Authorization": f"Bearer {token_teacher_a}"},
        )
        assert response.status_code == 201, response.text


class TestTeacherResultatsAccess:
    def test_teacher_can_read_own_matiere_results(
        self, client: TestClient, teacher_portal_context: dict, token_teacher_a: str
    ):
        ctx = teacher_portal_context
        response = client.get(
            "/api/v1/resultats/mes-matieres-enseignement",
            params={
                "session_id": ctx["session"].id,
                "matiere_id": ctx["matiere_a"].id,
                "niveau_id": ctx["niveau"].id,
            },
            headers={"Authorization": f"Bearer {token_teacher_a}"},
        )
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["effectif"] >= 1
        assert any(r["matricule"] == "ETU-PORT-001" for r in body["resultats"])

    def test_teacher_cannot_read_foreign_matiere_results(
        self, client: TestClient, teacher_portal_context: dict, token_teacher_a: str
    ):
        ctx = teacher_portal_context
        response = client.get(
            "/api/v1/resultats/mes-matieres-enseignement",
            params={
                "session_id": ctx["session"].id,
                "matiere_id": ctx["matiere_b"].id,
                "niveau_id": ctx["niveau"].id,
            },
            headers={"Authorization": f"Bearer {token_teacher_a}"},
        )
        assert response.status_code == 403

    def test_teacher_cannot_read_session_wide_results(
        self, client: TestClient, teacher_portal_context: dict, token_teacher_a: str
    ):
        session_id = teacher_portal_context["session"].id
        response = client.get(
            f"/api/v1/resultats/matieres/session/{session_id}",
            headers={"Authorization": f"Bearer {token_teacher_a}"},
        )
        assert response.status_code == 403

    def test_teacher_cannot_read_classement(
        self, client: TestClient, teacher_portal_context: dict, token_teacher_a: str
    ):
        ctx = teacher_portal_context
        response = client.get(
            "/api/v1/resultats/semestres/classement",
            params={
                "niveau_id": ctx["niveau"].id,
                "filiere_id": ctx["seance_a"].filiere_id,
                "session_id": ctx["session"].id,
                "semestre": 1,
            },
            headers={"Authorization": f"Bearer {token_teacher_a}"},
        )
        assert response.status_code == 403


class TestTeacherMesEtudiants:
    def test_teacher_can_list_own_students(
        self, client: TestClient, teacher_portal_context: dict, token_teacher_a: str
    ):
        ctx = teacher_portal_context
        response = client.get(
            "/api/v1/seances/mes-etudiants",
            headers={"Authorization": f"Bearer {token_teacher_a}"},
        )
        assert response.status_code == 200, response.text
        body = response.json()
        assert any(e["matricule"] == "ETU-PORT-001" for e in body)
        assert any(
            m["matiere_id"] == ctx["matiere_a"].id
            for e in body
            for m in e["matieres"]
        )

    def test_teacher_can_filter_students_by_matiere_niveau(
        self, client: TestClient, teacher_portal_context: dict, token_teacher_a: str
    ):
        ctx = teacher_portal_context
        response = client.get(
            "/api/v1/seances/mes-etudiants",
            params={
                "matiere_id": ctx["matiere_a"].id,
                "niveau_id": ctx["niveau"].id,
            },
            headers={"Authorization": f"Bearer {token_teacher_a}"},
        )
        assert response.status_code == 200, response.text
        body = response.json()
        assert len(body) >= 1
        assert all(
            any(m["matiere_id"] == ctx["matiere_a"].id for m in e["matieres"])
            for e in body
        )

    def test_teacher_cannot_list_students_as_student(
        self, client: TestClient, db: Session
    ):
        from app.core.security import get_password_hash
        from app.models.user import User

        student_user = User(
            email="student.mes-etu@test.com",
            hashed_password=get_password_hash("password123"),
            full_name="Student Mes Etu",
            is_active=True,
            is_superuser=False,
            role="etudiant",
        )
        db.add(student_user)
        db.commit()

        token = _login(client, "student.mes-etu@test.com")
        response = client.get(
            "/api/v1/seances/mes-etudiants",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 403
