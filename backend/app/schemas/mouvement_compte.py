from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict


class MouvementCompteBase(BaseModel):
    compte_id: int
    type_mouvement: str  # debit, credit
    montant: Decimal
    libelle: str
    description: Optional[str] = None


class MouvementCompteCreate(MouvementCompteBase):
    facture_id: Optional[int] = None
    paiement_id: Optional[int] = None


class MouvementCompteInDB(MouvementCompteBase):
    id: int
    solde_avant: Decimal
    solde_apres: Decimal
    facture_id: Optional[int] = None
    paiement_id: Optional[int] = None
    date_mouvement: datetime
    effectue_par: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MouvementCompte(MouvementCompteInDB):
    pass


class MouvementCompteWithDetails(MouvementCompte):
    facture_numero: Optional[str] = None
    paiement_numero: Optional[str] = None
    effectue_par_nom: Optional[str] = None
