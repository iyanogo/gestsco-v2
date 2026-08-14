"""
Schémas Pydantic pour les sessions d'examen.
"""

from datetime import datetime, date
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class SessionExamenBase(BaseModel):
    """Schéma de base pour une session d'examen."""
    code: str = Field(..., min_length=1, max_length=50)
    libelle: str = Field(..., min_length=1, max_length=255)
    annee_academique_id: int
    type_session: str = Field(..., pattern="^(normale|rattrapage)$")
    semestre: int = Field(..., ge=1, le=2)
    date_debut: date
    date_fin: date
    date_limite_saisie_notes: date
    date_deliberation: Optional[date] = None
    statut: str = Field(default="planifiee", pattern="^(planifiee|en_cours|cloturee|validee)$")


class SessionExamenCreate(SessionExamenBase):
    """Schéma pour la création d'une session d'examen."""
    pass


class SessionExamenUpdate(BaseModel):
    """Schéma pour la mise à jour d'une session d'examen."""
    code: Optional[str] = Field(None, min_length=1, max_length=50)
    libelle: Optional[str] = Field(None, min_length=1, max_length=255)
    annee_academique_id: Optional[int] = None
    type_session: Optional[str] = Field(None, pattern="^(normale|rattrapage)$")
    semestre: Optional[int] = Field(None, ge=1, le=2)
    date_debut: Optional[date] = None
    date_fin: Optional[date] = None
    date_limite_saisie_notes: Optional[date] = None
    date_deliberation: Optional[date] = None
    statut: Optional[str] = Field(None, pattern="^(planifiee|en_cours|cloturee|validee)$")
    is_active: Optional[bool] = None


class SessionExamenInDB(SessionExamenBase):
    """Schéma pour une session d'examen en base de données."""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SessionExamen(SessionExamenInDB):
    """Schéma complet pour une session d'examen."""
    pass


class SessionExamenWithStats(SessionExamen):
    """Schéma avec statistiques."""
    nombre_examens: int = 0
    nombre_notes_saisies: int = 0
    nombre_notes_validees: int = 0
