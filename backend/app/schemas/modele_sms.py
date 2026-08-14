from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class ModeleSMSBase(BaseModel):
    code: str = Field(..., max_length=50)
    libelle: str = Field(..., max_length=255)
    type_destinataire: str = Field(..., max_length=50)
    message: str
    variables_disponibles: Optional[str] = None
    est_systeme_defaut: bool = False
    is_active: bool = True


class ModeleSMSCreate(ModeleSMSBase):
    etablissement_id: Optional[int] = None


class ModeleSMSUpdate(BaseModel):
    code: Optional[str] = Field(None, max_length=50)
    libelle: Optional[str] = Field(None, max_length=255)
    type_destinataire: Optional[str] = Field(None, max_length=50)
    message: Optional[str] = None
    variables_disponibles: Optional[str] = None
    etablissement_id: Optional[int] = None
    est_systeme_defaut: Optional[bool] = None
    is_active: Optional[bool] = None


class ModeleSMSInDB(ModeleSMSBase):
    id: int
    etablissement_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ModeleSMSResponse(ModeleSMSInDB):
    pass


class ModeleSMSPreviewRequest(BaseModel):
    variables: Dict[str, Any] = {}


class ModeleSMSPreviewResponse(BaseModel):
    message: str
    longueur: int
