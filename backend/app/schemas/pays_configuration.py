from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field


class PaysConfigurationBase(BaseModel):
    code_pays: str = Field(..., max_length=3)
    nom_pays: str = Field(..., max_length=255)
    nom_pays_en: Optional[str] = Field(None, max_length=255)
    continent: str = Field(default="Afrique", max_length=50)
    region: Optional[str] = Field(None, max_length=100)
    
    # Paramètres académiques
    systeme_educatif: str = Field(..., max_length=50)
    organisme_regulation: Optional[str] = Field(None, max_length=255)
    langue_officielle: str = Field(..., max_length=50)
    langues_secondaires: Optional[str] = None
    
    # Paramètres financiers
    devise_officielle: str = Field(..., max_length=10)
    symbole_devise: Optional[str] = Field(None, max_length=10)
    format_montant: Optional[str] = Field(None, max_length=50)
    
    # Paramètres administratifs
    format_telephone: Optional[str] = Field(None, max_length=50)
    format_code_postal: Optional[str] = Field(None, max_length=50)
    format_matricule: Optional[str] = Field(None, max_length=100)
    
    # Paramètres de notation
    systeme_notation_defaut: str = Field(default="20", max_length=50)
    note_min_defaut: Decimal = Field(default=Decimal("0"))
    note_max_defaut: Decimal = Field(default=Decimal("20"))
    
    # Paramètres temporels
    fuseau_horaire: str = Field(..., max_length=50)
    format_date_defaut: str = Field(default="DD/MM/YYYY", max_length=50)
    debut_annee_academique: str = Field(default="10-01", max_length=5)
    fin_annee_academique: str = Field(default="09-30", max_length=5)
    
    # Jours fériés
    jours_feries: Optional[str] = None
    
    # Autres
    indicatif_telephonique: Optional[str] = Field(None, max_length=10)
    drapeau_url: Optional[str] = Field(None, max_length=500)
    is_active: bool = True


class PaysConfigurationCreate(PaysConfigurationBase):
    pass


class PaysConfigurationUpdate(BaseModel):
    nom_pays: Optional[str] = Field(None, max_length=255)
    nom_pays_en: Optional[str] = Field(None, max_length=255)
    continent: Optional[str] = Field(None, max_length=50)
    region: Optional[str] = Field(None, max_length=100)
    systeme_educatif: Optional[str] = Field(None, max_length=50)
    organisme_regulation: Optional[str] = Field(None, max_length=255)
    langue_officielle: Optional[str] = Field(None, max_length=50)
    langues_secondaires: Optional[str] = None
    devise_officielle: Optional[str] = Field(None, max_length=10)
    symbole_devise: Optional[str] = Field(None, max_length=10)
    format_montant: Optional[str] = Field(None, max_length=50)
    format_telephone: Optional[str] = Field(None, max_length=50)
    format_code_postal: Optional[str] = Field(None, max_length=50)
    format_matricule: Optional[str] = Field(None, max_length=100)
    systeme_notation_defaut: Optional[str] = Field(None, max_length=50)
    note_min_defaut: Optional[Decimal] = None
    note_max_defaut: Optional[Decimal] = None
    fuseau_horaire: Optional[str] = Field(None, max_length=50)
    format_date_defaut: Optional[str] = Field(None, max_length=50)
    debut_annee_academique: Optional[str] = Field(None, max_length=5)
    fin_annee_academique: Optional[str] = Field(None, max_length=5)
    jours_feries: Optional[str] = None
    indicatif_telephonique: Optional[str] = Field(None, max_length=10)
    drapeau_url: Optional[str] = Field(None, max_length=500)
    is_active: Optional[bool] = None


class PaysConfigurationInDB(PaysConfigurationBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PaysConfigurationResponse(PaysConfigurationInDB):
    pass
