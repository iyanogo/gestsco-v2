"""Tests conflits croisés séances ↔ réservations de salles."""

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
from app.repositories.reservation_salle_repository import reservation_salle_repository
from app.repositories.seance_repository import seance_repository
from app.schemas.reservation_salle import ReservationSalleCreate, ReservationSalleUpdate
from app.schemas.seance import SeanceCreate
from tests.conftest import next_id


@pytest.fixture
def edt_context(db: Session, admin_user: User) -> dict:
    """Contexte partagé salle + créneau pour tests séance/réservation."""
    etab_id = next_id()
    db.add(Etablissement(id=etab_id, code="ETAB-RES", nom="Etab Test"))
    db.add(
        Batiment(
            id=next_id(),
            code="BAT-RES",
            libelle="Bâtiment Test",
            etablissement_id=etab_id,
        )
    )
    db.flush()
    batiment = db.query(Batiment).filter(Batiment.code == "BAT-RES").one()

    salle = Salle(
        id=next_id(),
        code="S-RES",
        libelle="Salle Test",
        batiment_id=batiment.id,
        type_salle="cours",
        capacite=30,
    )
    creneau = CreneauHoraire(
        id=next_id(),
        code="M-RES",
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

    reservation_date = date(2026, 2, 10)
    return {
        "salle": salle,
        "creneau": creneau,
        "admin_user": admin_user,
        "reservation_date": reservation_date,
        "heure_debut": time(8, 0),
        "heure_fin": time(10, 0),
        "seance_fields": {
            "matiere_id": matiere.id,
            "niveau_id": niveau.id,
            "enseignant_id": admin_user.id,
            "salle_id": salle.id,
            "creneau_id": creneau.id,
            "type_seance": "cours",
            "semestre": 1,
            "annee_academique_id": annee.id,
            "duree_minutes": 120,
            "date_seance": reservation_date,
        },
    }


class TestReservationsCrossConflicts:
    def test_reservation_create_blocked_by_existing_seance(
        self, db: Session, edt_context: dict
    ):
        ctx = edt_context
        seance = seance_repository.create_with_verification(
            db, SeanceCreate(**ctx["seance_fields"])
        )
        assert not isinstance(seance, dict)

        result = reservation_salle_repository.create_with_verification(
            db,
            ReservationSalleCreate(
                salle_id=ctx["salle"].id,
                date_reservation=ctx["reservation_date"],
                heure_debut=ctx["heure_debut"],
                heure_fin=ctx["heure_fin"],
                motif="Réunion test",
            ),
            ctx["admin_user"].id,
        )
        assert isinstance(result, dict)
        assert "errors" in result

    def test_seance_create_blocked_by_approved_reservation(
        self, db: Session, edt_context: dict
    ):
        ctx = edt_context
        reservation = reservation_salle_repository.create_with_verification(
            db,
            ReservationSalleCreate(
                salle_id=ctx["salle"].id,
                date_reservation=ctx["reservation_date"],
                heure_debut=ctx["heure_debut"],
                heure_fin=ctx["heure_fin"],
                motif="Conférence test",
            ),
            ctx["admin_user"].id,
        )
        assert not isinstance(reservation, dict)

        approved = reservation_salle_repository.approuver(
            db, reservation.id, ctx["admin_user"].id
        )
        assert not isinstance(approved, dict)

        seance = seance_repository.create_with_verification(
            db, SeanceCreate(**ctx["seance_fields"])
        )
        assert isinstance(seance, dict)
        assert "errors" in seance

    def test_put_reservation_to_conflicting_slot_returns_400(
        self,
        client: TestClient,
        admin_token: str,
        db: Session,
        edt_context: dict,
    ):
        ctx = edt_context
        seance = seance_repository.create_with_verification(
            db, SeanceCreate(**ctx["seance_fields"])
        )
        assert not isinstance(seance, dict)

        reservation = reservation_salle_repository.create_with_verification(
            db,
            ReservationSalleCreate(
                salle_id=ctx["salle"].id,
                date_reservation=date(2026, 2, 11),
                heure_debut=ctx["heure_debut"],
                heure_fin=ctx["heure_fin"],
                motif="Autre jour",
            ),
            ctx["admin_user"].id,
        )
        assert not isinstance(reservation, dict)

        response = client.put(
            f"/api/v1/reservations-salles/{reservation.id}",
            json={"date_reservation": ctx["reservation_date"].isoformat()},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 400
        assert isinstance(response.json()["detail"], list)

    def test_approuver_blocked_when_seance_exists(
        self, db: Session, edt_context: dict
    ):
        ctx = edt_context
        reservation = reservation_salle_repository.create_with_verification(
            db,
            ReservationSalleCreate(
                salle_id=ctx["salle"].id,
                date_reservation=ctx["reservation_date"],
                heure_debut=ctx["heure_debut"],
                heure_fin=ctx["heure_fin"],
                motif="Demande avant séance",
            ),
            ctx["admin_user"].id,
        )
        assert not isinstance(reservation, dict)

        seance = seance_repository.create_with_verification(
            db, SeanceCreate(**ctx["seance_fields"])
        )
        assert not isinstance(seance, dict)

        result = reservation_salle_repository.approuver(
            db, reservation.id, ctx["admin_user"].id
        )
        assert isinstance(result, dict)
        assert "errors" in result

    def test_update_reservation_motif_only_succeeds(
        self, db: Session, edt_context: dict
    ):
        ctx = edt_context
        reservation = reservation_salle_repository.create_with_verification(
            db,
            ReservationSalleCreate(
                salle_id=ctx["salle"].id,
                date_reservation=date(2026, 2, 12),
                heure_debut=ctx["heure_debut"],
                heure_fin=ctx["heure_fin"],
                motif="Motif initial",
            ),
            ctx["admin_user"].id,
        )
        assert not isinstance(reservation, dict)

        updated = reservation_salle_repository.update_with_verification(
            db, reservation.id, ReservationSalleUpdate(motif="Motif modifié")
        )
        assert not isinstance(updated, dict)
        assert updated.motif == "Motif modifié"
