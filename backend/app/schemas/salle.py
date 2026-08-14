"""
Schémas Pydantic pour les salles
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class SalleBase(BaseModel):
    """Schéma de base pour une salle"""
    code: str = Field(..., min_length=1, max_length=50)
    libelle: str = Field(..., min_length=1, max_length=255)
    batiment_id: int
    type_salle: str = Field(..., description="Type de salle: cours, tp, amphi, labo, salle_info, salle_reunion")
    etage: Optional[int] = None
    capacite: int = Field(30, ge=1)
    superficie: Optional[float] = Field(None, ge=0, description="Superficie en m²")
    equipements: Optional[str] = Field(None, description="JSON des équipements")
    description: Optional[str] = None
    is_accessible_pmr: bool = False


class SalleCreate(SalleBase):
    """Schéma pour la création d'une salle"""
    pass


class SalleUpdate(BaseModel):
    """Schéma pour la mise à jour d'une salle"""
    code: Optional[str] = Field(None, min_length=1, max_length=50)
    libelle: Optional[str] = Field(None, min_length=1, max_length=255)
    batiment_id: Optional[int] = None
    type_salle: Optional[str] = None
    etage: Optional[int] = None
    capacite: Optional[int] = Field(None, ge=1)
    superficie: Optional[float] = Field(None, ge=0)
    equipements: Optional[str] = None
    description: Optional[str] = None
    is_accessible_pmr: Optional[bool] = None
    is_active: Optional[bool] = None


class SalleInDB(SalleBase):
    """Schéma pour une salle en base de données"""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Salle(SalleInDB):
    """Schéma de réponse pour une salle"""
    pass


class SalleWithBatiment(Salle):
    """Schéma de réponse avec les détails du bâtiment"""
    batiment_libelle: Optional[str] = None
    batiment_code: Optional[str] = None


class SalleWithDisponibilite(Salle):
    """Schéma de réponse avec disponibilité"""
    est_disponible: bool = True
    prochaine_seance: Optional[datetime] = None
