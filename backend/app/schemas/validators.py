"""
Validateurs Pydantic partagés (GestSco).

Autorise les domaines internes (.local, .test) pour les établissements,
tout en conservant un contrôle de format basique.
"""

from __future__ import annotations

import re
from typing import Annotated, Optional

from pydantic import BeforeValidator

_EMAIL_ETABLISSEMENT_RE = re.compile(
    r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,63}$"
)

ANNEE_ACADEMIQUE_CODE_PATTERN = r"^\d{4}-\d{4}$"
ANNEE_ACADEMIQUE_CODE_DESCRIPTION = "Année académique au format YYYY-YYYY (ex: 2024-2025)"

# Codes legacy issus de seeds ORM (hors API Pydantic)
LEGACY_ANNEE_ACADEMIQUE_CODES = frozenset({"E2E-MANUAL-2025"})


def validate_email_etablissement(v: object) -> str:
    if not isinstance(v, str):
        raise TypeError("L'email doit être une chaîne de caractères")
    email = v.strip()
    if not email:
        raise ValueError("Adresse email invalide")
    if not _EMAIL_ETABLISSEMENT_RE.match(email):
        raise ValueError("Adresse email invalide")
    return email.lower()


def validate_email_etablissement_optional(v: object) -> Optional[str]:
    if v is None or (isinstance(v, str) and not v.strip()):
        return None
    return validate_email_etablissement(v)


def validate_annee_academique_code(v: str, *, check_consecutive_years: bool = True) -> str:
    if not re.match(ANNEE_ACADEMIQUE_CODE_PATTERN, v):
        raise ValueError(
            f"Le code doit être au format YYYY-YYYY (ex: 2024-2025), reçu : {v!r}"
        )
    if check_consecutive_years:
        start, end = v.split("-")
        if int(end) != int(start) + 1:
            raise ValueError("L'année de fin doit être l'année de début + 1")
    return v


EmailEtablissement = Annotated[str, BeforeValidator(validate_email_etablissement)]
OptionalEmailEtablissement = Annotated[
    Optional[str], BeforeValidator(validate_email_etablissement_optional)
]
