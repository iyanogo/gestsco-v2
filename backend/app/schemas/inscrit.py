"""
Schémas Pydantic pour les inscriptions (table inscrit)
"""

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator


class InscritBase(BaseModel):
    """Schéma de base pour une inscription."""
    
    code: Optional[str] = None
    libelle: Optional[str] = None
    etudiant_id: Optional[int] = None
    enseignement_id: Optional[int] = None
    filiere_id: Optional[int] = None
    niveau_id: Optional[int] = None
    annee_academique: Optional[str] = None
    date_inscription: Optional[date] = None
    type_inscription: Optional[str] = None
    regime_etudes: Optional[str] = None
    statut_inscription: Optional[str] = "en_cours"
    frais_inscription: Optional[float] = 0.0
    frais_payes: Optional[float] = 0.0
    is_active: Optional[bool] = True

    @field_validator("frais_inscription", "frais_payes")
    @classmethod
    def validate_frais(cls, v: Optional[float]) -> Optional[float]:
        """Valide que les frais sont positifs ou nuls."""
        if v is not None and v < 0:
            raise ValueError("Les frais doivent être positifs ou nuls")
        return v


class InscritCreate(InscritBase):
    """Schéma pour la création d'une inscription."""
    
    etudiant_id: int


class InscritUpdate(BaseModel):
    """Schéma pour la mise à jour d'une inscription."""
    
    code: Optional[str] = None
    libelle: Optional[str] = None
    enseignement_id: Optional[int] = None
    filiere_id: Optional[int] = None
    niveau_id: Optional[int] = None
    annee_academique: Optional[str] = None
    date_inscription: Optional[date] = None
    type_inscription: Optional[str] = None
    regime_etudes: Optional[str] = None
    statut_inscription: Optional[str] = None
    frais_inscription: Optional[float] = None
    frais_payes: Optional[float] = None
    is_active: Optional[bool] = None


class InscritInDB(InscritBase):
    """Schéma pour une inscription en base de données."""
    
    id: int
    created_by: Optional[str] = None
    created_date: Optional[datetime] = None
    last_modified_by: Optional[str] = None
    last_modified_date: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class Inscrit(InscritInDB):
    """Schéma complet pour une inscription."""
    pass


class InscritWithDetails(Inscrit):
    """Schéma avec détails calculés."""
    
    solde: float = 0.0
    is_paid: bool = False
