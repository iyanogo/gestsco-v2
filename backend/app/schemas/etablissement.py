"""
Schémas Pydantic pour l'entité Etablissement.
Adapté à la structure de la table existante.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, computed_field


class EtablissementBase(BaseModel):
    """Schéma de base pour Etablissement."""
    code: Optional[str] = Field(None, max_length=255, description="Code de l'établissement")
    nom: Optional[str] = Field(None, max_length=255, description="Nom de l'établissement")
    sigle: Optional[str] = Field(None, max_length=255, description="Sigle")
    ville: Optional[str] = Field(None, max_length=255, description="Ville")
    adresse: Optional[str] = Field(None, max_length=255, description="Adresse")
    telephone: Optional[str] = Field(None, max_length=255, description="Téléphone")
    fixe: Optional[str] = Field(None, max_length=255, description="Numéro fixe")
    email: Optional[str] = Field(None, max_length=255, description="Email")
    universite_id: Optional[int] = Field(None, description="ID de l'université parente")
    nom_directeur: Optional[str] = Field(None, max_length=255, description="Nom du directeur")
    prenom_directeur: Optional[str] = Field(None, max_length=255, description="Prénom du directeur")
    tel_directeur: Optional[str] = Field(None, max_length=255, description="Téléphone du directeur")


class EtablissementCreate(EtablissementBase):
    """Schéma pour la création d'un établissement."""
    pass


class EtablissementUpdate(BaseModel):
    """Schéma pour la mise à jour d'un établissement."""
    code: Optional[str] = Field(None, max_length=255)
    nom: Optional[str] = Field(None, max_length=255)
    sigle: Optional[str] = Field(None, max_length=255)
    ville: Optional[str] = Field(None, max_length=255)
    adresse: Optional[str] = Field(None, max_length=255)
    telephone: Optional[str] = Field(None, max_length=255)
    fixe: Optional[str] = Field(None, max_length=255)
    email: Optional[str] = Field(None, max_length=255)
    universite_id: Optional[int] = None
    nom_directeur: Optional[str] = Field(None, max_length=255)
    prenom_directeur: Optional[str] = Field(None, max_length=255)
    tel_directeur: Optional[str] = Field(None, max_length=255)


class Etablissement(EtablissementBase):
    """Schéma complet pour Etablissement."""
    id: int
    created_by: Optional[str] = None
    created_date: Optional[datetime] = None
    last_modified_by: Optional[str] = None
    last_modified_date: Optional[datetime] = None

    @computed_field
    @property
    def libelle(self) -> Optional[str]:
        """Alias pour compatibilité frontend."""
        return self.nom

    class Config:
        from_attributes = True
