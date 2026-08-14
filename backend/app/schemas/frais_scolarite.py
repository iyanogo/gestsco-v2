from datetime import datetime, date
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict


class FraisScolariteBase(BaseModel):
    type_frais_id: int
    niveau_id: Optional[int] = None
    filiere_id: Optional[int] = None
    cycle_id: Optional[int] = None
    annee_academique_id: int
    montant: Decimal
    devise: str = "XOF"
    date_debut_validite: date
    date_fin_validite: date
    description: Optional[str] = None
    is_active: bool = True


class FraisScolariteCreate(FraisScolariteBase):
    pass


class FraisScolariteUpdate(BaseModel):
    type_frais_id: Optional[int] = None
    niveau_id: Optional[int] = None
    filiere_id: Optional[int] = None
    cycle_id: Optional[int] = None
    annee_academique_id: Optional[int] = None
    montant: Optional[Decimal] = None
    devise: Optional[str] = None
    date_debut_validite: Optional[date] = None
    date_fin_validite: Optional[date] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class FraisScolariteInDB(FraisScolariteBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FraisScolarite(FraisScolariteInDB):
    pass


class FraisScolariteWithDetails(FraisScolarite):
    type_frais_libelle: Optional[str] = None
    niveau_libelle: Optional[str] = None
    filiere_libelle: Optional[str] = None
    cycle_libelle: Optional[str] = None
    annee_academique_code: Optional[str] = None
