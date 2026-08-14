"""
Schémas Pydantic pour l'entité Niveau.
Adapté à la structure de la table existante.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class NiveauBase(BaseModel):
    """Schéma de base pour Niveau."""
    code: Optional[str] = Field(None, max_length=255, description="Code du niveau")
    libelle: Optional[str] = Field(None, max_length=255, description="Libellé du niveau")


class NiveauCreate(NiveauBase):
    """Schéma pour la création d'un niveau."""
    pass


class NiveauUpdate(BaseModel):
    """Schéma pour la mise à jour d'un niveau."""
    code: Optional[str] = Field(None, max_length=255)
    libelle: Optional[str] = Field(None, max_length=255)


class Niveau(NiveauBase):
    """Schéma complet pour Niveau."""
    id: int
    created_by: Optional[str] = None
    created_date: Optional[datetime] = None
    last_modified_by: Optional[str] = None
    last_modified_date: Optional[datetime] = None

    class Config:
        from_attributes = True
