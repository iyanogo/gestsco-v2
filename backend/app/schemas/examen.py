"""
Schémas Pydantic pour les examens.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ExamenBase(BaseModel):
    """Schéma de base pour un examen."""
    session_id: int
    matiere_id: int
    niveau_id: int
    type_evaluation: str = Field(
        ..., 
        pattern="^(controle_continu|examen_partiel|examen_final|tp|projet)$"
    )
    date_examen: Optional[datetime] = None
    duree_minutes: Optional[int] = Field(None, ge=0)
    salle: Optional[str] = Field(None, max_length=100)
    coefficient: float = Field(default=1.0, ge=0)
    note_sur: float = Field(default=20.0, ge=0, le=100)
    bareme: float = Field(default=20.0, ge=0, le=100)
    anonymat: bool = False
    enseignant_id: Optional[int] = None
    description: Optional[str] = None


class ExamenCreate(ExamenBase):
    """Schéma pour la création d'un examen."""
    pass


class ExamenUpdate(BaseModel):
    """Schéma pour la mise à jour d'un examen."""
    session_id: Optional[int] = None
    matiere_id: Optional[int] = None
    niveau_id: Optional[int] = None
    type_evaluation: Optional[str] = Field(
        None, 
        pattern="^(controle_continu|examen_partiel|examen_final|tp|projet)$"
    )
    date_examen: Optional[datetime] = None
    duree_minutes: Optional[int] = Field(None, ge=0)
    salle: Optional[str] = Field(None, max_length=100)
    coefficient: Optional[float] = Field(None, ge=0)
    note_sur: Optional[float] = Field(None, ge=0, le=100)
    bareme: Optional[float] = Field(None, ge=0, le=100)
    anonymat: Optional[bool] = None
    statut: Optional[str] = Field(
        None, 
        pattern="^(planifie|en_cours|termine|notes_saisies|valide)$"
    )
    enseignant_id: Optional[int] = None
    description: Optional[str] = None


class ExamenInDB(ExamenBase):
    """Schéma pour un examen en base de données."""
    id: int
    statut: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Examen(ExamenInDB):
    """Schéma complet pour un examen."""
    pass


class ExamenWithDetails(Examen):
    """Schéma avec détails des relations."""
    matiere_libelle: Optional[str] = None
    niveau_libelle: Optional[str] = None
    enseignant_nom: Optional[str] = None
    nombre_notes: int = 0
    nombre_notes_saisies: int = 0
