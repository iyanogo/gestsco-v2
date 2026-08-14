"""
Schémas Pydantic pour les réservations de salles
"""
from datetime import datetime, date, time
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ReservationSalleBase(BaseModel):
    """Schéma de base pour une réservation de salle"""
    salle_id: int
    date_reservation: date
    heure_debut: time
    heure_fin: time
    motif: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    nombre_participants: Optional[int] = Field(None, ge=1)
    equipements_requis: Optional[str] = Field(None, description="JSON des équipements requis")

    @field_validator('heure_fin')
    @classmethod
    def validate_heure_fin(cls, v, info):
        if 'heure_debut' in info.data and v <= info.data['heure_debut']:
            raise ValueError("L'heure de fin doit être après l'heure de début")
        return v


class ReservationSalleCreate(ReservationSalleBase):
    """Schéma pour la création d'une réservation"""
    pass


class ReservationSalleUpdate(BaseModel):
    """Schéma pour la mise à jour d'une réservation"""
    salle_id: Optional[int] = None
    date_reservation: Optional[date] = None
    heure_debut: Optional[time] = None
    heure_fin: Optional[time] = None
    motif: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    nombre_participants: Optional[int] = Field(None, ge=1)
    equipements_requis: Optional[str] = None


class ReservationSalleInDB(ReservationSalleBase):
    """Schéma pour une réservation en base de données"""
    id: int
    numero_reservation: str
    demandeur_id: int
    statut: str
    approuve_par: Optional[int] = None
    date_approbation: Optional[datetime] = None
    motif_refus: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReservationSalle(ReservationSalleInDB):
    """Schéma de réponse pour une réservation"""
    pass


class ReservationSalleWithDetails(ReservationSalle):
    """Schéma de réponse avec détails"""
    salle_libelle: Optional[str] = None
    salle_code: Optional[str] = None
    demandeur_nom: Optional[str] = None
    approbateur_nom: Optional[str] = None


class ReservationApprouver(BaseModel):
    """Schéma pour approuver une réservation"""
    pass


class ReservationRefuser(BaseModel):
    """Schéma pour refuser une réservation"""
    motif_refus: str = Field(..., min_length=1, description="Motif du refus")
