"""
Schémas Pydantic pour les présences
"""
from datetime import datetime, time
from typing import Optional, List

from pydantic import BaseModel, ConfigDict, Field


class PresenceBase(BaseModel):
    """Schéma de base pour une présence"""
    seance_id: int
    etudiant_id: int
    statut: str = Field("absent", description="Statut: present, absent, retard, absent_justifie")
    heure_arrivee: Optional[time] = None
    observation: Optional[str] = None


class PresenceCreate(PresenceBase):
    """Schéma pour la création d'une présence"""
    pass


class PresenceUpdate(BaseModel):
    """Schéma pour la mise à jour d'une présence"""
    statut: Optional[str] = None
    heure_arrivee: Optional[time] = None
    observation: Optional[str] = None
    justificatif_url: Optional[str] = None


class PresenceItem(BaseModel):
    """Item pour la saisie en masse"""
    etudiant_id: int
    statut: str = "absent"
    heure_arrivee: Optional[time] = None
    observation: Optional[str] = None


class PresenceBulkCreate(BaseModel):
    """Schéma pour la saisie en masse des présences"""
    seance_id: int
    presences: List[PresenceItem]


class PresenceInDB(PresenceBase):
    """Schéma pour une présence en base de données"""
    id: int
    justificatif_url: Optional[str] = None
    saisie_par: Optional[int] = None
    date_saisie: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Presence(PresenceInDB):
    """Schéma de réponse pour une présence"""
    pass


class PresenceWithEtudiant(Presence):
    """Schéma de réponse avec détails de l'étudiant"""
    etudiant_nom: Optional[str] = None
    etudiant_prenom: Optional[str] = None
    etudiant_matricule: Optional[str] = None


class StatistiquesPresence(BaseModel):
    """Statistiques de présence"""
    total_seances: int = 0
    presences: int = 0
    absences: int = 0
    retards: int = 0
    absences_justifiees: int = 0
    taux_presence: float = 0.0
