"""
Schémas Pydantic pour l'entité Module.
Adapté à la structure de la table existante.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ModuleBase(BaseModel):
    """Schéma de base pour Module."""
    code: Optional[str] = Field(None, max_length=255, description="Code du module")
    libelle: Optional[str] = Field(None, max_length=255, description="Libellé du module")
    sigle: Optional[str] = Field(None, max_length=255, description="Sigle")
    vol_horaire: Optional[str] = Field(None, max_length=255, description="Volume horaire")
    annee: Optional[str] = Field(None, max_length=255, description="Année")
    tpe: Optional[float] = Field(None, description="TPE")
    va: Optional[float] = Field(None, description="VA")
    vcvh: Optional[float] = Field(None, description="VCVH")
    vp: Optional[float] = Field(None, description="VP")
    coordinateur_id: Optional[int] = Field(None, description="ID du coordinateur")
    semestre_id: Optional[int] = Field(None, description="ID du semestre")
    filiere_id: Optional[int] = Field(None, description="ID de la filière")


class ModuleCreate(ModuleBase):
    """Schéma pour la création d'un module."""
    pass


class ModuleUpdate(BaseModel):
    """Schéma pour la mise à jour d'un module."""
    code: Optional[str] = Field(None, max_length=255)
    libelle: Optional[str] = Field(None, max_length=255)
    sigle: Optional[str] = Field(None, max_length=255)
    vol_horaire: Optional[str] = Field(None, max_length=255)
    annee: Optional[str] = Field(None, max_length=255)
    tpe: Optional[float] = None
    va: Optional[float] = None
    vcvh: Optional[float] = None
    vp: Optional[float] = None
    coordinateur_id: Optional[int] = None
    semestre_id: Optional[int] = None
    filiere_id: Optional[int] = None


class Module(ModuleBase):
    """Schéma complet pour Module."""
    id: int
    created_by: Optional[str] = None
    created_date: Optional[datetime] = None
    last_modified_by: Optional[str] = None
    last_modified_date: Optional[datetime] = None

    class Config:
        from_attributes = True


