"""Tests sérialisation inscriptions - codes année legacy."""

from datetime import date, datetime

from app.models.inscription import Inscription
from app.utils.inscription_response import serialize_inscription, serialize_inscriptions


def _make_inscription(**overrides) -> Inscription:
    base = dict(
        id=1,
        etudiant_id=1,
        filiere_id=1,
        niveau_id=1,
        annee_academique="E2E-COMP-2025",
        type_inscription="nouvelle",
        regime_etudes=None,
        statut_inscription="en_cours",
        frais_inscription=0.0,
        frais_payes=0.0,
        date_inscription=date(2025, 9, 1),
        is_active=True,
        created_at=datetime(2025, 9, 1),
        updated_at=datetime(2025, 9, 1),
    )
    base.update(overrides)
    return Inscription(**base)


class TestSerializeInscription:
    def test_legacy_annee_coerced_on_read(self):
        row = _make_inscription()
        result = serialize_inscription(row)
        assert result.annee_academique == "2025-2026"

    def test_valid_annee_unchanged(self):
        row = _make_inscription(annee_academique="2024-2025")
        result = serialize_inscription(row)
        assert result.annee_academique == "2024-2025"

    def test_list_includes_legacy_rows(self):
        rows = [
            _make_inscription(id=1),
            _make_inscription(id=2, annee_academique="2025-2026"),
        ]
        results = serialize_inscriptions(rows)
        assert len(results) == 2
        assert results[0].annee_academique == "2025-2026"
