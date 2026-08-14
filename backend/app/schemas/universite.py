"""
Schémas Pydantic pour l'entité Universite.
Adapté à la structure de la table existante.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, computed_field


class UniversiteBase(BaseModel):
    """Schéma de base pour Universite."""
    code: Optional[str] = Field(None, max_length=255, description="Code de l'université")
    nom: Optional[str] = Field(None, max_length=255, description="Nom de l'université")
    sigle: Optional[str] = Field(None, max_length=255, description="Sigle de l'université")
    ville: Optional[str] = Field(None, max_length=255, description="Ville")
    adresse: Optional[str] = Field(None, max_length=255, description="Adresse de l'université")
    telephone: Optional[str] = Field(None, max_length=255, description="Numéro de téléphone")
    fixe: Optional[str] = Field(None, max_length=255, description="Numéro fixe")
    email: Optional[str] = Field(None, max_length=255, description="Adresse email")
    site: Optional[str] = Field(None, max_length=255, description="Site web")


class UniversiteCreate(UniversiteBase):
    """Schéma pour la création d'une université."""
    pass


class UniversiteUpdate(BaseModel):
    """Schéma pour la mise à jour d'une université."""
    code: Optional[str] = Field(None, max_length=255)
    nom: Optional[str] = Field(None, max_length=255)
    sigle: Optional[str] = Field(None, max_length=255)
    ville: Optional[str] = Field(None, max_length=255)
    adresse: Optional[str] = Field(None, max_length=255)
    telephone: Optional[str] = Field(None, max_length=255)
    fixe: Optional[str] = Field(None, max_length=255)
    email: Optional[str] = Field(None, max_length=255)
    site: Optional[str] = Field(None, max_length=255)


class UniversiteInDB(UniversiteBase):
    """Schéma pour Universite en base de données."""
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


class Universite(UniversiteInDB):
    """Schéma de réponse API pour Universite."""
    pass
