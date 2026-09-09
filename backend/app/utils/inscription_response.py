"""Sérialisation sécurisée des inscriptions pour les réponses API."""

from fastapi import HTTPException, status
from pydantic import ValidationError
from sqlalchemy import inspect as sa_inspect

from app.schemas.inscription import Inscription

# Codes legacy (seeds E2E / ORM hors validation Pydantic) → format YYYY-YYYY
LEGACY_ANNEE_REPLACEMENTS: dict[str, str] = {
    "E2E-MANUAL-2025": "2025-2026",
    "E2E-COMP-2025": "2025-2026",
    "E2E-COMP-2026": "2026-2027",
}


def _inscription_payload(inscription) -> dict:
    insp = sa_inspect(inscription)
    return {col.key: getattr(inscription, col.key) for col in insp.mapper.column_attrs}


def serialize_inscription(inscription) -> Inscription:
    """Valide une inscription ORM ; tolère les codes année legacy en lecture."""
    try:
        return Inscription.model_validate(inscription)
    except ValidationError as exc:
        annee = getattr(inscription, "annee_academique", None)
        replacement = LEGACY_ANNEE_REPLACEMENTS.get(annee)
        if replacement:
            payload = _inscription_payload(inscription)
            payload["annee_academique"] = replacement
            return Inscription.model_validate(payload)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                f"Données d'inscription invalides (annee_academique={annee!r}). "
                "Veuillez contacter la scolarité pour corriger l'inscription."
            ),
        ) from exc


def serialize_inscriptions(inscriptions) -> list[Inscription]:
    return [serialize_inscription(inscription) for inscription in inscriptions]
