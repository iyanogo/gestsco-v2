"""Tests unitaires des règles de délibération LMD."""
from app.utils.deliberation_rules import (
    DeliberationConfigSnapshot,
    determiner_decision_annuelle,
    determiner_decision_semestre,
)


def _config() -> DeliberationConfigSnapshot:
    return DeliberationConfigSnapshot(
        moyenne_validation=10.0,
        moyenne_passage_conditionnel=8.0,
        nombre_matieres_dette_max=2,
        compensation_semestres=True,
    )


def test_validation_semestre_simple_admis():
    decision = determiner_decision_semestre(
        moyenne=12.0,
        credits_obtenus=28,
        credits_inscrits=30,
        matieres_dette=0,
        config=_config(),
    )
    assert decision == "admis"


def test_compensation_reussie():
    """S1=9, S2=11 → moyenne annuelle 10 → admis par compensation."""
    decision, passage, compensation = determiner_decision_annuelle(
        moyenne_s1=9.0,
        moyenne_s2=11.0,
        moyenne_annuelle=10.0,
        credits_obtenus=55,
        credits_inscrits=60,
        matieres_dette=1,
        config=_config(),
    )
    assert compensation is True
    assert decision == "admis"
    assert passage is True


def test_compensation_echouee():
    """Moyenne annuelle < 10 malgré compensation activée."""
    decision, passage, compensation = determiner_decision_annuelle(
        moyenne_s1=8.0,
        moyenne_s2=9.0,
        moyenne_annuelle=8.5,
        credits_obtenus=40,
        credits_inscrits=60,
        matieres_dette=3,
        config=_config(),
    )
    assert compensation is False
    assert decision in ("ajourne", "admis_avec_dette", "exclus")
    assert passage is False or decision == "admis_avec_dette"


def test_passage_conditionnel_accepte():
    decision = determiner_decision_semestre(
        moyenne=8.5,
        credits_obtenus=20,
        credits_inscrits=30,
        matieres_dette=1,
        config=_config(),
    )
    assert decision == "admis_avec_dette"


def test_passage_conditionnel_refuse_dettes():
    decision = determiner_decision_semestre(
        moyenne=8.5,
        credits_obtenus=20,
        credits_inscrits=30,
        matieres_dette=5,
        config=_config(),
    )
    assert decision == "ajourne"


def test_exclusion_moyenne_tres_basse():
    config = DeliberationConfigSnapshot(
        moyenne_validation=10.0,
        moyenne_passage_conditionnel=8.0,
        nombre_matieres_dette_max=2,
    )
    decision = determiner_decision_semestre(
        moyenne=5.0,
        credits_obtenus=10,
        credits_inscrits=30,
        matieres_dette=4,
        config=config,
    )
    assert decision == "exclus"
