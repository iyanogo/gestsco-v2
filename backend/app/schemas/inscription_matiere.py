"""
Schémas Pydantic pour les inscriptions aux matières
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class InscriptionMatiereBase(BaseModel):
    """Schéma de base pour une inscription à une matière."""

    inscription_id: int = Field(..., description="ID de l'inscription")
    matiere_id: int = Field(..., description="ID de la matière")
    semestre: int = Field(..., ge=1, le=2, description="Semestre (1 ou 2)")


class InscriptionMatiereCreate(InscriptionMatiereBase):
    """Schéma pour la création d'une inscription à une matière."""
    pass


class InscriptionMatiereUpdate(BaseModel):
    """Schéma pour la mise à jour d'une inscription à une matière."""

    semestre: Optional[int] = Field(None, ge=1, le=2)
    is_active: Optional[bool] = None


class InscriptionMatiereInDB(InscriptionMatiereBase):
    """Schéma pour une inscription à une matière en base de données."""

    id: int
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InscriptionMatiere(InscriptionMatiereInDB):
    """Schéma de réponse pour une inscription à une matière."""
    pass


class InscriptionMatiereWithDetails(InscriptionMatiere):
    """Schéma de réponse pour une inscription à une matière avec détails."""

    matiere_libelle: Optional[str] = None
    matiere_code: Optional[str] = None
