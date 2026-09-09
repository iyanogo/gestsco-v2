"""Tests conflits sur mise à jour de séance (PUT /seances/{id})."""

from datetime import date, time

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.annee_academique import AnneeAcademique
from app.models.batiment import Batiment
from app.models.creneau_horaire import CreneauHoraire
from app.models.etablissement import Etablissement
from app.models.matiere import Matiere
from app.models.niveau import Niveau
from app.models.salle import Salle
from app.models.user import User
from app.schemas.seance import SeanceCreate, SeanceUpdate
from app.repositories.seance_repository import seance_repository
from tests.conftest import next_id


@pytest.fixture
def seance_planning_context(db: Session, admin_user: User) -> dict:
    """Contexte minimal pour créer des séances avec conflits salle/créneau."""
    etab_id = next_id()
    db.add(Etablissement(id=etab_id, code="ETAB-EDT", nom="Etab Test"))
    db.add(
        Batiment(
            id=next_id(),
            code="BAT-EDT",
            libelle="Bâtiment Test",
            etablissement_id=etab_id,
        )
    )
    db.flush()
    batiment = db.query(Batiment).filter(Batiment.code == "BAT-EDT").one()

    salle = Salle(
        id=next_id(),
        code="S-EDT",
        libelle="Salle Test",
        batiment_id=batiment.id,
        type_salle="cours",
        capacite=30,
    )
    creneau = CreneauHoraire(
        id=next_id(),
        code="M-EDT",
        libelle="Matin test",
        heure_debut=time(8, 0),
        heure_fin=time(10, 0),
        periode="matin",
        ordre=1,
        duree_minutes=120,
    )
    niveau = Niveau(id=next_id(), code="L3", libelle="Licence 3")
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
    db.add_all([salle, creneau, niveau, matiere, annee])
    db.commit()

    base = {
        "matiere_id": matiere.id,
        "niveau_id": niveau.id,
        "enseignant_id": admin_user.id,
        "salle_id": salle.id,
        "creneau_id": creneau.id,
        "type_seance": "cours",
        "semestre": 1,
        "annee_academique_id": annee.id,
        "duree_minutes": 120,
    }
    return {
        **base,
        "salle": salle,
        "creneau": creneau,
        "date_a": date(2026, 1, 12),
        "date_b": date(2026, 1, 13),
    }


class TestSeanceUpdateConflicts:
    def test_update_type_only_succeeds_without_revalidation(
        self, db: Session, seance_planning_context: dict
    ):
        ctx = seance_planning_context
        create = SeanceCreate(
            **{k: ctx[k] for k in SeanceCreate.model_fields if k in ctx},
            date_seance=ctx["date_a"],
        )
        seance = seance_repository.create_with_verification(db, create)
        assert not isinstance(seance, dict)

        updated = seance_repository.update_with_verification(
            db,
            seance.id,
            SeanceUpdate(type_seance="td"),
        )
        assert not isinstance(updated, dict)
        assert updated.type_seance == "td"

    def test_update_to_conflicting_slot_returns_errors(
        self, db: Session, seance_planning_context: dict
    ):
        ctx = seance_planning_context
        fields = {k: ctx[k] for k in SeanceCreate.model_fields if k in ctx}

        first = seance_repository.create_with_verification(
            db, SeanceCreate(**fields, date_seance=ctx["date_a"])
        )
        second = seance_repository.create_with_verification(
            db, SeanceCreate(**fields, date_seance=ctx["date_b"])
        )
        assert not isinstance(first, dict)
        assert not isinstance(second, dict)

        result = seance_repository.update_with_verification(
            db,
            second.id,
            SeanceUpdate(date_seance=ctx["date_a"]),
        )
        assert isinstance(result, dict)
        assert "errors" in result
        assert any("salle" in e.lower() for e in result["errors"])

    def test_put_seance_conflict_via_api_returns_400(
        self,
        client: TestClient,
        admin_token: str,
        db: Session,
        seance_planning_context: dict,
    ):
        ctx = seance_planning_context
        fields = {k: ctx[k] for k in SeanceCreate.model_fields if k in ctx}

        first = seance_repository.create_with_verification(
            db, SeanceCreate(**fields, date_seance=ctx["date_a"])
        )
        second = seance_repository.create_with_verification(
            db, SeanceCreate(**fields, date_seance=ctx["date_b"])
        )
        assert not isinstance(first, dict)
        assert not isinstance(second, dict)

        response = client.put(
            f"/api/v1/seances/{second.id}",
            json={"date_seance": ctx["date_a"].isoformat()},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 400
        detail = response.json()["detail"]
        assert isinstance(detail, list)
        assert len(detail) >= 1
