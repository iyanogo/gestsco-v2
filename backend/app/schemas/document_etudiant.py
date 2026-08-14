"""
Schémas Pydantic pour les documents des étudiants
"""

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class DocumentEtudiantBase(BaseModel):
    """Schéma de base pour un document étudiant."""

    type_document: str = Field(..., max_length=100, description="Type de document (Acte de naissance, Bac, Photo, etc.)")
    libelle: str = Field(..., max_length=255, description="Libellé du document")
    numero_document: Optional[str] = Field(None, max_length=100)
    date_delivrance: Optional[date] = None
    lieu_delivrance: Optional[str] = Field(None, max_length=255)
    fichier_url: Optional[str] = Field(None, max_length=500)
    format_fichier: Optional[str] = Field(None, max_length=50, description="Format du fichier (pdf, jpg, png)")
    statut: str = Field("en_attente", max_length=50, description="Statut du document (en_attente, valide, refuse)")
    commentaire: Optional[str] = None


class DocumentEtudiantCreate(DocumentEtudiantBase):
    """Schéma pour la création d'un document étudiant."""

    etudiant_id: int = Field(..., description="ID de l'étudiant")


class DocumentEtudiantUpdate(BaseModel):
    """Schéma pour la mise à jour d'un document étudiant."""

    type_document: Optional[str] = Field(None, max_length=100)
    libelle: Optional[str] = Field(None, max_length=255)
    numero_document: Optional[str] = Field(None, max_length=100)
    date_delivrance: Optional[date] = None
    lieu_delivrance: Optional[str] = Field(None, max_length=255)
    fichier_url: Optional[str] = Field(None, max_length=500)
    format_fichier: Optional[str] = Field(None, max_length=50)
    statut: Optional[str] = Field(None, max_length=50)
    commentaire: Optional[str] = None


class DocumentEtudiantInDB(DocumentEtudiantBase):
    """Schéma pour un document étudiant en base de données."""

    id: int
    etudiant_id: int
    taille_fichier: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DocumentEtudiant(DocumentEtudiantInDB):
    """Schéma de réponse pour un document étudiant."""
    pass
