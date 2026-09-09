from datetime import datetime
from decimal import Decimal
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict


class ConfigurationDeliberationBase(BaseModel):
    annee_academique_id: int
    niveau_id: Optional[int] = None
    periodicite: str = "semestrielle"
    compensation_semestres: bool = True
    note_eliminatoire: Optional[Decimal] = None
    nombre_matieres_dette_max: Optional[int] = 2
    moyenne_validation: Decimal = Decimal("10.0")
    moyenne_passage_conditionnel: Optional[Decimal] = Decimal("8.0")
    credits_min_passage: Optional[int] = None
    taux_presence_min: Optional[Decimal] = Decimal("75.0")
    autoriser_rattrapage: bool = True
    nombre_sessions_max: int = 2
    regles_specifiques: Optional[dict[str, Any]] = None


class ConfigurationDeliberationCreate(ConfigurationDeliberationBase):
    pass


class ConfigurationDeliberationUpdate(BaseModel):
    niveau_id: Optional[int] = None
    periodicite: Optional[str] = None
    compensation_semestres: Optional[bool] = None
    note_eliminatoire: Optional[Decimal] = None
    nombre_matieres_dette_max: Optional[int] = None
    moyenne_validation: Optional[Decimal] = None
    moyenne_passage_conditionnel: Optional[Decimal] = None
    credits_min_passage: Optional[int] = None
    taux_presence_min: Optional[Decimal] = None
    autoriser_rattrapage: Optional[bool] = None
    nombre_sessions_max: Optional[int] = None
    regles_specifiques: Optional[dict[str, Any]] = None


class ConfigurationDeliberationInDB(ConfigurationDeliberationBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConfigurationDeliberation(ConfigurationDeliberationInDB):
    pass
