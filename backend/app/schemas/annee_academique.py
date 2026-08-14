"""
Schémas Pydantic pour l'année académique
"""

import re
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator


class AnneeAcademiqueBase(BaseModel):
    """Schéma de base pour l'année académique."""
    
    code: str
    libelle: str
    date_debut: date
    date_fin: date
    date_debut_inscriptions: date
    date_fin_inscriptions: date
    is_active: bool = False
    is_current: bool = False

    @field_validator("code")
    @classmethod
    def validate_code(cls, v: str) -> str:
        """Valide le format du code (ex: 2024-2025)."""
        if not re.match(r"^\d{4}-\d{4}$", v):
            raise ValueError("Le code doit être au format YYYY-YYYY (ex: 2024-2025)")
        years = v.split("-")
        if int(years[1]) != int(years[0]) + 1:
            raise ValueError("L'année de fin doit être l'année de début + 1")
        return v

    @field_validator("date_fin")
    @classmethod
    def validate_date_fin(cls, v: date, info) -> date:
        """Valide que la date de fin est après la date de début."""
        if "date_debut" in info.data and v <= info.data["date_debut"]:
            raise ValueError("La date de fin doit être après la date de début")
        return v

    @field_validator("date_fin_inscriptions")
    @classmethod
    def validate_date_fin_inscriptions(cls, v: date, info) -> date:
        """Valide que la date de fin des inscriptions est après la date de début."""
        if "date_debut_inscriptions" in info.data and v <= info.data["date_debut_inscriptions"]:
            raise ValueError("La date de fin des inscriptions doit être après la date de début")
        return v


class AnneeAcademiqueCreate(AnneeAcademiqueBase):
    """Schéma pour la création d'une année académique."""
    pass


class AnneeAcademiqueUpdate(BaseModel):
    """Schéma pour la mise à jour d'une année académique."""
    
    code: Optional[str] = None
    libelle: Optional[str] = None
    date_debut: Optional[date] = None
    date_fin: Optional[date] = None
    date_debut_inscriptions: Optional[date] = None
    date_fin_inscriptions: Optional[date] = None
    is_active: Optional[bool] = None
    is_current: Optional[bool] = None

    @field_validator("code")
    @classmethod
    def validate_code(cls, v: Optional[str]) -> Optional[str]:
        """Valide le format du code si fourni."""
        if v is not None and not re.match(r"^\d{4}-\d{4}$", v):
            raise ValueError("Le code doit être au format YYYY-YYYY (ex: 2024-2025)")
        return v


class AnneeAcademiqueInDB(AnneeAcademiqueBase):
    """Schéma pour l'année académique en base de données."""
    
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AnneeAcademique(AnneeAcademiqueInDB):
    """Schéma complet pour l'année académique."""
    pass
