"""
Schémas Pydantic pour les inscriptions
"""

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.validators import (
    ANNEE_ACADEMIQUE_CODE_DESCRIPTION,
    ANNEE_ACADEMIQUE_CODE_PATTERN,
)


class InscriptionBase(BaseModel):
    """Schéma de base pour une inscription."""

    etudiant_id: int = Field(..., description="ID de l'étudiant")
    filiere_id: int = Field(..., description="ID de la filière")
    niveau_id: int = Field(..., description="ID du niveau")
    annee_academique: str = Field(
        ...,
        max_length=20,
        pattern=ANNEE_ACADEMIQUE_CODE_PATTERN,
        description=ANNEE_ACADEMIQUE_CODE_DESCRIPTION,
    )
    type_inscription: str = Field(..., max_length=50, description="Type d'inscription (nouvelle, redoublement, transfert)")
    regime_etudes: Optional[str] = Field(None, max_length=50, description="Régime d'études (présentiel, distance)")
    statut_inscription: str = Field("en_cours", max_length=50, description="Statut de l'inscription (en_cours, validee, annulee)")
    frais_inscription: Optional[float] = Field(0.0, ge=0)
    frais_payes: Optional[float] = Field(0.0, ge=0)


class InscriptionCreate(InscriptionBase):
    """Schéma pour la création d'une inscription."""
    pass


class InscriptionUpdate(BaseModel):
    """Schéma pour la mise à jour d'une inscription."""

    filiere_id: Optional[int] = None
    niveau_id: Optional[int] = None
    annee_academique: Optional[str] = Field(
        None,
        max_length=20,
        pattern=ANNEE_ACADEMIQUE_CODE_PATTERN,
    )
    type_inscription: Optional[str] = Field(None, max_length=50)
    regime_etudes: Optional[str] = Field(None, max_length=50)
    statut_inscription: Optional[str] = Field(None, max_length=50)
    frais_inscription: Optional[float] = Field(None, ge=0)
    frais_payes: Optional[float] = Field(None, ge=0)
    is_active: Optional[bool] = None


class InscriptionInDB(InscriptionBase):
    """Schéma pour une inscription en base de données."""

    id: int
    date_inscription: date
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Inscription(InscriptionInDB):
    """Schéma de réponse pour une inscription."""
    pass


class InscriptionWithDetails(Inscription):
    """Schéma de réponse pour une inscription avec détails."""

    etudiant_nom: Optional[str] = None
    etudiant_prenom: Optional[str] = None
    filiere_libelle: Optional[str] = None
    niveau_libelle: Optional[str] = None
