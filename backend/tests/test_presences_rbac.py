"""RBAC présences - saisie réservée scolarité / enseignant titulaire."""

from datetime import date, time

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.annee_academique import AnneeAcademique
from app.models.batiment import Batiment
from app.models.creneau_horaire import CreneauHoraire
from app.models.etablissement import Etablissement
from app.models.etudiant import Etudiant
from app.models.filiere import Filiere
from app.models.inscription import Inscription
from app.models.inscription_matiere import InscriptionMatiere
from app.models.matiere import Matiere
from app.models.niveau import Niveau
from app.models.salle import Salle
from app.models.user import User
from app.repositories.seance_repository import seance_repository
from app.schemas.seance import SeanceCreate
from tests.conftest import next_id


def _login(client: TestClient, email: str, password: str = "password123") -> str:
    response = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password},
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


@pytest.fixture
def presences_rbac_context(db: Session) -> dict:
    teacher = User(
        email="teacher.presence@test.com",
        hashed_password=get_password_hash("password123"),
        full_name="Prof Présence",
        is_active=True,
        is_superuser=False,
        role="enseignant",
    )
    etudiant_user = User(
        email="etudiant.presence@test.com",
        hashed_password=get_password_hash("password123"),
        full_name="Étudiant Présence",
        is_active=True,
        is_superuser=False,
        role="etudiant",
    )
    scolarite = User(
        email="scolarite.presence@test.com",
        hashed_password=get_password_hash("password123"),
        full_name="Agent Scolarité",
        is_active=True,
        is_superuser=False,
        role="scolarite",
    )
    db.add_all([teacher, etudiant_user, scolarite])
    db.flush()

    etab_id = next_id()
    db.add(Etablissement(id=etab_id, code="ETAB-PRES-RBAC", nom="Etab RBAC"))
    db.flush()
    batiment = Batiment(
        id=next_id(),
        code="BAT-PRES-RBAC",
        libelle="Bâtiment RBAC",
        etablissement_id=etab_id,
    )
    salle = Salle(
        id=next_id(),
        code="S-PRES-RBAC",
        libelle="Salle RBAC",
        batiment_id=batiment.id,
        type_salle="cours",
        capacite=30,
    )
    creneau = CreneauHoraire(
        id=next_id(),
        code="M-PRES-RBAC",
        libelle="Matin RBAC",
        heure_debut=time(8, 0),
        heure_fin=time(10, 0),
        periode="matin",
        ordre=1,
        duree_minutes=120,
    )
    niveau = Niveau(id=next_id(), code="L3-RBAC", libelle="Licence 3 RBAC")
    filiere = Filiere(id=next_id(), code="INFO-RBAC", libelle="Info RBAC")
    matiere = Matiere(id=next_id(), code="ALGO-RBAC", libelle="Algo RBAC")
    annee = AnneeAcademique(
        id=next_id(),
        code="2025-2026-RBAC",
        libelle="2025-2026 RBAC",
        date_debut=date(2025, 9, 1),
        date_fin=date(2026, 8, 31),
        date_debut_inscriptions=date(2025, 6, 1),
        date_fin_inscriptions=date(2025, 10, 31),
        statut="en_cours",
        is_active=True,
        is_current=True,
    )
    etudiant = Etudiant(
        id=next_id(),
        user_id=etudiant_user.id,
        matricule="ETU-PRES-RBAC",
        nom="TEST",
        prenom="Étudiant",
        email=etudiant_user.email,
        is_active=True,
    )
    db.add_all([batiment, salle, creneau, niveau, filiere, matiere, annee, etudiant])
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
    db.add(
        InscriptionMatiere(
            id=next_id(),
            inscription_id=inscription.id,
            matiere_id=matiere.id,
            semestre=1,
            is_active=True,
        )
    )
    db.commit()

    seance = seance_repository.create_with_verification(
        db,
        SeanceCreate(
            matiere_id=matiere.id,
            niveau_id=niveau.id,
            filiere_id=filiere.id,
            enseignant_id=teacher.id,
            salle_id=salle.id,
            creneau_id=creneau.id,
            type_seance="cours",
            date_seance=date(2026, 4, 14),
            semestre=1,
            annee_academique_id=annee.id,
            duree_minutes=120,
        ),
    )
    assert not isinstance(seance, dict)
    seance.statut = "confirmee"
    db.commit()

    return {
        "teacher": teacher,
        "etudiant": etudiant,
        "niveau": niveau,
        "seance": seance,
    }


@pytest.fixture
def token_teacher_presence(client: TestClient, presences_rbac_context: dict) -> str:
    return _login(client, presences_rbac_context["teacher"].email)


@pytest.fixture
def token_etudiant_presence(client: TestClient, presences_rbac_context: dict) -> str:
    return _login(client, "etudiant.presence@test.com")


@pytest.fixture
def token_scolarite_presence(client: TestClient, presences_rbac_context: dict) -> str:
    return _login(client, "scolarite.presence@test.com")


class TestPresencesRbac:
    def test_etudiant_cannot_bulk_presence(
        self,
        client: TestClient,
        presences_rbac_context: dict,
        token_etudiant_presence: str,
    ):
        ctx = presences_rbac_context
        response = client.post(
            "/api/v1/presences/bulk",
            json={
                "seance_id": ctx["seance"].id,
                "presences": [
                    {"etudiant_id": ctx["etudiant"].id, "statut": "present"}
                ],
            },
            headers={"Authorization": f"Bearer {token_etudiant_presence}"},
        )
        assert response.status_code == 403

    def test_random_user_cannot_bulk_presence(
        self,
        client: TestClient,
        presences_rbac_context: dict,
        user_token: str,
    ):
        ctx = presences_rbac_context
        response = client.post(
            "/api/v1/presences/bulk",
            json={
                "seance_id": ctx["seance"].id,
                "presences": [
                    {"etudiant_id": ctx["etudiant"].id, "statut": "present"}
                ],
            },
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert response.status_code == 403

    def test_teacher_can_bulk_own_seance(
        self,
        client: TestClient,
        presences_rbac_context: dict,
        token_teacher_presence: str,
    ):
        ctx = presences_rbac_context
        response = client.post(
            "/api/v1/presences/bulk",
            json={
                "seance_id": ctx["seance"].id,
                "presences": [
                    {"etudiant_id": ctx["etudiant"].id, "statut": "present"}
                ],
            },
            headers={"Authorization": f"Bearer {token_teacher_presence}"},
        )
        assert response.status_code == 201, response.text

    def test_scolarite_can_read_feuille_appel(
        self,
        client: TestClient,
        presences_rbac_context: dict,
        token_scolarite_presence: str,
    ):
        seance_id = presences_rbac_context["seance"].id
        response = client.get(
            f"/api/v1/presences/seance/{seance_id}",
            headers={"Authorization": f"Bearer {token_scolarite_presence}"},
        )
        assert response.status_code == 200, response.text
        assert isinstance(response.json(), list)

    def test_teacher_cannot_read_absents_frequents(
        self,
        client: TestClient,
        presences_rbac_context: dict,
        token_teacher_presence: str,
    ):
        niveau_id = presences_rbac_context["niveau"].id
        response = client.get(
            "/api/v1/presences/absents-frequents",
            params={"niveau_id": niveau_id},
            headers={"Authorization": f"Bearer {token_teacher_presence}"},
        )
        assert response.status_code == 403

    def test_scolarite_can_read_absents_frequents(
        self,
        client: TestClient,
        presences_rbac_context: dict,
        token_scolarite_presence: str,
    ):
        niveau_id = presences_rbac_context["niveau"].id
        response = client.get(
            "/api/v1/presences/absents-frequents",
            params={"niveau_id": niveau_id},
            headers={"Authorization": f"Bearer {token_scolarite_presence}"},
        )
        assert response.status_code == 200, response.text
        assert isinstance(response.json(), list)
