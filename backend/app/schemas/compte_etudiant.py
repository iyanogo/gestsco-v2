from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class CompteEtudiantBase(BaseModel):
    etudiant_id: int
    annee_academique_id: int
    observations: Optional[str] = None


class CompteEtudiantCreate(CompteEtudiantBase):
    pass


class CompteEtudiantUpdate(BaseModel):
    statut_compte: Optional[str] = None  # actif, suspendu, bloque, solde
    observations: Optional[str] = None


class CompteEtudiantInDB(CompteEtudiantBase):
    id: int
    solde_actuel: Decimal
    total_facture: Decimal
    total_paye: Decimal
    total_restant: Decimal
    devise: str
    statut_compte: str
    date_derniere_operation: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CompteEtudiant(CompteEtudiantInDB):
    pass


class CompteEtudiantWithDetails(CompteEtudiant):
    etudiant_nom: Optional[str] = None
    etudiant_prenom: Optional[str] = None
    etudiant_matricule: Optional[str] = None
    annee_academique_code: Optional[str] = None


class CompteEtudiantWithMouvements(CompteEtudiantWithDetails):
    mouvements_recents: List["MouvementCompteInDB"] = []


# Import pour éviter les références circulaires
from app.schemas.mouvement_compte import MouvementCompteInDB  # noqa: E402
