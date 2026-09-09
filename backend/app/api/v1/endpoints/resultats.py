"""
Endpoints API pour la gestion des résultats
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user
from app.core.permissions import is_scolarite_portal_user
from app.utils.rbac_resolver import require_permission
from app.core.portal_access import assert_etudiant_owner, resolve_etudiant_id, TEACHER_ROLES
from app.models.user import User
from app.utils.administration_events import audit_calculate
from app.utils.teacher_notes_access import assert_teacher_can_saisie_matiere_niveau
from app.repositories import (
    resultat_matiere_repository,
    resultat_semestre_repository,
    resultat_annuel_repository,
    etudiant_repository,
)

router = APIRouter(prefix="/resultats", tags=["Résultats"])


def _assert_scolarite_or_deny_teacher_classement(current_user: User) -> None:
    """Classements et listes globales réservés à la scolarité."""
    if is_scolarite_portal_user(current_user):
        return
    if getattr(current_user, "role", None) in TEACHER_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Consultation réservée à la scolarité",
        )


def _serialize_resultats_matieres_enseignement(resultats) -> list[dict]:
    rows = []
    for r in resultats:
        etu = r.etudiant
        rows.append(
            {
                "id": r.id,
                "etudiant_id": r.etudiant_id,
                "matricule": etu.matricule if etu else None,
                "nom": etu.nom if etu else None,
                "prenom": etu.prenom if etu else None,
                "matiere_id": r.matiere_id,
                "session_id": r.session_id,
                "note_cc": r.note_cc,
                "note_tp": r.note_tp,
                "note_examen": r.note_examen,
                "moyenne_matiere": r.moyenne_matiere,
                "credit_matiere": r.credit_matiere,
                "credit_obtenu": r.credit_obtenu,
                "statut": r.statut,
                "decision": r.decision,
                "is_valide": r.is_valide,
            }
        )
    return rows


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

@router.get("/mes-resultats", summary="Mes résultats (portail étudiant)")
async def get_mes_resultats(
    session_id: Optional[int] = Query(None, description="Filtrer matières par session"),
    annee_id: Optional[int] = Query(None, description="Filtrer annuels par année"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Résultats semestriels, matières et annuels de l'étudiant connecté."""
    etudiant_id = resolve_etudiant_id(db, current_user)
    return {
        "etudiant_id": etudiant_id,
        "semestres": resultat_semestre_repository.get_by_etudiant(db, etudiant_id),
        "matieres": resultat_matiere_repository.get_by_etudiant(
            db, etudiant_id, session_id=session_id
        ),
        "annuels": resultat_annuel_repository.get_by_etudiant(
            db, etudiant_id, annee_id=annee_id
        ),
    }


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

    assert_etudiant_owner(current_user, etudiant_id, db)
    
    return resultat_matiere_repository.get_by_etudiant(db, etudiant_id, session_id=session_id)


@router.get(
    "/mes-matieres-enseignement",
    summary="Résultats matières enseignées (portail enseignant, lecture seule)",
)
async def get_mes_resultats_matieres_enseignement(
    session_id: int = Query(..., description="Session d'examen"),
    matiere_id: int = Query(..., description="Matière enseignée"),
    niveau_id: int = Query(..., description="Niveau"),
    skip: int = Query(0, ge=0),
    limit: int = Query(1000, ge=1, le=5000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Résultats nominatifs par étudiant pour une matière/niveau enseignés.

    Lecture seule - aucun recalcul ; consomme les résultats déjà calculés en base.
    """
    role = getattr(current_user, "role", None)
    if role not in TEACHER_ROLES and not is_scolarite_portal_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Réservé aux enseignants ou à la scolarité",
        )
    assert_teacher_can_saisie_matiere_niveau(db, current_user, matiere_id, niveau_id)

    resultats = resultat_matiere_repository.get_by_session_matiere_niveau(
        db, session_id, matiere_id, niveau_id, skip=skip, limit=limit
    )
    rows = _serialize_resultats_matieres_enseignement(resultats)
    valides = [r for r in rows if r.get("statut") == "valide"]
    moyennes = [r["moyenne_matiere"] for r in rows if r.get("moyenne_matiere") is not None]
    return {
        "session_id": session_id,
        "matiere_id": matiere_id,
        "niveau_id": niveau_id,
        "effectif": len(rows),
        "nb_valides": len(valides),
        "taux_reussite": round(len(valides) / len(rows) * 100, 1) if rows else 0.0,
        "moyenne_classe": round(sum(moyennes) / len(moyennes), 2) if moyennes else None,
        "resultats": rows,
    }


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
    _assert_scolarite_or_deny_teacher_classement(current_user)
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

    assert_etudiant_owner(current_user, etudiant_id, db)
    
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
    _assert_scolarite_or_deny_teacher_classement(current_user)
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

    assert_etudiant_owner(current_user, etudiant_id, db)
    
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
    _assert_scolarite_or_deny_teacher_classement(current_user)
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
    body: CalculerMatiereRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("evaluations_resultats", "calculate")),
):
    """
    Calcule le résultat d'une matière pour un étudiant.
    
    Requiert les droits admin ou scolarité.
    """
    try:
        resultat = resultat_matiere_repository.calculer_resultat_matiere(
            db, inscription_matiere_id, body.session_id
        )
        payload = {
            "id": resultat.id,
            "moyenne_matiere": resultat.moyenne_matiere,
            "credit_obtenu": resultat.credit_obtenu,
            "statut": resultat.statut,
            "decision": resultat.decision,
        }
        audit_calculate(
            db,
            request=request,
            user=current_user,
            scope="matiere",
            entity_id=inscription_matiere_id,
            payload=payload,
        )
        return {
            "message": "Résultat matière calculé avec succès",
            "resultat": payload,
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.post("/calculer/session/{session_id}", summary="Calculer résultats session")
async def calculer_resultats_session(
    session_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("evaluations_resultats", "calculate")),
):
    """
    Calcule tous les résultats matières d'une session.
    
    Requiert les droits admin ou scolarité.
    """
    count = resultat_matiere_repository.calculer_resultats_session(db, session_id)
    audit_calculate(
        db,
        request=request,
        user=current_user,
        scope="session",
        entity_id=session_id,
        payload={"count": count},
    )

    return {
        "message": f"{count} résultats matières calculés avec succès",
        "count": count
    }


@router.post("/calculer/semestre", summary="Calculer résultats semestriels")
async def calculer_resultats_semestre(
    body: CalculerSemestreRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("evaluations_resultats", "calculate")),
):
    """
    Calcule les résultats semestriels pour tous les étudiants.
    
    Requiert les droits admin ou scolarité.
    """
    count = resultat_semestre_repository.calculer_resultats_session_semestre(
        db, body.session_id, body.semestre
    )
    audit_calculate(
        db,
        request=request,
        user=current_user,
        scope="semestre",
        entity_id=f"{body.session_id}-{body.semestre}",
        payload={"count": count},
    )

    return {
        "message": f"{count} résultats semestriels calculés avec succès",
        "count": count
    }


@router.post("/calculer/annuel/{inscription_id}", summary="Calculer résultat annuel")
async def calculer_resultat_annuel(
    inscription_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("evaluations_resultats", "calculate")),
):
    """
    Calcule le résultat annuel d'un étudiant.
    
    Requiert les droits admin ou scolarité.
    """
    try:
        resultat = resultat_annuel_repository.calculer_resultat_annuel(db, inscription_id)
        payload = {
            "id": resultat.id,
            "moyenne_annuelle": resultat.moyenne_annuelle,
            "moyenne_semestre1": resultat.moyenne_semestre1,
            "moyenne_semestre2": resultat.moyenne_semestre2,
            "total_credits_obtenus": resultat.total_credits_obtenus,
            "mention": resultat.mention,
            "decision": resultat.decision,
            "passage_niveau_superieur": resultat.passage_niveau_superieur,
        }
        audit_calculate(
            db,
            request=request,
            user=current_user,
            scope="annuel",
            entity_id=inscription_id,
            payload=payload,
        )
        return {
            "message": "Résultat annuel calculé avec succès",
            "resultat": payload,
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.post("/calculer/niveau", summary="Calculer résultats niveau")
async def calculer_resultats_niveau(
    body: CalculerNiveauRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("evaluations_resultats", "calculate")),
):
    """
    Calcule les résultats annuels pour tous les étudiants d'un niveau.
    
    Requiert les droits admin ou scolarité.
    """
    count = resultat_annuel_repository.calculer_resultats_niveau(
        db, body.niveau_id, body.annee_id
    )
    audit_calculate(
        db,
        request=request,
        user=current_user,
        scope="niveau",
        entity_id=f"{body.niveau_id}-{body.annee_id}",
        payload={"count": count},
    )

    return {
        "message": f"{count} résultats annuels calculés avec succès",
        "count": count
    }


@router.post("/calculer/rangs/semestre", summary="Calculer rangs semestriels")
async def calculer_rangs_semestre(
    request: Request,
    niveau_id: int = Query(..., description="ID du niveau"),
    filiere_id: int = Query(..., description="ID de la filière"),
    session_id: int = Query(..., description="ID de la session"),
    semestre: int = Query(..., ge=1, le=2, description="Numéro du semestre"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("evaluations_resultats", "calculate")),
):
    """
    Calcule et enregistre les rangs pour un semestre.
    
    Requiert les droits admin ou scolarité.
    """
    effectif = resultat_semestre_repository.calculer_rangs(
        db, niveau_id, filiere_id, session_id, semestre
    )
    audit_calculate(
        db,
        request=request,
        user=current_user,
        scope="rangs_semestre",
        entity_id=f"{session_id}-{semestre}",
        payload={"effectif": effectif},
    )

    return {
        "message": f"Rangs calculés pour {effectif} étudiants",
        "effectif": effectif
    }


@router.post("/calculer/rangs/annuel", summary="Calculer rangs annuels")
async def calculer_rangs_annuel(
    request: Request,
    niveau_id: int = Query(..., description="ID du niveau"),
    filiere_id: int = Query(..., description="ID de la filière"),
    annee_id: int = Query(..., description="ID de l'année académique"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("evaluations_resultats", "calculate")),
):
    """
    Calcule et enregistre les rangs annuels.
    
    Requiert les droits admin ou scolarité.
    """
    effectif = resultat_annuel_repository.calculer_rangs_annuels(
        db, niveau_id, filiere_id, annee_id
    )
    audit_calculate(
        db,
        request=request,
        user=current_user,
        scope="rangs_annuel",
        entity_id=f"{niveau_id}-{annee_id}",
        payload={"effectif": effectif},
    )

    return {
        "message": f"Rangs calculés pour {effectif} étudiants",
        "effectif": effectif
    }
