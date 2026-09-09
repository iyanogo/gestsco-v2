"""Validation schéma délibération - alignement type_deliberation en base."""
from datetime import datetime

from app.models.deliberation import Deliberation
from app.schemas.deliberation import Deliberation as DeliberationSchema


def test_deliberation_schema_accepts_semestrielle():
    row = Deliberation(
        id=1,
        session_id=1,
        niveau_id=1,
        filiere_id=1,
        date_deliberation=datetime(2026, 1, 15),
        type_deliberation="semestrielle",
        semestre=1,
        nombre_etudiants=10,
        nombre_admis=8,
        nombre_ajournes=1,
        nombre_redoublants=1,
        statut="en_cours",
        publiee=False,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    parsed = DeliberationSchema.model_validate(row)
    assert parsed.type_deliberation == "semestrielle"
