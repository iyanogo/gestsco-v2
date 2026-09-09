"""
Règles de délibération LMD - fonctions pures testables.

Consomme des agrégats déjà calculés (ResultatSemestre / ResultatAnnuel / ResultatMatiere),
pas des notes brutes. Les seuils proviennent de ConfigurationDeliberation.
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Optional


@dataclass(frozen=True)
class DeliberationConfigSnapshot:
    """Sous-ensemble de ConfigurationDeliberation pour le moteur de règles."""

    moyenne_validation: float = 10.0
    moyenne_passage_conditionnel: float = 8.0
    nombre_matieres_dette_max: int = 2
    credits_min_passage: Optional[int] = None
    compensation_semestres: bool = True
    note_eliminatoire: Optional[float] = None
    taux_presence_min: Optional[float] = None
    seuil_credits_ratio: float = 0.7

    @classmethod
    def from_model(cls, config) -> "DeliberationConfigSnapshot":
        if config is None:
            return cls()
        return cls(
            moyenne_validation=float(config.moyenne_validation or 10),
            moyenne_passage_conditionnel=float(config.moyenne_passage_conditionnel or 8),
            nombre_matieres_dette_max=int(config.nombre_matieres_dette_max or 2),
            credits_min_passage=config.credits_min_passage,
            compensation_semestres=bool(config.compensation_semestres),
            note_eliminatoire=(
                float(config.note_eliminatoire) if config.note_eliminatoire is not None else None
            ),
            taux_presence_min=(
                float(config.taux_presence_min)
                if getattr(config, "taux_presence_min", None) is not None
                else None
            ),
        )

    def peut_compenser_semestres(self, moyenne_s1: float, moyenne_s2: float) -> bool:
        if not self.compensation_semestres:
            return False
        moyenne_annuelle = (moyenne_s1 + moyenne_s2) / 2
        return moyenne_annuelle >= self.moyenne_validation

    def peut_passer_conditionnel(self, moyenne: float, matieres_dette: int) -> bool:
        if moyenne < self.moyenne_passage_conditionnel:
            return False
        if matieres_dette > self.nombre_matieres_dette_max:
            return False
        return True

    def credits_suffisants(self, credits_obtenus: float, credits_inscrits: float) -> bool:
        if self.credits_min_passage is not None:
            return credits_obtenus >= self.credits_min_passage
        if credits_inscrits <= 0:
            return False
        return (credits_obtenus / credits_inscrits) >= self.seuil_credits_ratio


def determiner_decision_semestre(
    moyenne: Optional[float],
    credits_obtenus: float,
    credits_inscrits: float,
    matieres_dette: int,
    config: DeliberationConfigSnapshot,
) -> str:
    """
    Décisions : admis | admis_avec_dette | ajourne | exclus | en_cours
    """
    if moyenne is None:
        return "en_cours"

    if _est_exclu(moyenne, matieres_dette, config):
        return "exclus"

    if moyenne >= config.moyenne_validation:
        if config.credits_suffisants(credits_obtenus, credits_inscrits):
            return "admis"
        return "admis_avec_dette"

    if config.peut_passer_conditionnel(moyenne, matieres_dette):
        return "admis_avec_dette"

    return "ajourne"


def determiner_decision_annuelle(
    moyenne_s1: Optional[float],
    moyenne_s2: Optional[float],
    moyenne_annuelle: Optional[float],
    credits_obtenus: float,
    credits_inscrits: float,
    matieres_dette: int,
    config: DeliberationConfigSnapshot,
) -> tuple[str, bool, bool]:
    """
    Retourne (decision, passage_niveau_superieur, compensation_appliquee).
    """
    if moyenne_annuelle is None and moyenne_s1 is None and moyenne_s2 is None:
        return "en_cours", False, False

    compensation = False
    moyenne_effective = moyenne_annuelle

    if (
        moyenne_s1 is not None
        and moyenne_s2 is not None
        and config.peut_compenser_semestres(moyenne_s1, moyenne_s2)
    ):
        compensation = True
        moyenne_effective = (moyenne_s1 + moyenne_s2) / 2
        if config.credits_suffisants(credits_obtenus, credits_inscrits):
            return "admis", True, compensation
        return "admis_avec_dette", True, compensation

    if moyenne_effective is None:
        return "en_cours", False, False

    if _est_exclu(moyenne_effective, matieres_dette, config):
        return "exclus", False, compensation

    if moyenne_effective >= config.moyenne_validation:
        passage = config.credits_suffisants(credits_obtenus, credits_inscrits)
        if passage:
            return "admis", True, compensation
        return "admis_avec_dette", True, compensation

    if config.peut_passer_conditionnel(moyenne_effective, matieres_dette):
        return "admis_avec_dette", True, compensation

    return "ajourne", False, compensation


def _est_exclu(moyenne: float, matieres_dette: int, config: DeliberationConfigSnapshot) -> bool:
    """Exclusion : moyenne très insuffisante et dettes au-delà du plafond."""
    seuil_exclusion = max(config.moyenne_passage_conditionnel - 2, 0)
    return moyenne < seuil_exclusion and matieres_dette > config.nombre_matieres_dette_max
