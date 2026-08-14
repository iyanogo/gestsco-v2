"""
Schémas Pydantic pour les notes.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any

from pydantic import BaseModel, ConfigDict, Field


class NoteBase(BaseModel):
    """Schéma de base pour une note."""
    examen_id: int
    inscription_matiere_id: int
    etudiant_id: int
    note: Optional[float] = Field(None, ge=0, le=20)
    statut_presence: str = Field(
        default="present",
        pattern="^(present|absent|absent_justifie|dispense)$"
    )
    numero_anonymat: Optional[str] = Field(None, max_length=50)
    observation: Optional[str] = None


class NoteCreate(NoteBase):
    """Schéma pour la création d'une note."""
    pass


class NoteUpdate(BaseModel):
    """Schéma pour la mise à jour d'une note."""
    note: Optional[float] = Field(None, ge=0, le=20)
    statut_presence: Optional[str] = Field(
        None,
        pattern="^(present|absent|absent_justifie|dispense)$"
    )
    observation: Optional[str] = None


class NoteBulkItem(BaseModel):
    """Schéma pour un élément de saisie en masse."""
    etudiant_id: int
    inscription_matiere_id: int
    note: Optional[float] = Field(None, ge=0, le=20)
    statut_presence: str = Field(
        default="present",
        pattern="^(present|absent|absent_justifie|dispense)$"
    )


class NoteBulkCreate(BaseModel):
    """Schéma pour la saisie en masse de notes."""
    examen_id: int
    notes: List[NoteBulkItem]


class NoteInDB(NoteBase):
    """Schéma pour une note en base de données."""
    id: int
    note_sur: float
    note_sur_20: Optional[float]
    saisie_par: Optional[int]
    date_saisie: Optional[datetime]
    validee_par: Optional[int]
    date_validation: Optional[datetime]
    is_valide: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Note(NoteInDB):
    """Schéma complet pour une note."""
    pass


class NoteWithDetails(Note):
    """Schéma avec détails de l'étudiant."""
    etudiant_matricule: Optional[str] = None
    etudiant_nom: Optional[str] = None
    etudiant_prenom: Optional[str] = None
    matiere_libelle: Optional[str] = None


class NoteValidation(BaseModel):
    """Schéma pour la validation de notes."""
    note_ids: List[int]
    observation: Optional[str] = None
