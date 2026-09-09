"""Tests snapshots audit."""

from app.models.deliberation import Deliberation
from app.models.etudiant import Etudiant
from app.models.examen import Examen
from app.models.inscription import Inscription
from app.models.note import Note
from app.utils.audit_snapshots import (
    deliberation_snapshot,
    etudiant_snapshot,
    examen_snapshot,
    fields_snapshot,
    inscription_snapshot,
    note_snapshot,
)


def test_inscription_snapshot_fields():
    insc = Inscription(
        id=1,
        etudiant_id=10,
        filiere_id=2,
        niveau_id=3,
        annee_academique="2025-2026",
        type_inscription="nouvelle",
        statut_inscription="en_cours",
        is_active=True,
    )
    snap = inscription_snapshot(insc)
    assert snap["etudiant_id"] == 10
    assert snap["statut_inscription"] == "en_cours"


def test_etudiant_snapshot_fields():
    etu = Etudiant(id=1, nom="Diallo", prenom="Amadou", email="a@test.com", statut="actif")
    snap = etudiant_snapshot(etu)
    assert snap["nom"] == "Diallo"
    assert snap["email"] == "a@test.com"


def test_note_snapshot_fields():
    note = Note(id=1, examen_id=5, etudiant_id=10, note=14.5, note_sur_20=14.5, is_valide=True)
    snap = note_snapshot(note)
    assert snap["examen_id"] == 5
    assert snap["note"] == 14.5


def test_examen_snapshot_fields():
    examen = Examen(id=1, session_id=2, matiere_id=3, niveau_id=4, type_evaluation="cc", statut="planifie")
    snap = examen_snapshot(examen)
    assert snap["type_evaluation"] == "cc"
    assert snap["statut"] == "planifie"


def test_deliberation_snapshot_fields():
    deliberation = Deliberation(
        id=1,
        session_id=2,
        niveau_id=3,
        filiere_id=4,
        type_deliberation="semestre",
        statut="en_cours",
        publiee=False,
    )
    snap = deliberation_snapshot(deliberation)
    assert snap["publiee"] is False
    assert snap["type_deliberation"] == "semestre"


def test_fields_snapshot_generic():
    etu = Etudiant(id=1, nom="Test", prenom="User", email="x@test.com", statut="actif")
    snap = fields_snapshot(etu, "nom", "email", "missing_field")
    assert snap["nom"] == "Test"
    assert snap["email"] == "x@test.com"
    assert "missing_field" not in snap
