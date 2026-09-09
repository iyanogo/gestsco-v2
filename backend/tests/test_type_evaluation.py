"""
Tests du module type_evaluation - alignement types examen API vs moteur de calcul.
"""
from app.core.type_evaluation import (
    assign_note_to_slot,
    is_controle_continu,
    is_examen_type,
    is_tp,
    normalize_type_evaluation,
)
from app.utils.calcul_notes import calculer_moyenne_matiere


def test_normalize_legacy_cc_alias():
    assert normalize_type_evaluation("cc") == "controle_continu"
    assert normalize_type_evaluation("CC") == "controle_continu"


def test_normalize_legacy_examen_alias():
    assert normalize_type_evaluation("examen") == "examen_final"


def test_canonical_controle_continu_unchanged():
    assert normalize_type_evaluation("controle_continu") == "controle_continu"
    assert is_controle_continu("controle_continu") is True
    assert is_controle_continu("cc") is True


def test_tp_and_examen_types():
    assert is_tp("tp") is True
    assert is_examen_type("examen_final") is True
    assert is_examen_type("examen_partiel") is True


def test_controle_continu_note_used_in_moyenne_matiere():
    """Une note CC saisie avec le type API controle_continu doit alimenter le calcul."""
    note_cc, note_tp, note_examen = assign_note_to_slot(
        "controle_continu",
        14.0,
        note_cc=None,
        note_tp=None,
        note_examen=None,
    )
    assert note_cc == 14.0
    assert note_tp is None
    assert note_examen is None

    moyenne = calculer_moyenne_matiere(note_cc, note_tp, note_examen)
    assert moyenne is not None
    assert moyenne == 14.0


def test_legacy_cc_alias_used_in_moyenne_matiere():
    note_cc, note_tp, note_examen = assign_note_to_slot(
        "cc",
        12.0,
        note_cc=None,
        note_tp=None,
        note_examen=None,
    )
    assert note_cc == 12.0
    moyenne = calculer_moyenne_matiere(note_cc, note_tp, note_examen)
    assert moyenne == 12.0


def test_meilleure_note_kept_for_same_type():
    """Rattrapage : conserve la meilleure note pour un même type d'évaluation."""
    note_cc, _, _ = assign_note_to_slot(
        "controle_continu", 10.0, note_cc=8.0, note_tp=None, note_examen=None
    )
    assert note_cc == 10.0

    note_cc, _, _ = assign_note_to_slot(
        "controle_continu", 7.0, note_cc=10.0, note_tp=None, note_examen=None
    )
    assert note_cc == 10.0


def test_full_matiere_moyenne_with_canonical_types():
    note_cc, note_tp, note_examen = None, None, None
    for type_eval, note in [
        ("controle_continu", 12.0),
        ("tp", 14.0),
        ("examen_final", 16.0),
    ]:
        note_cc, note_tp, note_examen = assign_note_to_slot(
            type_eval,
            note,
            note_cc=note_cc,
            note_tp=note_tp,
            note_examen=note_examen,
        )
    moyenne = calculer_moyenne_matiere(note_cc, note_tp, note_examen)
    assert moyenne == 14.4  # 12*0.3 + 14*0.2 + 16*0.5
