"""
Schémas Pydantic pour les paiements
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator


TYPES_PAIEMENT = ["frais_inscription", "frais_scolarite", "frais_examen", "autre"]
MODES_PAIEMENT = ["especes", "virement", "mobile_money", "carte_bancaire"]
STATUTS_PAIEMENT = ["en_attente", "valide", "refuse", "rembourse"]


class PaiementBase(BaseModel):
    """Schéma de base pour un paiement."""
    
    type_paiement: str
    montant: float
    devise: str = "XOF"
    mode_paiement: str
    reference_paiement: Optional[str] = None
    operateur: Optional[str] = None
    commentaire: Optional[str] = None

    @field_validator("montant")
    @classmethod
    def validate_montant(cls, v: float) -> float:
        """Valide que le montant est positif."""
        if v < 0:
            raise ValueError("Le montant doit être positif ou nul")
        return v

    @field_validator("type_paiement")
    @classmethod
    def validate_type_paiement(cls, v: str) -> str:
        """Valide le type de paiement."""
        if v not in TYPES_PAIEMENT:
            raise ValueError(f"Le type de paiement doit être parmi: {', '.join(TYPES_PAIEMENT)}")
        return v

    @field_validator("mode_paiement")
    @classmethod
    def validate_mode_paiement(cls, v: str) -> str:
        """Valide le mode de paiement."""
        if v not in MODES_PAIEMENT:
            raise ValueError(f"Le mode de paiement doit être parmi: {', '.join(MODES_PAIEMENT)}")
        return v


class PaiementCreate(PaiementBase):
    """Schéma pour la création d'un paiement."""
    
    dossier_id: Optional[int] = None
    inscrit_id: Optional[int] = None

    @field_validator("inscrit_id")
    @classmethod
    def validate_ids(cls, v: Optional[int], info) -> Optional[int]:
        """Valide qu'au moins un ID est fourni."""
        dossier_id = info.data.get("dossier_id")
        if v is None and dossier_id is None:
            raise ValueError("Au moins un dossier_id ou inscrit_id doit être fourni")
        return v


class PaiementUpdate(BaseModel):
    """Schéma pour la mise à jour d'un paiement."""
    
    statut_paiement: Optional[str] = None
    numero_recu: Optional[str] = None
    commentaire: Optional[str] = None

    @field_validator("statut_paiement")
    @classmethod
    def validate_statut(cls, v: Optional[str]) -> Optional[str]:
        """Valide le statut si fourni."""
        if v is not None and v not in STATUTS_PAIEMENT:
            raise ValueError(f"Le statut doit être parmi: {', '.join(STATUTS_PAIEMENT)}")
        return v


class PaiementValidation(BaseModel):
    """Schéma pour la validation d'un paiement."""
    
    statut_paiement: str
    numero_recu: Optional[str] = None
    commentaire: Optional[str] = None

    @field_validator("statut_paiement")
    @classmethod
    def validate_statut(cls, v: str) -> str:
        """Valide le statut."""
        if v not in ["valide", "refuse"]:
            raise ValueError("Le statut doit être 'valide' ou 'refuse'")
        return v


class PaiementInDB(PaiementBase):
    """Schéma pour un paiement en base de données."""
    
    id: int
    numero_transaction: str
    dossier_id: Optional[int] = None
    inscrit_id: Optional[int] = None
    date_paiement: datetime
    statut_paiement: str
    numero_recu: Optional[str] = None
    valide_par: Optional[int] = None
    date_validation: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Paiement(PaiementInDB):
    """Schéma complet pour un paiement."""
    pass


class PaiementWithDetails(Paiement):
    """Schéma avec détails du validateur."""
    
    validateur_nom: Optional[str] = None
