from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class EcheancierBase(BaseModel):
    etudiant_id: int
    facture_id: int
    numero_echeance: int
    date_echeance: date
    montant_echeance: Decimal
    observations: Optional[str] = None


class EcheanceItem(BaseModel):
    date_echeance: date
    montant_echeance: Decimal


class EcheancierCreate(BaseModel):
    facture_id: int
    echeances: List[EcheanceItem]


class EcheancierUpdate(BaseModel):
    date_echeance: Optional[date] = None
    montant_echeance: Optional[Decimal] = None
    observations: Optional[str] = None


class EcheancierInDB(EcheancierBase):
    id: int
    montant_paye: Decimal
    statut: str  # en_attente, payee, en_retard
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Echeancier(EcheancierInDB):
    pass


class EcheancierWithDetails(Echeancier):
    etudiant_nom: Optional[str] = None
    etudiant_prenom: Optional[str] = None
    etudiant_matricule: Optional[str] = None
    facture_numero: Optional[str] = None
    montant_restant: Optional[Decimal] = None
