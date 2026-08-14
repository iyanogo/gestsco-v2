"""
Schémas Pydantic pour l'entité Departement.
Adapté à la structure de la table existante.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class DepartementBase(BaseModel):
    """Schéma de base pour Departement."""
    code: Optional[str] = Field(None, max_length=255, description="Code du département")
    libelle: Optional[str] = Field(None, max_length=255, description="Libellé du département")
    sigle: Optional[str] = Field(None, max_length=255, description="Sigle du département")
    etablissement_id: Optional[int] = Field(None, description="ID de l'établissement parent")


class DepartementCreate(DepartementBase):
    """Schéma pour la création d'un département."""
    pass


class DepartementUpdate(BaseModel):
    """Schéma pour la mise à jour d'un département."""
    code: Optional[str] = Field(None, max_length=255)
    libelle: Optional[str] = Field(None, max_length=255)
    sigle: Optional[str] = Field(None, max_length=255)
    etablissement_id: Optional[int] = None


class DepartementInDB(DepartementBase):
    """Schéma pour Departement en base de données."""
    id: int
    created_by: Optional[str] = None
    created_date: Optional[datetime] = None
    last_modified_by: Optional[str] = None
    last_modified_date: Optional[datetime] = None

    class Config:
        from_attributes = True


class Departement(DepartementInDB):
    """Schéma de réponse API pour Departement."""
    pass
