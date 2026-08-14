from datetime import datetime
from typing import Optional, Any, Dict
from pydantic import BaseModel, Field


class RegleCalculBase(BaseModel):
    code: str = Field(..., max_length=50)
    libelle: str = Field(..., max_length=255)
    type_regle: str = Field(..., max_length=50)
    description: Optional[str] = None
    formule: str
    conditions: Optional[str] = None
    ordre_execution: int = 0
    est_systeme_defaut: bool = False
    is_active: bool = True


class RegleCalculCreate(RegleCalculBase):
    etablissement_id: Optional[int] = None
    cycle_id: Optional[int] = None


class RegleCalculUpdate(BaseModel):
    code: Optional[str] = Field(None, max_length=50)
    libelle: Optional[str] = Field(None, max_length=255)
    type_regle: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None
    formule: Optional[str] = None
    conditions: Optional[str] = None
    ordre_execution: Optional[int] = None
    etablissement_id: Optional[int] = None
    cycle_id: Optional[int] = None
    est_systeme_defaut: Optional[bool] = None
    is_active: Optional[bool] = None


class RegleCalculInDB(RegleCalculBase):
    id: int
    etablissement_id: Optional[int] = None
    cycle_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RegleCalculResponse(RegleCalculInDB):
    pass


class RegleCalculTestRequest(BaseModel):
    donnees: Dict[str, Any]


class RegleCalculTestResponse(BaseModel):
    resultat: Any
    details: Optional[Dict[str, Any]] = None
