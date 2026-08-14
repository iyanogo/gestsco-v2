"""
Schémas Pydantic pour les campagnes d'inscription
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator


STATUTS_CAMPAGNE = ["brouillon", "ouverte", "cloturee", "annulee"]


class CampagneInscriptionBase(BaseModel):
    """Schéma de base pour une campagne d'inscription."""
    
    code: str
    libelle: str
    annee_academique_id: int
    cycle_id: int
    date_ouverture: datetime
    date_cloture: datetime
    date_limite_paiement: Optional[datetime] = None
    frais_inscription: float = 0.0
    frais_dossier: float = 0.0
    nombre_places: Optional[int] = None
    description: Optional[str] = None
    conditions: Optional[str] = None
    statut: str = "brouillon"

    @field_validator("frais_inscription", "frais_dossier")
    @classmethod
    def validate_frais(cls, v: float) -> float:
        """Valide que les frais sont positifs ou nuls."""
        if v < 0:
            raise ValueError("Les frais doivent être positifs ou nuls")
        return v

    @field_validator("nombre_places")
    @classmethod
    def validate_nombre_places(cls, v: Optional[int]) -> Optional[int]:
        """Valide que le nombre de places est positif."""
        if v is not None and v < 0:
            raise ValueError("Le nombre de places doit être positif")
        return v

    @field_validator("statut")
    @classmethod
    def validate_statut(cls, v: str) -> str:
        """Valide le statut de la campagne."""
        if v not in STATUTS_CAMPAGNE:
            raise ValueError(f"Le statut doit être parmi: {', '.join(STATUTS_CAMPAGNE)}")
        return v

    @field_validator("date_cloture")
    @classmethod
    def validate_date_cloture(cls, v: datetime, info) -> datetime:
        """Valide que la date de clôture est après la date d'ouverture."""
        if "date_ouverture" in info.data and v <= info.data["date_ouverture"]:
            raise ValueError("La date de clôture doit être après la date d'ouverture")
        return v


class CampagneInscriptionCreate(CampagneInscriptionBase):
    """Schéma pour la création d'une campagne d'inscription."""
    pass


class CampagneInscriptionUpdate(BaseModel):
    """Schéma pour la mise à jour d'une campagne d'inscription."""
    
    code: Optional[str] = None
    libelle: Optional[str] = None
    annee_academique_id: Optional[int] = None
    cycle_id: Optional[int] = None
    date_ouverture: Optional[datetime] = None
    date_cloture: Optional[datetime] = None
    date_limite_paiement: Optional[datetime] = None
    frais_inscription: Optional[float] = None
    frais_dossier: Optional[float] = None
    nombre_places: Optional[int] = None
    description: Optional[str] = None
    conditions: Optional[str] = None
    statut: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator("statut")
    @classmethod
    def validate_statut(cls, v: Optional[str]) -> Optional[str]:
        """Valide le statut si fourni."""
        if v is not None and v not in STATUTS_CAMPAGNE:
            raise ValueError(f"Le statut doit être parmi: {', '.join(STATUTS_CAMPAGNE)}")
        return v


class CampagneInscriptionInDB(CampagneInscriptionBase):
    """Schéma pour une campagne d'inscription en base de données."""
    
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CampagneInscription(CampagneInscriptionInDB):
    """Schéma complet pour une campagne d'inscription."""
    pass


class CampagneInscriptionWithStats(CampagneInscription):
    """Schéma avec statistiques."""
    
    nombre_dossiers: int = 0
    nombre_admis: int = 0
    places_disponibles: Optional[int] = None
