"""
Schémas Pydantic pour les emplois du temps
"""
from datetime import datetime, date
from typing import Optional, List

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.seance import SeanceWithDetails


class EmploiTempsBase(BaseModel):
    """Schéma de base pour un emploi du temps"""
    code: str = Field(..., min_length=1, max_length=50)
    libelle: str = Field(..., min_length=1, max_length=255)
    niveau_id: int
    filiere_id: Optional[int] = None
    semestre: int = Field(..., ge=1, le=2)
    annee_academique_id: int
    date_debut: date
    date_fin: date
    observations: Optional[str] = None

    @field_validator('date_fin')
    @classmethod
    def validate_date_fin(cls, v, info):
        if 'date_debut' in info.data and v <= info.data['date_debut']:
            raise ValueError("La date de fin doit être après la date de début")
        return v


class EmploiTempsCreate(EmploiTempsBase):
    """Schéma pour la création d'un emploi du temps"""
    pass


class EmploiTempsUpdate(BaseModel):
    """Schéma pour la mise à jour d'un emploi du temps"""
    code: Optional[str] = Field(None, min_length=1, max_length=50)
    libelle: Optional[str] = Field(None, min_length=1, max_length=255)
    niveau_id: Optional[int] = None
    filiere_id: Optional[int] = None
    semestre: Optional[int] = Field(None, ge=1, le=2)
    annee_academique_id: Optional[int] = None
    date_debut: Optional[date] = None
    date_fin: Optional[date] = None
    observations: Optional[str] = None


class EmploiTempsInDB(EmploiTempsBase):
    """Schéma pour un emploi du temps en base de données"""
    id: int
    statut: str
    version: int
    publie_le: Optional[datetime] = None
    publie_par: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class EmploiTemps(EmploiTempsInDB):
    """Schéma de réponse pour un emploi du temps"""
    pass


class EmploiTempsWithDetails(EmploiTemps):
    """Schéma de réponse avec détails"""
    niveau_libelle: Optional[str] = None
    filiere_libelle: Optional[str] = None
    annee_academique_libelle: Optional[str] = None
    publieur_nom: Optional[str] = None


class EmploiTempsWithSeances(EmploiTempsWithDetails):
    """Schéma de réponse avec les séances"""
    seances: List[SeanceWithDetails] = []


class EmploiTempsPublier(BaseModel):
    """Schéma pour publier un emploi du temps"""
    pass


class EmploiTempsValider(BaseModel):
    """Schéma pour valider un emploi du temps"""
    pass


class JourSemaine(BaseModel):
    """Représentation d'un jour de la semaine avec ses séances"""
    jour: int = Field(..., ge=1, le=7, description="1=Lundi, 7=Dimanche")
    jour_libelle: str
    seances: List[SeanceWithDetails] = []


class EmploiTempsSemaine(BaseModel):
    """Emploi du temps formaté par semaine"""
    semaine_numero: int
    date_debut: date
    date_fin: date
    jours: List[JourSemaine] = []
