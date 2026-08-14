"""
Schémas Pydantic pour les délibérations.
"""

from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, ConfigDict, Field


class DeliberationBase(BaseModel):
    """Schéma de base pour une délibération."""
    session_id: int
    niveau_id: int
    filiere_id: int
    date_deliberation: datetime
    type_deliberation: str = Field(
        ...,
        pattern="^(semestre|annuelle)$"
    )
    semestre: Optional[int] = Field(None, ge=1, le=2)
    president_jury: Optional[int] = None
    membres_jury: Optional[str] = None  # JSON des membres
    observations: Optional[str] = None


class DeliberationCreate(DeliberationBase):
    """Schéma pour la création d'une délibération."""
    pass


class DeliberationUpdate(BaseModel):
    """Schéma pour la mise à jour d'une délibération."""
    date_deliberation: Optional[datetime] = None
    type_deliberation: Optional[str] = Field(
        None,
        pattern="^(semestre|annuelle)$"
    )
    semestre: Optional[int] = Field(None, ge=1, le=2)
    president_jury: Optional[int] = None
    membres_jury: Optional[str] = None
    nombre_etudiants: Optional[int] = Field(None, ge=0)
    nombre_admis: Optional[int] = Field(None, ge=0)
    nombre_ajournes: Optional[int] = Field(None, ge=0)
    nombre_redoublants: Optional[int] = Field(None, ge=0)
    taux_reussite: Optional[float] = Field(None, ge=0, le=100)
    statut: Optional[str] = Field(
        None,
        pattern="^(en_cours|terminee|validee|publiee)$"
    )
    proces_verbal_url: Optional[str] = Field(None, max_length=500)
    observations: Optional[str] = None


class DeliberationValidation(BaseModel):
    """Schéma pour la validation d'une délibération."""
    observations: Optional[str] = None


class DeliberationPublication(BaseModel):
    """Schéma pour la publication d'une délibération."""
    observations: Optional[str] = None


class DeliberationInDB(DeliberationBase):
    """Schéma pour une délibération en base de données."""
    id: int
    nombre_etudiants: int
    nombre_admis: int
    nombre_ajournes: int
    nombre_redoublants: int
    taux_reussite: Optional[float]
    statut: str
    proces_verbal_url: Optional[str]
    validee_par: Optional[int]
    date_validation: Optional[datetime]
    publiee: bool
    date_publication: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Deliberation(DeliberationInDB):
    """Schéma complet pour une délibération."""
    pass


class DeliberationWithDetails(Deliberation):
    """Schéma avec détails des relations."""
    session_libelle: Optional[str] = None
    niveau_libelle: Optional[str] = None
    filiere_libelle: Optional[str] = None
    president_nom: Optional[str] = None
    validateur_nom: Optional[str] = None


class DeliberationStats(BaseModel):
    """Statistiques d'une délibération."""
    nombre_etudiants: int = 0
    nombre_admis: int = 0
    nombre_ajournes: int = 0
    nombre_redoublants: int = 0
    nombre_exclus: int = 0
    taux_reussite: float = 0.0
    moyenne_generale: Optional[float] = None
    moyenne_max: Optional[float] = None
    moyenne_min: Optional[float] = None
