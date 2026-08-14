"""
Schémas Pydantic pour les pièces jointes
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator


class PieceJointeBase(BaseModel):
    """Schéma de base pour une pièce jointe."""
    
    type_piece: str
    libelle: str
    fichier_url: str
    format_fichier: Optional[str] = None
    taille_fichier: Optional[int] = None
    is_required: bool = True

    @field_validator("type_piece", "libelle")
    @classmethod
    def validate_not_empty(cls, v: str) -> str:
        """Valide que le champ n'est pas vide."""
        v = v.strip()
        if not v:
            raise ValueError("Le champ ne peut pas être vide")
        return v

    @field_validator("taille_fichier")
    @classmethod
    def validate_taille(cls, v: Optional[int]) -> Optional[int]:
        """Valide que la taille est positive."""
        if v is not None and v < 0:
            raise ValueError("La taille doit être positive")
        return v


class PieceJointeCreate(PieceJointeBase):
    """Schéma pour la création d'une pièce jointe."""
    
    dossier_id: int


class PieceJointeUpdate(BaseModel):
    """Schéma pour la mise à jour d'une pièce jointe."""
    
    libelle: Optional[str] = None
    fichier_url: Optional[str] = None
    is_valide: Optional[bool] = None
    commentaire: Optional[str] = None


class PieceJointeInDB(PieceJointeBase):
    """Schéma pour une pièce jointe en base de données."""
    
    id: int
    dossier_id: int
    is_valide: bool
    commentaire: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PieceJointe(PieceJointeInDB):
    """Schéma complet pour une pièce jointe."""
    pass
