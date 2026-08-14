from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

from app.schemas.ligne_facture import LigneFacture, LigneFactureCreate


class FactureBase(BaseModel):
    etudiant_id: int
    annee_academique_id: int
    date_echeance: date
    type_facture: str  # inscription, scolarite, examen, autre
    description: Optional[str] = None
    observations: Optional[str] = None


class FactureCreate(FactureBase):
    lignes: List[LigneFactureCreate]


class FactureUpdate(BaseModel):
    date_echeance: Optional[date] = None
    description: Optional[str] = None
    observations: Optional[str] = None


class FactureAnnuler(BaseModel):
    motif_annulation: str


class FactureInDB(FactureBase):
    id: int
    numero_facture: str
    date_emission: date
    montant_total: Decimal
    montant_paye: Decimal
    montant_restant: Decimal
    devise: str
    statut: str
    emise_par: Optional[int] = None
    validee_par: Optional[int] = None
    date_validation: Optional[datetime] = None
    annulee_par: Optional[int] = None
    date_annulation: Optional[datetime] = None
    motif_annulation: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Facture(FactureInDB):
    pass


class FactureWithDetails(Facture):
    lignes: List[LigneFacture] = []
    etudiant_nom: Optional[str] = None
    etudiant_prenom: Optional[str] = None
    etudiant_matricule: Optional[str] = None
    annee_academique_code: Optional[str] = None


class FactureWithPaiements(FactureWithDetails):
    paiements: List["PaiementFactureInDB"] = []


# Import pour éviter les références circulaires
from app.schemas.paiement_facture import PaiementFactureInDB  # noqa: E402
