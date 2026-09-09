"""
Types d'évaluation canoniques (alignés sur le modèle Examen et le schéma Pydantic).

Valeurs API : controle_continu, examen_partiel, examen_final, tp, projet.
Les alias historiques (cc, examen) sont normalisés pour le moteur de calcul.
"""

from enum import Enum


class TypeEvaluation(str, Enum):
    CONTROLE_CONTINU = "controle_continu"
    EXAMEN_PARTIEL = "examen_partiel"
    EXAMEN_FINAL = "examen_final"
    TP = "tp"
    PROJET = "projet"


# Alias legacy encore présents dans d'anciennes données ou docstrings
LEGACY_TYPE_ALIASES: dict[str, str] = {
    "cc": TypeEvaluation.CONTROLE_CONTINU.value,
    "examen": TypeEvaluation.EXAMEN_FINAL.value,
}

CANONICAL_TYPES = frozenset(e.value for e in TypeEvaluation)


def normalize_type_evaluation(raw: str | None) -> str:
    """Retourne la valeur canonique ; laisse inchangé si déjà canonique ou inconnu."""
    if not raw:
        return ""
    key = raw.strip().lower()
    if key in CANONICAL_TYPES:
        return key
    return LEGACY_TYPE_ALIASES.get(key, key)


def is_controle_continu(raw: str | None) -> bool:
    return normalize_type_evaluation(raw) == TypeEvaluation.CONTROLE_CONTINU.value


def is_tp(raw: str | None) -> bool:
    return normalize_type_evaluation(raw) == TypeEvaluation.TP.value


def is_examen_type(raw: str | None) -> bool:
    """Examen partiel ou final - utilisé pour la composante examen de la moyenne matière."""
    normalized = normalize_type_evaluation(raw)
    return normalized in (
        TypeEvaluation.EXAMEN_FINAL.value,
        TypeEvaluation.EXAMEN_PARTIEL.value,
    )


def assign_note_to_slot(
    type_evaluation: str | None,
    note_sur_20: float | None,
    *,
    note_cc: float | None,
    note_tp: float | None,
    note_examen: float | None,
) -> tuple[float | None, float | None, float | None]:
    """
    Met à jour la bonne composante (CC / TP / examen) avec la note sur 20.
    Pour plusieurs examens du même type, conserve la meilleure note (rattrapage).
    """
    if note_sur_20 is None:
        return note_cc, note_tp, note_examen

    if is_controle_continu(type_evaluation):
        best = note_cc if note_cc is not None else note_sur_20
        if note_cc is not None:
            best = max(note_cc, note_sur_20)
        return best, note_tp, note_examen

    if is_tp(type_evaluation):
        best = note_tp if note_tp is not None else note_sur_20
        if note_tp is not None:
            best = max(note_tp, note_sur_20)
        return note_cc, best, note_examen

    if is_examen_type(type_evaluation):
        best = note_examen if note_examen is not None else note_sur_20
        if note_examen is not None:
            best = max(note_examen, note_sur_20)
        return note_cc, note_tp, best

    return note_cc, note_tp, note_examen
