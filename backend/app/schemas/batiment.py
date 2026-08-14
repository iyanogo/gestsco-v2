"""
Schémas Pydantic pour les bâtiments
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class BatimentBase(BaseModel):
    """Schéma de base pour un bâtiment"""
    code: str = Field(..., min_length=1, max_length=20)
    libelle: str = Field(..., min_length=1, max_length=255)
    etablissement_id: int
    adresse: Optional[str] = Field(None, max_length=500)
    nombre_etages: Optional[int] = Field(None, ge=0)
    description: Optional[str] = None


class BatimentCreate(BatimentBase):
    """Schéma pour la création d'un bâtiment"""
    pass


class BatimentUpdate(BaseModel):
    """Schéma pour la mise à jour d'un bâtiment"""
    code: Optional[str] = Field(None, min_length=1, max_length=20)
    libelle: Optional[str] = Field(None, min_length=1, max_length=255)
    etablissement_id: Optional[int] = None
    adresse: Optional[str] = Field(None, max_length=500)
    nombre_etages: Optional[int] = Field(None, ge=0)
    description: Optional[str] = None
    is_active: Optional[bool] = None


class BatimentInDB(BatimentBase):
    """Schéma pour un bâtiment en base de données"""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Batiment(BatimentInDB):
    """Schéma de réponse pour un bâtiment"""
    pass


class BatimentWithEtablissement(Batiment):
    """Schéma de réponse avec les détails de l'établissement"""
    etablissement_nom: Optional[str] = None
