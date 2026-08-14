from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field


class ParametreSystemeBase(BaseModel):
    categorie: str = Field(..., max_length=100)
    cle: str = Field(..., max_length=255)
    valeur: str
    type_valeur: str = Field(..., max_length=50)
    libelle: str = Field(..., max_length=255)
    description: Optional[str] = None
    unite: Optional[str] = Field(None, max_length=50)
    valeur_defaut: Optional[str] = None
    est_modifiable: bool = True
    est_visible: bool = True
    ordre_affichage: int = 0


class ParametreSystemeCreate(ParametreSystemeBase):
    pass


class ParametreSystemeUpdate(BaseModel):
    categorie: Optional[str] = Field(None, max_length=100)
    valeur: Optional[str] = None
    type_valeur: Optional[str] = Field(None, max_length=50)
    libelle: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    unite: Optional[str] = Field(None, max_length=50)
    valeur_defaut: Optional[str] = None
    est_modifiable: Optional[bool] = None
    est_visible: Optional[bool] = None
    ordre_affichage: Optional[int] = None


class ParametreSystemeUpdateValeur(BaseModel):
    valeur: Any


class ParametreSystemeInDB(ParametreSystemeBase):
    id: int
    modifie_par: Optional[int] = None
    date_modification: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ParametreSystemeResponse(ParametreSystemeInDB):
    pass


class ParametreSystemeWithModificateur(ParametreSystemeResponse):
    modificateur_nom: Optional[str] = None
