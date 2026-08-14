from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field


class MentionNotationBase(BaseModel):
    code: str = Field(..., max_length=50)
    libelle: str = Field(..., max_length=255)
    note_min: Decimal
    note_max: Decimal
    couleur: Optional[str] = Field(None, max_length=7)
    ordre: int = 0
    description: Optional[str] = None
    is_active: bool = True


class MentionNotationCreate(MentionNotationBase):
    bareme_id: int


class MentionNotationUpdate(BaseModel):
    code: Optional[str] = Field(None, max_length=50)
    libelle: Optional[str] = Field(None, max_length=255)
    note_min: Optional[Decimal] = None
    note_max: Optional[Decimal] = None
    couleur: Optional[str] = Field(None, max_length=7)
    ordre: Optional[int] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class MentionNotationInDB(MentionNotationBase):
    id: int
    bareme_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class MentionNotationResponse(MentionNotationInDB):
    pass


class BaremeNotationBase(BaseModel):
    code: str = Field(..., max_length=50)
    libelle: str = Field(..., max_length=255)
    description: Optional[str] = None
    note_min: Decimal
    note_max: Decimal
    est_systeme_defaut: bool = False
    is_active: bool = True


class BaremeNotationCreate(BaremeNotationBase):
    etablissement_id: Optional[int] = None
    cycle_id: Optional[int] = None


class BaremeNotationUpdate(BaseModel):
    code: Optional[str] = Field(None, max_length=50)
    libelle: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    note_min: Optional[Decimal] = None
    note_max: Optional[Decimal] = None
    etablissement_id: Optional[int] = None
    cycle_id: Optional[int] = None
    est_systeme_defaut: Optional[bool] = None
    is_active: Optional[bool] = None


class BaremeNotationInDB(BaremeNotationBase):
    id: int
    etablissement_id: Optional[int] = None
    cycle_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BaremeNotationResponse(BaremeNotationInDB):
    pass


class BaremeNotationWithMentions(BaremeNotationResponse):
    mentions: List[MentionNotationResponse] = []
