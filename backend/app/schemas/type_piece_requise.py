"""
Schémas Pydantic pour les types de pièces requises
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator


class TypePieceRequiseBase(BaseModel):
    """Schéma de base pour un type de pièce requise."""
    
    campagne_id: int
    type_piece: str
    libelle: str
    description: Optional[str] = None
    is_required: bool = True
    ordre: int = 1
    format_accepte: Optional[str] = None
    taille_max: Optional[int] = None

    @field_validator("type_piece", "libelle")
    @classmethod
    def validate_not_empty(cls, v: str) -> str:
        """Valide que le champ n'est pas vide."""
        v = v.strip()
        if not v:
            raise ValueError("Le champ ne peut pas être vide")
        return v

    @field_validator("ordre")
    @classmethod
    def validate_ordre(cls, v: int) -> int:
        """Valide que l'ordre est positif."""
        if v < 1:
            raise ValueError("L'ordre doit être supérieur ou égal à 1")
        return v

    @field_validator("taille_max")
    @classmethod
    def validate_taille_max(cls, v: Optional[int]) -> Optional[int]:
        """Valide que la taille max est positive."""
        if v is not None and v < 1:
            raise ValueError("La taille max doit être supérieure à 0")
        return v


class TypePieceRequiseCreate(TypePieceRequiseBase):
    """Schéma pour la création d'un type de pièce requise."""
    pass


class TypePieceRequiseUpdate(BaseModel):
    """Schéma pour la mise à jour d'un type de pièce requise."""
    
    type_piece: Optional[str] = None
    libelle: Optional[str] = None
    description: Optional[str] = None
    is_required: Optional[bool] = None
    ordre: Optional[int] = None
    format_accepte: Optional[str] = None
    taille_max: Optional[int] = None


class TypePieceRequiseInDB(TypePieceRequiseBase):
    """Schéma pour un type de pièce requise en base de données."""
    
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TypePieceRequise(TypePieceRequiseInDB):
    """Schéma complet pour un type de pièce requise."""
    pass
