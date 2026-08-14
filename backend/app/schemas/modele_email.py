from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class ModeleEmailBase(BaseModel):
    code: str = Field(..., max_length=50)
    libelle: str = Field(..., max_length=255)
    type_destinataire: str = Field(..., max_length=50)
    objet: str = Field(..., max_length=500)
    corps_html: str
    corps_texte: Optional[str] = None
    variables_disponibles: Optional[str] = None
    pieces_jointes_auto: Optional[str] = None
    est_systeme_defaut: bool = False
    is_active: bool = True


class ModeleEmailCreate(ModeleEmailBase):
    etablissement_id: Optional[int] = None


class ModeleEmailUpdate(BaseModel):
    code: Optional[str] = Field(None, max_length=50)
    libelle: Optional[str] = Field(None, max_length=255)
    type_destinataire: Optional[str] = Field(None, max_length=50)
    objet: Optional[str] = Field(None, max_length=500)
    corps_html: Optional[str] = None
    corps_texte: Optional[str] = None
    variables_disponibles: Optional[str] = None
    pieces_jointes_auto: Optional[str] = None
    etablissement_id: Optional[int] = None
    est_systeme_defaut: Optional[bool] = None
    is_active: Optional[bool] = None


class ModeleEmailInDB(ModeleEmailBase):
    id: int
    etablissement_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ModeleEmailResponse(ModeleEmailInDB):
    pass


class ModeleEmailPreviewRequest(BaseModel):
    variables: Dict[str, Any] = {}


class ModeleEmailPreviewResponse(BaseModel):
    objet: str
    corps_html: str
    corps_texte: Optional[str] = None
