from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict


class LigneFactureBase(BaseModel):
    libelle: str
    description: Optional[str] = None
    quantite: int = 1
    prix_unitaire: Decimal
    tva_taux: Decimal = Decimal("0")


class LigneFactureCreate(LigneFactureBase):
    frais_scolarite_id: Optional[int] = None


class LigneFactureUpdate(BaseModel):
    libelle: Optional[str] = None
    description: Optional[str] = None
    quantite: Optional[int] = None
    prix_unitaire: Optional[Decimal] = None
    tva_taux: Optional[Decimal] = None
    frais_scolarite_id: Optional[int] = None


class LigneFactureInDB(LigneFactureBase):
    id: int
    facture_id: int
    frais_scolarite_id: Optional[int] = None
    montant_ligne: Decimal
    tva_montant: Decimal
    montant_ttc: Decimal
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LigneFacture(LigneFactureInDB):
    pass
