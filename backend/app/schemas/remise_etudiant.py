from datetime import datetime, date
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict


class RemiseEtudiantBase(BaseModel):
    remise_id: int
    etudiant_id: int
    facture_id: Optional[int] = None
    annee_academique_id: int
    montant_remise: Decimal
    motif: Optional[str] = None


class RemiseEtudiantCreate(RemiseEtudiantBase):
    pass


class RemiseEtudiantInDB(RemiseEtudiantBase):
    id: int
    date_attribution: date
    attribuee_par: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RemiseEtudiant(RemiseEtudiantInDB):
    pass


class RemiseEtudiantWithDetails(RemiseEtudiant):
    remise_code: Optional[str] = None
    remise_libelle: Optional[str] = None
    etudiant_nom: Optional[str] = None
    etudiant_prenom: Optional[str] = None
    etudiant_matricule: Optional[str] = None
    facture_numero: Optional[str] = None
    attribuee_par_nom: Optional[str] = None
