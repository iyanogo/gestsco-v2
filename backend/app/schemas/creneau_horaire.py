"""
Schémas Pydantic pour les créneaux horaires
"""
from datetime import datetime, time
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class CreneauHoraireBase(BaseModel):
    """Schéma de base pour un créneau horaire"""
    code: str = Field(..., min_length=1, max_length=20, description="Code du créneau (ex: M1, M2, S1)")
    libelle: str = Field(..., min_length=1, max_length=100, description="Libellé (ex: Matin 1 : 08h-10h)")
    heure_debut: time
    heure_fin: time
    periode: str = Field(..., description="Période: matin, apres_midi, soir")
    ordre: int = Field(1, ge=1, description="Ordre d'affichage")

    @field_validator('heure_fin')
    @classmethod
    def validate_heure_fin(cls, v, info):
        if 'heure_debut' in info.data and v <= info.data['heure_debut']:
            raise ValueError("L'heure de fin doit être après l'heure de début")
        return v


class CreneauHoraireCreate(CreneauHoraireBase):
    """Schéma pour la création d'un créneau horaire"""
    pass


class CreneauHoraireUpdate(BaseModel):
    """Schéma pour la mise à jour d'un créneau horaire"""
    code: Optional[str] = Field(None, min_length=1, max_length=20)
    libelle: Optional[str] = Field(None, min_length=1, max_length=100)
    heure_debut: Optional[time] = None
    heure_fin: Optional[time] = None
    periode: Optional[str] = None
    ordre: Optional[int] = Field(None, ge=1)
    is_active: Optional[bool] = None


class CreneauHoraireInDB(CreneauHoraireBase):
    """Schéma pour un créneau horaire en base de données"""
    id: int
    duree_minutes: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CreneauHoraire(CreneauHoraireInDB):
    """Schéma de réponse pour un créneau horaire"""
    pass
