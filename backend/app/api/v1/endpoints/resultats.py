"""
Endpoints API pour la gestion des résultats
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user
from app.core.permissions import get_current_scolarite_user
from app.models.user import User
from app.repositories import (
    resultat_matiere_repository,
    resultat_semestre_repository,
    resultat_annuel_repository,
    etudiant_repository,
)

router = APIRouter(prefix="/resultats", tags=["Résultats"])


# Schémas de requête
class CalculerMatiereRequest(BaseModel):
    session_id: int


class CalculerSemestreRequest(BaseModel):
    session_id: int
    semestre: int


class CalculerNiveauRequest(BaseModel):
    niveau_id: int
    annee_id: int


# ============ Résultats Matières ============

@router.get("/matieres/etudiant/{etudiant_id}", summary="Résultats matières d'un étudiant")
async def get_resultats_matieres_etudiant(
    etudiant_id: int,
    session_id: Optional[int] = Query(None, description="Filtrer par session"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère les résultats par matière d'un étudiant.
    """
    etudiant = etudiant_repository.get_by_id(db, etudiant_id)
    if not etudiant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Étudiant non trouvé"
        )
    
    return resultat_matiere_repository.get_by_etudiant(db, etudiant_id, session_id=session_id)


@router.get("/matieres/session/{session_id}", summary="Résultats matières d'une session")
async def get_resultats_matieres_session(
    session_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(1000, ge=1, le=5000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère tous les résultats matières d'une session.
    """
    return resultat_matiere_repository.get_by_session(db, session_id, skip=skip, limit=limit)


# ============ Résultats Semestres ============

@router.get("/semestres/etudiant/{etudiant_id}", summary="Résultats semestriels d'un étudiant")
async def get_resultats_semestres_etudiant(
    etudiant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère les résultats semestriels d'un étudiant.
    """
    etudiant = etudiant_repository.get_by_id(db, etudiant_id)
    if not etudiant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Étudiant non trouvé"
        )
    
    return resultat_semestre_repository.get_by_etudiant(db, etudiant_id)


@router.get("/semestres/classement", summary="Classement semestriel")
async def get_classement_semestre(
    niveau_id: int = Query(..., description="ID du niveau"),
    filiere_id: int = Query(..., description="ID de la filière"),
    session_id: int = Query(..., description="ID de la session"),
    semestre: int = Query(..., ge=1, le=2, description="Numéro du semestre"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère le classement des étudiants pour un semestre.
    """
    resultats = resultat_semestre_repository.get_classement(
        db, niveau_id, filiere_id, session_id, semestre
    )
    
    # Formater avec rang
    classement = []
    for rang, resultat in enumerate(resultats, 1):
        classement.append({
            "rang": rang,
            "etudiant_id": resultat.etudiant_id,
            "inscription_id": resultat.inscription_id,
            "moyenne_generale": resultat.moyenne_generale,
            "total_credits_obtenus": resultat.total_credits_obtenus,
            "total_credits_inscrits": resultat.total_credits_inscrits,
            "mention": resultat.mention,
            "decision": resultat.decision,
        })
    
    return {
        "classement": classement,
        "effectif": len(classement)
    }


# ============ Résultats Annuels ============

@router.get("/annuels/etudiant/{etudiant_id}", summary="Résultats annuels d'un étudiant")
async def get_resultats_annuels_etudiant(
    etudiant_id: int,
    annee_id: Optional[int] = Query(None, description="Filtrer par année académique"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère les résultats annuels d'un étudiant.
    """
    etudiant = etudiant_repository.get_by_id(db, etudiant_id)
    if not etudiant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Étudiant non trouvé"
        )
    
    return resultat_annuel_repository.get_by_etudiant(db, etudiant_id, annee_id=annee_id)


@router.get("/annuels/classement", summary="Classement annuel")
async def get_classement_annuel(
    niveau_id: int = Query(..., description="ID du niveau"),
    filiere_id: int = Query(..., description="ID de la filière"),
    annee_id: int = Query(..., description="ID de l'année académique"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère le classement annuel des étudiants.
    """
    resultats = resultat_annuel_repository.get_classement_annuel(
        db, niveau_id, filiere_id, annee_id
    )
    
    # Formater avec rang
    classement = []
    for rang, resultat in enumerate(resultats, 1):
        classement.append({
            "rang": rang,
            "etudiant_id": resultat.etudiant_id,
            "inscription_id": resultat.inscription_id,
            "moyenne_annuelle": resultat.moyenne_annuelle,
            "moyenne_semestre1": resultat.moyenne_semestre1,
            "moyenne_semestre2": resultat.moyenne_semestre2,
            "total_credits_obtenus": resultat.total_credits_obtenus,
            "total_credits_inscrits": resultat.total_credits_inscrits,
            "mention": resultat.mention,
            "decision": resultat.decision,
            "passage_niveau_superieur": resultat.passage_niveau_superieur,
        })
    
    return {
        "classement": classement,
        "effectif": len(classement)
    }


# ============ Calcul des résultats ============

@router.post("/calculer/matiere/{inscription_matiere_id}", summary="Calculer résultat matière")
async def calculer_resultat_matiere(
    inscription_matiere_id: int,
    request: CalculerMatiereRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """
    Calcule le résultat d'une matière pour un étudiant.
    
    Requiert les droits admin ou scolarité.
    """
    try:
        resultat = resultat_matiere_repository.calculer_resultat_matiere(
            db, inscription_matiere_id, request.session_id
        )
        return {
            "message": "Résultat matière calculé avec succès",
            "resultat": {
                "id": resultat.id,
                "moyenne_matiere": resultat.moyenne_matiere,
                "credit_obtenu": resultat.credit_obtenu,
                "statut": resultat.statut,
                "decision": resultat.decision,
            }
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.post("/calculer/session/{session_id}", summary="Calculer résultats session")
async def calculer_resultats_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """
    Calcule tous les résultats matières d'une session.
    
    Requiert les droits admin ou scolarité.
    """
    count = resultat_matiere_repository.calculer_resultats_session(db, session_id)
    
    return {
        "message": f"{count} résultats matières calculés avec succès",
        "count": count
    }


@router.post("/calculer/semestre", summary="Calculer résultats semestriels")
async def calculer_resultats_semestre(
    request: CalculerSemestreRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """
    Calcule les résultats semestriels pour tous les étudiants.
    
    Requiert les droits admin ou scolarité.
    """
    count = resultat_semestre_repository.calculer_resultats_session_semestre(
        db, request.session_id, request.semestre
    )
    
    return {
        "message": f"{count} résultats semestriels calculés avec succès",
        "count": count
    }


@router.post("/calculer/annuel/{inscription_id}", summary="Calculer résultat annuel")
async def calculer_resultat_annuel(
    inscription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """
    Calcule le résultat annuel d'un étudiant.
    
    Requiert les droits admin ou scolarité.
    """
    try:
        resultat = resultat_annuel_repository.calculer_resultat_annuel(db, inscription_id)
        return {
            "message": "Résultat annuel calculé avec succès",
            "resultat": {
                "id": resultat.id,
                "moyenne_annuelle": resultat.moyenne_annuelle,
                "moyenne_semestre1": resultat.moyenne_semestre1,
                "moyenne_semestre2": resultat.moyenne_semestre2,
                "total_credits_obtenus": resultat.total_credits_obtenus,
                "mention": resultat.mention,
                "decision": resultat.decision,
                "passage_niveau_superieur": resultat.passage_niveau_superieur,
            }
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.post("/calculer/niveau", summary="Calculer résultats niveau")
async def calculer_resultats_niveau(
    request: CalculerNiveauRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """
    Calcule les résultats annuels pour tous les étudiants d'un niveau.
    
    Requiert les droits admin ou scolarité.
    """
    count = resultat_annuel_repository.calculer_resultats_niveau(
        db, request.niveau_id, request.annee_id
    )
    
    return {
        "message": f"{count} résultats annuels calculés avec succès",
        "count": count
    }


@router.post("/calculer/rangs/semestre", summary="Calculer rangs semestriels")
async def calculer_rangs_semestre(
    niveau_id: int = Query(..., description="ID du niveau"),
    filiere_id: int = Query(..., description="ID de la filière"),
    session_id: int = Query(..., description="ID de la session"),
    semestre: int = Query(..., ge=1, le=2, description="Numéro du semestre"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """
    Calcule et enregistre les rangs pour un semestre.
    
    Requiert les droits admin ou scolarité.
    """
    effectif = resultat_semestre_repository.calculer_rangs(
        db, niveau_id, filiere_id, session_id, semestre
    )
    
    return {
        "message": f"Rangs calculés pour {effectif} étudiants",
        "effectif": effectif
    }


@router.post("/calculer/rangs/annuel", summary="Calculer rangs annuels")
async def calculer_rangs_annuel(
    niveau_id: int = Query(..., description="ID du niveau"),
    filiere_id: int = Query(..., description="ID de la filière"),
    annee_id: int = Query(..., description="ID de l'année académique"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """
    Calcule et enregistre les rangs annuels.
    
    Requiert les droits admin ou scolarité.
    """
    effectif = resultat_annuel_repository.calculer_rangs_annuels(
        db, niveau_id, filiere_id, annee_id
    )
    
    return {
        "message": f"Rangs calculés pour {effectif} étudiants",
        "effectif": effectif
    }
