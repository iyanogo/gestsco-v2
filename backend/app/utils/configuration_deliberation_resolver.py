"""
Résolution de ConfigurationDeliberation applicable (niveau puis global).

Source unique pour calcul_notes, repositories résultats et DeliberationService.
"""

from __future__ import annotations

from typing import Optional

from sqlalchemy.orm import Session

from app.repositories.configuration_deliberation_repository import (
    configuration_deliberation_repository,
)
from app.utils.deliberation_rules import DeliberationConfigSnapshot


def resolve_config_snapshot(
    db: Session,
    annee_academique_id: Optional[int],
    niveau_id: Optional[int] = None,
) -> DeliberationConfigSnapshot:
    """
    Retourne le snapshot de config applicable pour une année / niveau.

    Ordre : config spécifique au niveau, puis config globale (niveau_id NULL),
    puis valeurs par défaut système (10/20, 70 % crédits, etc.).
    """
    if not annee_academique_id:
        return DeliberationConfigSnapshot()

    config = None
    if niveau_id:
        config = configuration_deliberation_repository.get_applicable(
            db, annee_academique_id, niveau_id
        )
    else:
        config = configuration_deliberation_repository.get_globale(
            db, annee_academique_id
        )

    return DeliberationConfigSnapshot.from_model(config)
