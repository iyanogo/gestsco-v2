from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict


class TypeFraisBase(BaseModel):
    code: str
    libelle: str
    categorie: str  # inscription, scolarite, examen, bibliotheque, sport, autre
    montant_defaut: Optional[Decimal] = None
    est_obligatoire: bool = True
    est_recurrent: bool = False
    periode_application: Optional[str] = None  # annuel, semestriel, mensuel
    description: Optional[str] = None
    compte_comptable: Optional[str] = None
    is_active: bool = True


class TypeFraisCreate(TypeFraisBase):
    pass


class TypeFraisUpdate(BaseModel):
    code: Optional[str] = None
    libelle: Optional[str] = None
    categorie: Optional[str] = None
    montant_defaut: Optional[Decimal] = None
    est_obligatoire: Optional[bool] = None
    est_recurrent: Optional[bool] = None
    periode_application: Optional[str] = None
    description: Optional[str] = None
    compte_comptable: Optional[str] = None
    is_active: Optional[bool] = None


class TypeFraisInDB(TypeFraisBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TypeFrais(TypeFraisInDB):
    pass
