"""
Schémas Pydantic pour l'entité Étudiant
"""

from datetime import date, datetime
from typing import Optional, List

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.validators import OptionalEmailEtablissement


class EtudiantBase(BaseModel):
    """Schéma de base pour l'étudiant."""

    nom: str = Field(..., min_length=1, max_length=255, description="Nom de l'étudiant")
    prenom: str = Field(..., min_length=1, max_length=255, description="Prénom de l'étudiant")
    date_naissance: Optional[str] = Field(None, description="Date de naissance (format YYYY-MM-DD)")
    lieu_naissance: Optional[str] = Field(None, max_length=255)
    sexe: Optional[str] = Field(None, max_length=255, description="Sexe (M/F ou MASCULIN/FEMININ)")
    nationalite: Optional[str] = Field(None, max_length=255)
    email: OptionalEmailEtablissement = Field(None, description="Email de l'étudiant")
    telephone: Optional[str] = Field(None, max_length=255)
    telephone_urgence: Optional[str] = Field(None, max_length=50)
    adresse: Optional[str] = Field(None, max_length=500)
    ville: Optional[str] = Field(None, max_length=100)
    pays: Optional[str] = Field("Burkina Faso", max_length=100)
    
    # Informations familiales
    nom_pere: Optional[str] = Field(None, max_length=100)
    profession_pere: Optional[str] = Field(None, max_length=100)
    nom_mere: Optional[str] = Field(None, max_length=100)
    profession_mere: Optional[str] = Field(None, max_length=100)
    personne_contact: Optional[str] = Field(None, max_length=100)
    telephone_contact: Optional[str] = Field(None, max_length=50)
    
    # Informations académiques
    annee_bac: Optional[str] = Field(None, max_length=255)
    numero_bac: Optional[str] = Field(None, max_length=255)
    mention: Optional[str] = Field(None, max_length=255)
    diplome: Optional[str] = Field(None, max_length=255)
    boursier: Optional[bool] = Field(None)
    cni: Optional[str] = Field(None, max_length=255)
    
    # Statut
    statut: Optional[str] = Field("actif", max_length=50)
    is_active: Optional[bool] = Field(True)


class EtudiantCreate(EtudiantBase):
    """Schéma pour la création d'un étudiant (matricule généré automatiquement)."""
    pass


class EtudiantUpdate(BaseModel):
    """Schéma pour la mise à jour d'un étudiant (tous les champs optionnels)."""

    nom: Optional[str] = Field(None, min_length=1, max_length=255)
    prenom: Optional[str] = Field(None, min_length=1, max_length=255)
    date_naissance: Optional[str] = Field(None)
    lieu_naissance: Optional[str] = Field(None, max_length=255)
    sexe: Optional[str] = Field(None, max_length=255)
    nationalite: Optional[str] = Field(None, max_length=255)
    email: OptionalEmailEtablissement = None
    telephone: Optional[str] = Field(None, max_length=255)
    telephone_urgence: Optional[str] = Field(None, max_length=50)
    adresse: Optional[str] = Field(None, max_length=500)
    ville: Optional[str] = Field(None, max_length=100)
    pays: Optional[str] = Field(None, max_length=100)
    nom_pere: Optional[str] = Field(None, max_length=100)
    profession_pere: Optional[str] = Field(None, max_length=100)
    nom_mere: Optional[str] = Field(None, max_length=100)
    profession_mere: Optional[str] = Field(None, max_length=100)
    personne_contact: Optional[str] = Field(None, max_length=100)
    telephone_contact: Optional[str] = Field(None, max_length=50)
    annee_bac: Optional[str] = Field(None, max_length=255)
    numero_bac: Optional[str] = Field(None, max_length=255)
    mention: Optional[str] = Field(None, max_length=255)
    diplome: Optional[str] = Field(None, max_length=255)
    boursier: Optional[bool] = None
    cni: Optional[str] = Field(None, max_length=255)
    numero_carte: Optional[str] = Field(None, max_length=50)
    ine: Optional[str] = Field(None, max_length=50)
    photo_url: Optional[str] = Field(None, max_length=500)
    statut: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None


class EtudiantInDB(EtudiantBase):
    """Schéma pour un étudiant en base de données."""

    id: int
    matricule: Optional[str] = None
    numero_carte: Optional[str] = None
    ine: Optional[str] = None
    photo_url: Optional[str] = None
    created_by: Optional[str] = None
    created_date: Optional[datetime] = None
    last_modified_by: Optional[str] = None
    last_modified_date: Optional[datetime] = None
    importation_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class Etudiant(EtudiantInDB):
    """Schéma de réponse pour un étudiant."""
    pass


class EtudiantWithDetails(Etudiant):
    """Schéma de réponse pour un étudiant avec ses documents et inscriptions."""

    documents: List["DocumentEtudiantResponse"] = []
    inscriptions: List["InscriptionResponse"] = []


# Import différé pour éviter les imports circulaires
from app.schemas.document_etudiant import DocumentEtudiant as DocumentEtudiantResponse
from app.schemas.inscription import Inscription as InscriptionResponse

EtudiantWithDetails.model_rebuild()
