"""Tests feuille d'appel et bulk présences."""

from datetime import date, time

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

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
from app.repositories.presence_repository import presence_repository
from app.repositories.seance_repository import seance_repository
from app.schemas.presence import PresenceBulkCreate, PresenceItem
from app.schemas.seance import SeanceCreate
from tests.conftest import next_id


@pytest.fixture
def presence_context(db: Session, admin_user: User) -> dict:
    etab_id = next_id()
    db.add(Etablissement(id=etab_id, code="ETAB-PRES", nom="Etab Test"))
    db.add(
        Batiment(
            id=next_id(),
            code="BAT-PRES",
            libelle="Bâtiment Test",
            etablissement_id=etab_id,
        )
    )
    db.flush()
    batiment = db.query(Batiment).filter(Batiment.code == "BAT-PRES").one()

    salle = Salle(
        id=next_id(),
        code="S-PRES",
        libelle="Salle Test",
        batiment_id=batiment.id,
        type_salle="cours",
        capacite=30,
    )
    creneau = CreneauHoraire(
        id=next_id(),
        code="M-PRES",
        libelle="Matin test",
        heure_debut=time(8, 0),
        heure_fin=time(10, 0),
        periode="matin",
        ordre=1,
        duree_minutes=120,
    )
    niveau = Niveau(id=next_id(), code="L3", libelle="Licence 3")
    filiere = Filiere(id=next_id(), code="INFO", libelle="Informatique")
    matiere = Matiere(id=next_id(), code="ALGO", libelle="Algorithmique")
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
    etudiant = Etudiant(
        id=next_id(),
        matricule="ETU-PRES-001",
        nom="DIALLO",
        prenom="Amadou",
        email="amadou.pres@test.com",
        is_active=True,
    )
    db.add_all([salle, creneau, niveau, filiere, matiere, annee, etudiant])
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
            enseignant_id=admin_user.id,
            salle_id=salle.id,
            creneau_id=creneau.id,
            type_seance="cours",
            date_seance=date(2026, 3, 10),
            semestre=1,
            annee_academique_id=annee.id,
            duree_minutes=120,
        ),
    )
    assert not isinstance(seance, dict)
    seance.statut = "confirmee"
    db.commit()

    return {
        "seance": seance,
        "etudiant": etudiant,
        "matiere": matiere,
        "admin_user": admin_user,
    }


class TestPresencesFeuilleAppel:
    def test_feuille_appel_lists_inscribed_students(
        self, db: Session, presence_context: dict
    ):
        ctx = presence_context
        feuille = presence_repository.get_feuille_appel_seance(db, ctx["seance"].id)
        assert feuille is not None
        assert len(feuille) == 1
        assert feuille[0]["etudiant_id"] == ctx["etudiant"].id
        assert feuille[0]["statut"] == "present"

    def test_bulk_create_and_update_presence(
        self, db: Session, presence_context: dict
    ):
        ctx = presence_context
        bulk = presence_repository.create_bulk(
            db,
            PresenceBulkCreate(
                seance_id=ctx["seance"].id,
                presences=[
                    PresenceItem(
                        etudiant_id=ctx["etudiant"].id,
                        statut="absent",
                        observation="Malade",
                    )
                ],
            ),
            ctx["admin_user"].id,
        )
        assert len(bulk) == 1
        assert bulk[0].statut == "absent"

        updated = presence_repository.create_bulk(
            db,
            PresenceBulkCreate(
                seance_id=ctx["seance"].id,
                presences=[
                    PresenceItem(
                        etudiant_id=ctx["etudiant"].id,
                        statut="present",
                    )
                ],
            ),
            ctx["admin_user"].id,
        )
        assert updated[0].statut == "present"

    def test_taux_presence_after_bulk(
        self, db: Session, presence_context: dict
    ):
        ctx = presence_context
        presence_repository.create_bulk(
            db,
            PresenceBulkCreate(
                seance_id=ctx["seance"].id,
                presences=[
                    PresenceItem(
                        etudiant_id=ctx["etudiant"].id,
                        statut="present",
                    )
                ],
            ),
            ctx["admin_user"].id,
        )
        stats = presence_repository.calculer_taux_presence_etudiant(
            db,
            ctx["etudiant"].id,
            matiere_id=ctx["matiere"].id,
        )
        assert stats["total_seances"] == 1
        assert stats["taux_presence"] == 100.0

    def test_get_feuille_appel_via_api(
        self,
        client: TestClient,
        admin_token: str,
        presence_context: dict,
    ):
        ctx = presence_context
        response = client.get(
            f"/api/v1/presences/seance/{ctx['seance'].id}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["etudiant_matricule"] == "ETU-PRES-001"
