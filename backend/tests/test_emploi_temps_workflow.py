"""Tests workflow emploi du temps brouillon → valide → publié."""

from datetime import date

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.annee_academique import AnneeAcademique
from app.models.filiere import Filiere
from app.models.niveau import Niveau
from app.repositories.emploi_temps_repository import emploi_temps_repository
from app.schemas.emploi_temps import EmploiTempsCreate
from tests.conftest import next_id


@pytest.fixture
def edt_workflow_context(db: Session) -> dict:
    niveau = Niveau(id=next_id(), code="L2-EDT-WF", libelle="L2 Workflow")
    filiere = Filiere(id=next_id(), code="INFO-WF", libelle="Info Workflow")
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
    db.add_all([niveau, filiere, annee])
    db.commit()
    return {"niveau": niveau, "filiere": filiere, "annee": annee}


class TestEmploiTempsWorkflow:
    def test_brouillon_valider_publier(
        self, db: Session, edt_workflow_context: dict, admin_token: str, client: TestClient
    ):
        ctx = edt_workflow_context
        created = emploi_temps_repository.create(
            db,
            EmploiTempsCreate(
                code="EDT-WF-001",
                libelle="EDT test workflow",
                niveau_id=ctx["niveau"].id,
                filiere_id=ctx["filiere"].id,
                semestre=1,
                annee_academique_id=ctx["annee"].id,
                date_debut=date(2025, 9, 1),
                date_fin=date(2025, 12, 31),
            ),
        )
        assert created.statut == "brouillon"

        valider_resp = client.patch(
            f"/api/v1/emplois-temps/{created.id}/valider",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert valider_resp.status_code == 200, valider_resp.text
        assert valider_resp.json()["statut"] == "valide"

        publier_resp = client.patch(
            f"/api/v1/emplois-temps/{created.id}/publier",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert publier_resp.status_code == 200, publier_resp.text
        body = publier_resp.json()
        assert body["statut"] == "publie"
        assert body["publie_par"] is not None

        actif = emploi_temps_repository.get_actif(
            db, ctx["niveau"].id, ctx["filiere"].id, 1, ctx["annee"].id
        )
        assert actif is not None
        assert actif.id == created.id

    def test_publier_archive_ancien(
        self, db: Session, edt_workflow_context: dict, admin_user
    ):
        ctx = edt_workflow_context
        first = emploi_temps_repository.create(
            db,
            EmploiTempsCreate(
                code="EDT-WF-P1",
                libelle="Premier publié",
                niveau_id=ctx["niveau"].id,
                filiere_id=ctx["filiere"].id,
                semestre=1,
                annee_academique_id=ctx["annee"].id,
                date_debut=date(2025, 9, 1),
                date_fin=date(2025, 12, 31),
            ),
        )
        emploi_temps_repository.publier(db, first.id, admin_user.id)

        from app.models.emploi_temps import EmploiTemps as EmploiTempsModel

        second = EmploiTempsModel(
            code="EDT-WF-P2",
            libelle="Second publié",
            niveau_id=ctx["niveau"].id,
            filiere_id=ctx["filiere"].id,
            semestre=1,
            annee_academique_id=ctx["annee"].id,
            date_debut=date(2025, 9, 1),
            date_fin=date(2025, 12, 31),
            statut="brouillon",
            version=2,
        )
        db.add(second)
        db.commit()
        db.refresh(second)
        emploi_temps_repository.publier(db, second.id, admin_user.id)

        db.refresh(first)
        assert first.statut == "archive"
        assert second.statut == "publie"
