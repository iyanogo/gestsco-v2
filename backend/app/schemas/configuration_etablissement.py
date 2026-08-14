from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr


class ConfigurationEtablissementBase(BaseModel):
    etablissement_id: int
    annee_academique_id: Optional[int] = None
    
    # Informations générales
    nom_complet: str = Field(..., max_length=500)
    nom_court: str = Field(..., max_length=255)
    sigle: Optional[str] = Field(None, max_length=50)
    slogan: Optional[str] = Field(None, max_length=500)
    logo_url: Optional[str] = Field(None, max_length=500)
    banniere_url: Optional[str] = Field(None, max_length=500)
    
    # Coordonnées
    adresse_complete: Optional[str] = None
    ville: Optional[str] = Field(None, max_length=100)
    code_postal: Optional[str] = Field(None, max_length=20)
    pays: str = Field(default="Burkina Faso", max_length=100)
    telephone_principal: Optional[str] = Field(None, max_length=50)
    telephone_secondaire: Optional[str] = Field(None, max_length=50)
    email_principal: Optional[str] = Field(None, max_length=255)
    email_scolarite: Optional[str] = Field(None, max_length=255)
    site_web: Optional[str] = Field(None, max_length=255)
    
    # Réseaux sociaux
    facebook_url: Optional[str] = Field(None, max_length=255)
    twitter_url: Optional[str] = Field(None, max_length=255)
    linkedin_url: Optional[str] = Field(None, max_length=255)
    
    # Paramètres académiques
    systeme_notation: str = Field(default="LMD", max_length=50)
    referentiel: str = Field(default="CAMES", max_length=50)
    langue_enseignement: str = Field(default="Français", max_length=50)
    langues_secondaires: Optional[str] = None
    
    # Paramètres financiers
    devise: str = Field(default="XOF", max_length=10)
    tva_applicable: bool = False
    tva_taux_defaut: Optional[Decimal] = None
    
    # Paramètres de notation
    note_minimale: Decimal = Field(default=Decimal("0"))
    note_maximale: Decimal = Field(default=Decimal("20"))
    note_passage: Decimal = Field(default=Decimal("10"))
    precision_notes: int = Field(default=2)
    
    # Paramètres de présence
    taux_presence_minimum: Decimal = Field(default=Decimal("75"))
    sanction_absence: Optional[str] = Field(None, max_length=100)
    
    # Paramètres d'inscription
    inscription_en_ligne_active: bool = True
    validation_manuelle_dossiers: bool = True
    pieces_obligatoires: Optional[str] = None
    
    # Paramètres de communication
    email_expediteur_nom: Optional[str] = Field(None, max_length=255)
    email_expediteur_adresse: Optional[str] = Field(None, max_length=255)
    sms_actif: bool = False
    sms_expediteur: Optional[str] = Field(None, max_length=50)
    
    # Paramètres d'affichage
    couleur_primaire: Optional[str] = Field(default="#1976d2", max_length=7)
    couleur_secondaire: Optional[str] = Field(default="#dc004e", max_length=7)
    theme: str = Field(default="light", max_length=20)
    
    # Autres
    fuseau_horaire: str = Field(default="Africa/Ouagadougou", max_length=50)
    format_date: str = Field(default="DD/MM/YYYY", max_length=50)
    format_heure: str = Field(default="HH:mm", max_length=50)
    is_active: bool = True


class ConfigurationEtablissementCreate(ConfigurationEtablissementBase):
    pass


class ConfigurationEtablissementUpdate(BaseModel):
    annee_academique_id: Optional[int] = None
    nom_complet: Optional[str] = Field(None, max_length=500)
    nom_court: Optional[str] = Field(None, max_length=255)
    sigle: Optional[str] = Field(None, max_length=50)
    slogan: Optional[str] = Field(None, max_length=500)
    logo_url: Optional[str] = Field(None, max_length=500)
    banniere_url: Optional[str] = Field(None, max_length=500)
    adresse_complete: Optional[str] = None
    ville: Optional[str] = Field(None, max_length=100)
    code_postal: Optional[str] = Field(None, max_length=20)
    pays: Optional[str] = Field(None, max_length=100)
    telephone_principal: Optional[str] = Field(None, max_length=50)
    telephone_secondaire: Optional[str] = Field(None, max_length=50)
    email_principal: Optional[str] = Field(None, max_length=255)
    email_scolarite: Optional[str] = Field(None, max_length=255)
    site_web: Optional[str] = Field(None, max_length=255)
    facebook_url: Optional[str] = Field(None, max_length=255)
    twitter_url: Optional[str] = Field(None, max_length=255)
    linkedin_url: Optional[str] = Field(None, max_length=255)
    systeme_notation: Optional[str] = Field(None, max_length=50)
    referentiel: Optional[str] = Field(None, max_length=50)
    langue_enseignement: Optional[str] = Field(None, max_length=50)
    langues_secondaires: Optional[str] = None
    devise: Optional[str] = Field(None, max_length=10)
    tva_applicable: Optional[bool] = None
    tva_taux_defaut: Optional[Decimal] = None
    note_minimale: Optional[Decimal] = None
    note_maximale: Optional[Decimal] = None
    note_passage: Optional[Decimal] = None
    precision_notes: Optional[int] = None
    taux_presence_minimum: Optional[Decimal] = None
    sanction_absence: Optional[str] = Field(None, max_length=100)
    inscription_en_ligne_active: Optional[bool] = None
    validation_manuelle_dossiers: Optional[bool] = None
    pieces_obligatoires: Optional[str] = None
    email_expediteur_nom: Optional[str] = Field(None, max_length=255)
    email_expediteur_adresse: Optional[str] = Field(None, max_length=255)
    sms_actif: Optional[bool] = None
    sms_expediteur: Optional[str] = Field(None, max_length=50)
    couleur_primaire: Optional[str] = Field(None, max_length=7)
    couleur_secondaire: Optional[str] = Field(None, max_length=7)
    theme: Optional[str] = Field(None, max_length=20)
    fuseau_horaire: Optional[str] = Field(None, max_length=50)
    format_date: Optional[str] = Field(None, max_length=50)
    format_heure: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None


class ConfigurationEtablissementInDB(ConfigurationEtablissementBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ConfigurationEtablissementResponse(ConfigurationEtablissementInDB):
    pass


class ConfigurationCouleursUpdate(BaseModel):
    couleur_primaire: str = Field(..., max_length=7)
    couleur_secondaire: str = Field(..., max_length=7)
