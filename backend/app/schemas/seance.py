"""
Schémas Pydantic pour les séances
"""
from datetime import datetime, date
from typing import Optional, List

from pydantic import BaseModel, ConfigDict, Field


class SeanceBase(BaseModel):
    """Schéma de base pour une séance"""
    matiere_id: int
    niveau_id: int
    filiere_id: Optional[int] = None
    enseignant_id: int
    salle_id: Optional[int] = None
    creneau_id: int
    type_seance: str = Field(..., description="Type: cours, td, tp, examen, soutenance")
    date_seance: date
    semestre: int = Field(..., ge=1, le=2)
    annee_academique_id: int
    duree_minutes: int = Field(120, ge=30)
    effectif_prevu: Optional[int] = Field(None, ge=0)
    est_recurrente: bool = False
    observations: Optional[str] = None


class SeanceCreate(SeanceBase):
    """Schéma pour la création d'une séance"""
    pass


class SeanceUpdate(BaseModel):
    """Schéma pour la mise à jour d'une séance"""
    matiere_id: Optional[int] = None
    niveau_id: Optional[int] = None
    filiere_id: Optional[int] = None
    enseignant_id: Optional[int] = None
    salle_id: Optional[int] = None
    creneau_id: Optional[int] = None
    type_seance: Optional[str] = None
    date_seance: Optional[date] = None
    semestre: Optional[int] = Field(None, ge=1, le=2)
    annee_academique_id: Optional[int] = None
    duree_minutes: Optional[int] = Field(None, ge=30)
    effectif_prevu: Optional[int] = Field(None, ge=0)
    effectif_present: Optional[int] = Field(None, ge=0)
    statut: Optional[str] = None
    observations: Optional[str] = None


class SeanceRecurrenteCreate(BaseModel):
    """Schéma pour la création de séances récurrentes"""
    seance_base: SeanceCreate
    date_fin_recurrence: date
    jours_semaine: List[int] = Field(..., description="Jours de la semaine (1=Lundi, 7=Dimanche)")

    @classmethod
    def validate_jours_semaine(cls, v):
        for jour in v:
            if jour < 1 or jour > 7:
                raise ValueError("Les jours doivent être entre 1 (Lundi) et 7 (Dimanche)")
        return v


class SeanceInDB(SeanceBase):
    """Schéma pour une séance en base de données"""
    id: int
    code: str
    jour_semaine: int
    statut: str
    effectif_present: Optional[int] = None
    recurrence_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Seance(SeanceInDB):
    """Schéma de réponse pour une séance"""
    pass


class SeanceWithDetails(Seance):
    """Schéma de réponse avec détails complets"""
    matiere_libelle: Optional[str] = None
    matiere_code: Optional[str] = None
    enseignant_nom: Optional[str] = None
    enseignant_prenom: Optional[str] = None
    salle_libelle: Optional[str] = None
    salle_code: Optional[str] = None
    creneau_libelle: Optional[str] = None
    niveau_libelle: Optional[str] = None
    filiere_libelle: Optional[str] = None


class SeanceStatut(BaseModel):
    """Schéma pour changer le statut d'une séance"""
    statut: str = Field(..., description="Nouveau statut: planifiee, confirmee, en_cours, terminee, annulee, reportee")
    observations: Optional[str] = None
