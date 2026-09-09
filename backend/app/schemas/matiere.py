"""
Schémas Pydantic pour l'entité Matiere.
Adapté à la structure de la table existante.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class MatiereBase(BaseModel):
    """Schéma de base pour Matiere."""
    code: Optional[str] = Field(None, max_length=255, description="Code de la matière")
    libelle: Optional[str] = Field(None, max_length=255, description="Libellé de la matière")
    sigle: Optional[str] = Field(None, max_length=255, description="Sigle de la matière")
    annee: Optional[str] = Field(None, max_length=255, description="Année")
    tpe: Optional[float] = Field(None, description="TPE")
    va: Optional[float] = Field(None, description="VA")
    vcvh: Optional[float] = Field(None, description="VCVH")
    vp: Optional[float] = Field(None, description="VP")
    credit: Optional[int] = Field(
        None, ge=0, le=30,
        description="Crédits ECTS (défaut 3 si non renseigné à la création)",
    )
    obligatoire: bool = Field(True, description="Matière obligatoire")
    module_id: Optional[int] = Field(None, description="ID du module parent")


class MatiereCreate(MatiereBase):
    """Schéma pour la création d'une matière."""
    pass


class MatiereUpdate(BaseModel):
    """Schéma pour la mise à jour d'une matière."""
    code: Optional[str] = Field(None, max_length=255)
    libelle: Optional[str] = Field(None, max_length=255)
    sigle: Optional[str] = Field(None, max_length=255)
    annee: Optional[str] = Field(None, max_length=255)
    tpe: Optional[float] = None
    va: Optional[float] = None
    vcvh: Optional[float] = None
    vp: Optional[float] = None
    credit: Optional[int] = Field(None, ge=0, le=30)
    obligatoire: Optional[bool] = None
    module_id: Optional[int] = None


class Matiere(MatiereBase):
    """Schéma complet pour Matiere."""
    id: int
    created_by: Optional[str] = None
    created_date: Optional[datetime] = None
    last_modified_by: Optional[str] = None
    last_modified_date: Optional[datetime] = None

    class Config:
        from_attributes = True
