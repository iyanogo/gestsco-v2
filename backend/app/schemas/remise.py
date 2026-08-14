from datetime import datetime, date
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict


class RemiseBase(BaseModel):
    code: str
    libelle: str
    type_remise: str  # pourcentage, montant_fixe
    valeur: Decimal
    type_frais_id: Optional[int] = None
    conditions: Optional[str] = None
    date_debut: date
    date_fin: date
    nombre_utilisations_max: Optional[int] = None
    is_active: bool = True


class RemiseCreate(RemiseBase):
    pass


class RemiseUpdate(BaseModel):
    code: Optional[str] = None
    libelle: Optional[str] = None
    type_remise: Optional[str] = None
    valeur: Optional[Decimal] = None
    type_frais_id: Optional[int] = None
    conditions: Optional[str] = None
    date_debut: Optional[date] = None
    date_fin: Optional[date] = None
    nombre_utilisations_max: Optional[int] = None
    is_active: Optional[bool] = None


class RemiseInDB(RemiseBase):
    id: int
    nombre_utilisations: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Remise(RemiseInDB):
    pass


class RemiseWithDetails(Remise):
    type_frais_libelle: Optional[str] = None
    peut_etre_utilisee: bool = True
