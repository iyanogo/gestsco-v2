from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class TemplateDocumentBase(BaseModel):
    code: str = Field(..., max_length=50)
    libelle: str = Field(..., max_length=255)
    type_document: str = Field(..., max_length=50)
    description: Optional[str] = None
    template_html: str
    template_css: Optional[str] = None
    variables_disponibles: Optional[str] = None
    format_papier: str = Field(default="A4", max_length=20)
    orientation: str = Field(default="portrait", max_length=20)
    marges: Optional[str] = None
    en_tete_html: Optional[str] = None
    pied_page_html: Optional[str] = None
    est_systeme_defaut: bool = False
    is_active: bool = True


class TemplateDocumentCreate(TemplateDocumentBase):
    etablissement_id: Optional[int] = None


class TemplateDocumentUpdate(BaseModel):
    code: Optional[str] = Field(None, max_length=50)
    libelle: Optional[str] = Field(None, max_length=255)
    type_document: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None
    template_html: Optional[str] = None
    template_css: Optional[str] = None
    variables_disponibles: Optional[str] = None
    format_papier: Optional[str] = Field(None, max_length=20)
    orientation: Optional[str] = Field(None, max_length=20)
    marges: Optional[str] = None
    en_tete_html: Optional[str] = None
    pied_page_html: Optional[str] = None
    etablissement_id: Optional[int] = None
    est_systeme_defaut: Optional[bool] = None
    is_active: Optional[bool] = None


class TemplateDocumentInDB(TemplateDocumentBase):
    id: int
    etablissement_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TemplateDocumentResponse(TemplateDocumentInDB):
    pass


class TemplatePreviewRequest(BaseModel):
    variables: dict = {}


class TemplatePreviewResponse(BaseModel):
    html: str
