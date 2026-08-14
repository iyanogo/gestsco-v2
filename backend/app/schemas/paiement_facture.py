from datetime import datetime, date
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict


class PaiementFactureBase(BaseModel):
    facture_id: int
    etudiant_id: int
    montant: Decimal
    mode_paiement: str  # especes, cheque, virement, carte_bancaire, mobile_money, autre
    reference_transaction: Optional[str] = None
    banque: Optional[str] = None
    numero_cheque: Optional[str] = None
    observations: Optional[str] = None


class PaiementFactureCreate(PaiementFactureBase):
    pass


class PaiementFactureUpdate(BaseModel):
    montant: Optional[Decimal] = None
    mode_paiement: Optional[str] = None
    reference_transaction: Optional[str] = None
    banque: Optional[str] = None
    numero_cheque: Optional[str] = None
    observations: Optional[str] = None


class PaiementFactureValider(BaseModel):
    date_valeur: Optional[date] = None
    observations: Optional[str] = None


class PaiementFactureRejeter(BaseModel):
    motif_rejet: str


class PaiementFactureInDB(PaiementFactureBase):
    id: int
    numero_paiement: str
    numero_recu: Optional[str] = None
    date_paiement: datetime
    devise: str
    statut: str
    date_valeur: Optional[date] = None
    recu_par: Optional[int] = None
    valide_par: Optional[int] = None
    date_validation: Optional[datetime] = None
    rejete_par: Optional[int] = None
    date_rejet: Optional[datetime] = None
    motif_rejet: Optional[str] = None
    fichier_preuve_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaiementFacture(PaiementFactureInDB):
    pass


class PaiementFactureWithDetails(PaiementFacture):
    facture_numero: Optional[str] = None
    etudiant_nom: Optional[str] = None
    etudiant_prenom: Optional[str] = None
    etudiant_matricule: Optional[str] = None
