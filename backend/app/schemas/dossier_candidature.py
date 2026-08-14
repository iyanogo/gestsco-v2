"""
Schémas Pydantic pour les dossiers de candidature
"""

import re
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator


STATUTS_DOSSIER = ["en_cours", "complet", "valide", "refuse", "admis"]


class DossierCandidatureBase(BaseModel):
    """Schéma de base pour un dossier de candidature."""
    
    campagne_id: int
    candidat_nom: str
    candidat_prenom: str
    candidat_email: EmailStr
    candidat_telephone: Optional[str] = None
    candidat_date_naissance: date
    candidat_lieu_naissance: Optional[str] = None
    candidat_sexe: str
    candidat_nationalite: Optional[str] = None
    candidat_adresse: Optional[str] = None
    filiere_souhaitee_1: int
    filiere_souhaitee_2: Optional[int] = None
    filiere_souhaitee_3: Optional[int] = None
    diplome_precedent: Optional[str] = None
    etablissement_precedent: Optional[str] = None
    annee_obtention_diplome: Optional[int] = None
    moyenne_generale: Optional[float] = None

    @field_validator("candidat_nom", "candidat_prenom")
    @classmethod
    def validate_nom_prenom(cls, v: str) -> str:
        """Valide que le nom/prénom n'est pas vide et a une longueur correcte."""
        v = v.strip()
        if len(v) < 1:
            raise ValueError("Le champ ne peut pas être vide")
        if len(v) > 100:
            raise ValueError("Le champ ne peut pas dépasser 100 caractères")
        return v

    @field_validator("candidat_sexe")
    @classmethod
    def validate_sexe(cls, v: str) -> str:
        """Valide le sexe (M ou F)."""
        if not re.match(r"^[MF]$", v.upper()):
            raise ValueError("Le sexe doit être 'M' ou 'F'")
        return v.upper()

    @field_validator("moyenne_generale")
    @classmethod
    def validate_moyenne(cls, v: Optional[float]) -> Optional[float]:
        """Valide que la moyenne est entre 0 et 20."""
        if v is not None and (v < 0 or v > 20):
            raise ValueError("La moyenne doit être entre 0 et 20")
        return v

    @field_validator("annee_obtention_diplome")
    @classmethod
    def validate_annee_diplome(cls, v: Optional[int]) -> Optional[int]:
        """Valide l'année d'obtention du diplôme."""
        if v is not None:
            current_year = datetime.now().year
            if v < 1950 or v > current_year:
                raise ValueError(f"L'année doit être entre 1950 et {current_year}")
        return v


class DossierCandidatureCreate(DossierCandidatureBase):
    """Schéma pour la création d'un dossier de candidature."""
    pass


class DossierCandidatureUpdate(BaseModel):
    """Schéma pour la mise à jour d'un dossier de candidature."""
    
    candidat_nom: Optional[str] = None
    candidat_prenom: Optional[str] = None
    candidat_email: Optional[EmailStr] = None
    candidat_telephone: Optional[str] = None
    candidat_date_naissance: Optional[date] = None
    candidat_lieu_naissance: Optional[str] = None
    candidat_sexe: Optional[str] = None
    candidat_nationalite: Optional[str] = None
    candidat_adresse: Optional[str] = None
    filiere_souhaitee_1: Optional[int] = None
    filiere_souhaitee_2: Optional[int] = None
    filiere_souhaitee_3: Optional[int] = None
    diplome_precedent: Optional[str] = None
    etablissement_precedent: Optional[str] = None
    annee_obtention_diplome: Optional[int] = None
    moyenne_generale: Optional[float] = None
    statut_dossier: Optional[str] = None
    commentaire_validation: Optional[str] = None
    filiere_admise: Optional[int] = None

    @field_validator("statut_dossier")
    @classmethod
    def validate_statut(cls, v: Optional[str]) -> Optional[str]:
        """Valide le statut si fourni."""
        if v is not None and v not in STATUTS_DOSSIER:
            raise ValueError(f"Le statut doit être parmi: {', '.join(STATUTS_DOSSIER)}")
        return v


class DossierCandidatureInDB(DossierCandidatureBase):
    """Schéma pour un dossier de candidature en base de données."""
    
    id: int
    numero_dossier: str
    etudiant_id: Optional[int] = None
    statut_dossier: str
    date_soumission: Optional[datetime] = None
    date_validation: Optional[datetime] = None
    commentaire_validation: Optional[str] = None
    filiere_admise: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DossierCandidature(DossierCandidatureInDB):
    """Schéma complet pour un dossier de candidature."""
    pass


class DossierCandidatureWithDetails(DossierCandidature):
    """Schéma avec détails des pièces jointes et paiements."""
    
    is_complet: bool = False
    pieces_jointes_count: int = 0
    paiements_valides: float = 0.0
