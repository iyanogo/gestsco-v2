"""Tests unitaires - calcul résultats aligné sur ConfigurationDeliberation."""
from app.utils.calcul_notes import determiner_decision_matiere
from app.utils.deliberation_rules import DeliberationConfigSnapshot


def _config_seuil_12() -> DeliberationConfigSnapshot:
    return DeliberationConfigSnapshot(moyenne_validation=12.0)


def test_matiere_non_validee_seuil_12():
    """Note 11/20 → ajourné si moyenne_validation = 12."""
    decision, credits = determiner_decision_matiere(
        moyenne=11.0,
        credit=3.0,
        config=_config_seuil_12(),
    )
    assert decision == "ajourne"
    assert credits == 0.0


def test_matiere_validee_seuil_12():
    """Note 12/20 → admis si moyenne_validation = 12."""
    decision, credits = determiner_decision_matiere(
        moyenne=12.0,
        credit=3.0,
        config=_config_seuil_12(),
    )
    assert decision == "admis"
    assert credits == 3.0


def test_matiere_defaut_seuil_10_sans_config():
    decision, credits = determiner_decision_matiere(moyenne=10.0, credit=3.0)
    assert decision == "admis"
    assert credits == 3.0


def test_note_eliminatoire_bloque_validation():
    """Moyenne suffisante mais une composante sous note_eliminatoire → ajourné."""
    config = DeliberationConfigSnapshot(
        moyenne_validation=10.0,
        note_eliminatoire=8.0,
    )
    decision, credits = determiner_decision_matiere(
        moyenne=14.0,
        credit=3.0,
        config=config,
        notes_composantes=[7.5, 16.0, 15.0],
    )
    assert decision == "ajourne"
    assert credits == 0.0


def test_note_eliminatoire_absente_pas_de_blocage():
    config = DeliberationConfigSnapshot(moyenne_validation=10.0, note_eliminatoire=8.0)
    decision, credits = determiner_decision_matiere(
        moyenne=14.0,
        credit=3.0,
        config=config,
        notes_composantes=[9.0, 16.0, 15.0],
    )
    assert decision == "admis"
    assert credits == 3.0


def test_coherence_resultats_deliberation_seuil_12():
    """Même règle matière que deliberation_rules pour seuil configurable."""
    config = DeliberationConfigSnapshot(moyenne_validation=12.0)
    decision_calc, _ = determiner_decision_matiere(11.0, 3.0, config=config)
    decision_calc_ok, _ = determiner_decision_matiere(12.0, 3.0, config=config)
    assert decision_calc == "ajourne"
    assert decision_calc_ok == "admis"


def test_taux_presence_insuffisant_bloque_validation():
    """Bonne moyenne mais taux de présence sous le seuil → ajourné."""
    config = DeliberationConfigSnapshot(
        moyenne_validation=10.0,
        taux_presence_min=75.0,
    )
    decision, credits = determiner_decision_matiere(
        moyenne=14.0,
        credit=3.0,
        config=config,
        taux_presence=70.0,
    )
    assert decision == "ajourne"
    assert credits == 0.0


def test_taux_presence_suffisant_pas_de_blocage():
    config = DeliberationConfigSnapshot(
        moyenne_validation=10.0,
        taux_presence_min=75.0,
    )
    decision, credits = determiner_decision_matiere(
        moyenne=14.0,
        credit=3.0,
        config=config,
        taux_presence=80.0,
    )
    assert decision == "admis"
    assert credits == 3.0


def test_taux_presence_absent_pas_de_blocage():
    """Sans données de présence, ne pas bloquer la validation."""
    config = DeliberationConfigSnapshot(
        moyenne_validation=10.0,
        taux_presence_min=75.0,
    )
    decision, credits = determiner_decision_matiere(
        moyenne=14.0,
        credit=3.0,
        config=config,
        taux_presence=None,
    )
    assert decision == "admis"
    assert credits == 3.0
