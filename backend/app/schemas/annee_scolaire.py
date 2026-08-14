"""
Schémas Pydantic pour l'année scolaire
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class AnneeBase(BaseModel):
    """Schéma de base pour l'année scolaire."""

    code: Optional[str] = Field(None, max_length=255, description="Code de l'année scolaire (ex: 2024-2025)")
    libelle: Optional[str] = Field(None, max_length=255, description="Libellé de l'année scolaire")
    statut: Optional[bool] = Field(False, description="Indique si c'est l'année scolaire active")
    etat: Optional[str] = Field(None, max_length=255, description="État de l'année")
    lier_enseignement: Optional[bool] = Field(False, description="Lier à l'enseignement")


class AnneeCreate(AnneeBase):
    """Schéma pour la création d'une année scolaire."""

    pass


class AnneeUpdate(BaseModel):
    """Schéma pour la mise à jour d'une année scolaire."""

    code: Optional[str] = Field(None, max_length=255)
    libelle: Optional[str] = Field(None, max_length=255)
    statut: Optional[bool] = None
    etat: Optional[str] = Field(None, max_length=255)
    lier_enseignement: Optional[bool] = None


class AnneeResponse(AnneeBase):
    """Schéma de réponse pour une année scolaire."""

    id: int
    created_by: Optional[str] = None
    created_date: Optional[datetime] = None
    last_modified_by: Optional[str] = None
    last_modified_date: Optional[datetime] = None

    class Config:
        from_attributes = True
