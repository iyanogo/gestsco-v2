"""
Schémas Pydantic pour l'entité Cycle.
Adapté à la structure de la table existante.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class CycleBase(BaseModel):
    """Schéma de base pour Cycle."""
    code: Optional[str] = Field(None, max_length=255, description="Code du cycle (L, M, D)")
    libelle: Optional[str] = Field(None, max_length=255, description="Libellé du cycle")
    sigle: Optional[str] = Field(None, max_length=255, description="Sigle du cycle")


class CycleCreate(CycleBase):
    """Schéma pour la création d'un cycle."""
    pass


class CycleUpdate(BaseModel):
    """Schéma pour la mise à jour d'un cycle."""
    code: Optional[str] = Field(None, max_length=255)
    libelle: Optional[str] = Field(None, max_length=255)
    sigle: Optional[str] = Field(None, max_length=255)


class Cycle(CycleBase):
    """Schéma complet pour Cycle."""
    id: int
    created_by: Optional[str] = None
    created_date: Optional[datetime] = None
    last_modified_by: Optional[str] = None
    last_modified_date: Optional[datetime] = None

    class Config:
        from_attributes = True
