"""
Schémas Pydantic pour les résultats (matière, semestre, annuel).
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# ============== Résultat Matière ==============

class ResultatMatiereBase(BaseModel):
    """Schéma de base pour un résultat de matière."""
    inscription_matiere_id: int
    etudiant_id: int
    matiere_id: int
    session_id: int
    note_cc: Optional[float] = Field(None, ge=0, le=20)
    note_tp: Optional[float] = Field(None, ge=0, le=20)
    note_examen: Optional[float] = Field(None, ge=0, le=20)
    moyenne_matiere: Optional[float] = Field(None, ge=0, le=20)
    credit_matiere: float = Field(..., ge=0)
    credit_obtenu: float = Field(default=0.0, ge=0)
    statut: str = Field(
        default="en_cours",
        pattern="^(en_cours|valide|ajourne|dispense)$"
    )
    decision: Optional[str] = Field(
        None,
        pattern="^(admis|ajourne|rattrapage)$"
    )
    session_obtention: Optional[str] = Field(
        None,
        pattern="^(normale|rattrapage)$"
    )
    observation: Optional[str] = None


class ResultatMatiereCreate(ResultatMatiereBase):
    """Schéma pour la création d'un résultat de matière."""
    pass


class ResultatMatiereUpdate(BaseModel):
    """Schéma pour la mise à jour d'un résultat de matière."""
    note_cc: Optional[float] = Field(None, ge=0, le=20)
    note_tp: Optional[float] = Field(None, ge=0, le=20)
    note_examen: Optional[float] = Field(None, ge=0, le=20)
    moyenne_matiere: Optional[float] = Field(None, ge=0, le=20)
    credit_obtenu: Optional[float] = Field(None, ge=0)
    statut: Optional[str] = Field(
        None,
        pattern="^(en_cours|valide|ajourne|dispense)$"
    )
    decision: Optional[str] = Field(
        None,
        pattern="^(admis|ajourne|rattrapage)$"
    )
    session_obtention: Optional[str] = Field(
        None,
        pattern="^(normale|rattrapage)$"
    )
    observation: Optional[str] = None
    is_valide: Optional[bool] = None


class ResultatMatiereInDB(ResultatMatiereBase):
    """Schéma pour un résultat de matière en base de données."""
    id: int
    is_valide: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ResultatMatiere(ResultatMatiereInDB):
    """Schéma complet pour un résultat de matière."""
    pass


class ResultatMatiereWithDetails(ResultatMatiere):
    """Schéma avec détails."""
    matiere_libelle: Optional[str] = None
    matiere_code: Optional[str] = None
    etudiant_matricule: Optional[str] = None
    etudiant_nom: Optional[str] = None
    etudiant_prenom: Optional[str] = None


# ============== Résultat Semestre ==============

class ResultatSemestreBase(BaseModel):
    """Schéma de base pour un résultat semestriel."""
    inscription_id: int
    etudiant_id: int
    session_id: int
    semestre: int = Field(..., ge=1, le=2)
    moyenne_generale: Optional[float] = Field(None, ge=0, le=20)
    total_credits_inscrits: float = Field(default=0.0, ge=0)
    total_credits_obtenus: float = Field(default=0.0, ge=0)
    total_credits_capitalises: float = Field(default=0.0, ge=0)
    nombre_matieres: int = Field(default=0, ge=0)
    nombre_matieres_validees: int = Field(default=0, ge=0)
    statut: str = Field(
        default="en_cours",
        pattern="^(en_cours|valide|ajourne)$"
    )
    decision: Optional[str] = Field(
        None,
        pattern="^(admis|admis_avec_dette|ajourne|redouble)$"
    )
    mention: Optional[str] = Field(
        None,
        pattern="^(passable|assez_bien|bien|tres_bien|excellent)$"
    )
    rang: Optional[int] = Field(None, ge=1)
    effectif: Optional[int] = Field(None, ge=0)


class ResultatSemestreCreate(ResultatSemestreBase):
    """Schéma pour la création d'un résultat semestriel."""
    pass


class ResultatSemestreUpdate(BaseModel):
    """Schéma pour la mise à jour d'un résultat semestriel."""
    moyenne_generale: Optional[float] = Field(None, ge=0, le=20)
    total_credits_obtenus: Optional[float] = Field(None, ge=0)
    total_credits_capitalises: Optional[float] = Field(None, ge=0)
    nombre_matieres_validees: Optional[int] = Field(None, ge=0)
    statut: Optional[str] = Field(
        None,
        pattern="^(en_cours|valide|ajourne)$"
    )
    decision: Optional[str] = Field(
        None,
        pattern="^(admis|admis_avec_dette|ajourne|redouble)$"
    )
    mention: Optional[str] = Field(
        None,
        pattern="^(passable|assez_bien|bien|tres_bien|excellent)$"
    )
    rang: Optional[int] = Field(None, ge=1)
    effectif: Optional[int] = Field(None, ge=0)
    is_valide: Optional[bool] = None
    date_deliberation: Optional[datetime] = None


class ResultatSemestreInDB(ResultatSemestreBase):
    """Schéma pour un résultat semestriel en base de données."""
    id: int
    is_valide: bool
    date_deliberation: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ResultatSemestre(ResultatSemestreInDB):
    """Schéma complet pour un résultat semestriel."""
    pass


class ResultatSemestreWithDetails(ResultatSemestre):
    """Schéma avec détails."""
    etudiant_matricule: Optional[str] = None
    etudiant_nom: Optional[str] = None
    etudiant_prenom: Optional[str] = None
    niveau_libelle: Optional[str] = None
    filiere_libelle: Optional[str] = None


# ============== Résultat Annuel ==============

class ResultatAnnuelBase(BaseModel):
    """Schéma de base pour un résultat annuel."""
    inscription_id: int
    etudiant_id: int
    annee_academique_id: int
    niveau_id: int
    moyenne_annuelle: Optional[float] = Field(None, ge=0, le=20)
    moyenne_semestre1: Optional[float] = Field(None, ge=0, le=20)
    moyenne_semestre2: Optional[float] = Field(None, ge=0, le=20)
    total_credits_inscrits: float = Field(default=0.0, ge=0)
    total_credits_obtenus: float = Field(default=0.0, ge=0)
    total_credits_capitalises: float = Field(default=0.0, ge=0)
    statut: str = Field(
        default="en_cours",
        pattern="^(en_cours|valide|ajourne)$"
    )
    decision: Optional[str] = Field(
        None,
        pattern="^(admis|admis_avec_dette|redouble|exclus)$"
    )
    mention: Optional[str] = Field(
        None,
        pattern="^(passable|assez_bien|bien|tres_bien|excellent)$"
    )
    rang: Optional[int] = Field(None, ge=1)
    effectif: Optional[int] = Field(None, ge=0)
    passage_niveau_superieur: bool = False


class ResultatAnnuelCreate(ResultatAnnuelBase):
    """Schéma pour la création d'un résultat annuel."""
    pass


class ResultatAnnuelUpdate(BaseModel):
    """Schéma pour la mise à jour d'un résultat annuel."""
    moyenne_annuelle: Optional[float] = Field(None, ge=0, le=20)
    moyenne_semestre1: Optional[float] = Field(None, ge=0, le=20)
    moyenne_semestre2: Optional[float] = Field(None, ge=0, le=20)
    total_credits_obtenus: Optional[float] = Field(None, ge=0)
    total_credits_capitalises: Optional[float] = Field(None, ge=0)
    statut: Optional[str] = Field(
        None,
        pattern="^(en_cours|valide|ajourne)$"
    )
    decision: Optional[str] = Field(
        None,
        pattern="^(admis|admis_avec_dette|redouble|exclus)$"
    )
    mention: Optional[str] = Field(
        None,
        pattern="^(passable|assez_bien|bien|tres_bien|excellent)$"
    )
    rang: Optional[int] = Field(None, ge=1)
    effectif: Optional[int] = Field(None, ge=0)
    passage_niveau_superieur: Optional[bool] = None
    is_valide: Optional[bool] = None
    date_deliberation: Optional[datetime] = None


class ResultatAnnuelInDB(ResultatAnnuelBase):
    """Schéma pour un résultat annuel en base de données."""
    id: int
    is_valide: bool
    date_deliberation: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ResultatAnnuel(ResultatAnnuelInDB):
    """Schéma complet pour un résultat annuel."""
    pass


class ResultatAnnuelWithDetails(ResultatAnnuel):
    """Schéma avec détails."""
    etudiant_matricule: Optional[str] = None
    etudiant_nom: Optional[str] = None
    etudiant_prenom: Optional[str] = None
    niveau_libelle: Optional[str] = None
    filiere_libelle: Optional[str] = None
    annee_academique_code: Optional[str] = None
