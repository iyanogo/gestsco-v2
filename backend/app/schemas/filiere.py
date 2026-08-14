"""
Schémas Pydantic pour l'entité Filiere.
Adapté à la structure de la table existante.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class FiliereBase(BaseModel):
    """Schéma de base pour Filiere."""
    code: Optional[str] = Field(None, max_length=255, description="Code de la filière")
    libelle: Optional[str] = Field(None, max_length=255, description="Libellé de la filière")
    sigle: Optional[str] = Field(None, max_length=255, description="Sigle de la filière")
    annee: Optional[str] = Field(None, max_length=255, description="Année")
    etablissement_id: Optional[int] = Field(None, description="ID de l'établissement")
    coordinateur_id: Optional[int] = Field(None, description="ID du coordinateur")


class FiliereCreate(FiliereBase):
    """Schéma pour la création d'une filière."""
    pass


class FiliereUpdate(BaseModel):
    """Schéma pour la mise à jour d'une filière."""
    code: Optional[str] = Field(None, max_length=255)
    libelle: Optional[str] = Field(None, max_length=255)
    sigle: Optional[str] = Field(None, max_length=255)
    annee: Optional[str] = Field(None, max_length=255)
    etablissement_id: Optional[int] = None
    coordinateur_id: Optional[int] = None


class Filiere(FiliereBase):
    """Schéma complet pour Filiere."""
    id: int
    created_by: Optional[str] = None
    created_date: Optional[datetime] = None
    last_modified_by: Optional[str] = None
    last_modified_date: Optional[datetime] = None

    class Config:
        from_attributes = True
