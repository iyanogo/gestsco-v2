"""
Endpoints API pour la gestion des sessions d'examen
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user
from app.utils.rbac_resolver import require_permission
from app.models.user import User
from app.repositories import session_examen_repository
from app.schemas.session_examen import (
    SessionExamen,
    SessionExamenCreate,
    SessionExamenUpdate,
)
from app.utils.administration_events import audit_and_commit
from app.utils.audit_snapshots import fields_snapshot

router = APIRouter(prefix="/sessions-examen", tags=["Sessions d'Examen"])

_SESSION_EXAMEN_FIELDS = (
    "code",
    "libelle",
    "annee_academique_id",
    "type_session",
    "semestre",
    "statut",
    "is_active",
)


@router.get("/", response_model=list[SessionExamen], summary="Liste des sessions d'examen")
async def list_sessions_examen(
    skip: int = Query(0, ge=0, description="Nombre d'éléments à ignorer"),
    limit: int = Query(100, ge=1, le=500, description="Nombre maximum d'éléments"),
    annee_id: Optional[int] = Query(None, description="Filtrer par année académique"),
    semestre: Optional[int] = Query(None, ge=1, le=2, description="Filtrer par semestre"),
    statut: Optional[str] = Query(None, description="Filtrer par statut"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère la liste des sessions d'examen avec pagination et filtres.
    
    - **annee_id**: Filtrer par ID d'année académique
    - **semestre**: Filtrer par semestre (1 ou 2)
    - **statut**: Filtrer par statut (planifiee, en_cours, cloturee, validee)
    """
    if annee_id and semestre:
        return session_examen_repository.get_by_semestre(db, annee_id, semestre)
    
    if annee_id:
        return session_examen_repository.get_by_annee(db, annee_id, skip=skip, limit=limit)
    
    if statut:
        return session_examen_repository.get_by_statut(db, statut, skip=skip, limit=limit)
    
    return session_examen_repository.get_all(db, skip=skip, limit=limit)


@router.get("/active", response_model=SessionExamen, summary="Session active")
async def get_session_active(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère la session d'examen actuellement active.
    """
    session = session_examen_repository.get_active(db)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucune session active trouvée"
        )
    return session


@router.get("/en-cours", response_model=list[SessionExamen], summary="Sessions en cours")
async def get_sessions_en_cours(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère les sessions d'examen en cours.
    """
    return session_examen_repository.get_en_cours(db)


@router.get("/{session_id}", response_model=SessionExamen, summary="Détails d'une session")
async def get_session_examen(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère une session d'examen par son ID.
    """
    session = session_examen_repository.get_by_id(db, session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session d'examen non trouvée"
        )
    return session


@router.post("/", response_model=SessionExamen, status_code=status.HTTP_201_CREATED, summary="Créer une session")
async def create_session_examen(
    session_in: SessionExamenCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("evaluations_notes", "create")),
):
    """
    Crée une nouvelle session d'examen.
    
    Requiert les droits admin ou scolarité.
    """
    # Vérifier si le code existe déjà
    if session_examen_repository.code_exists(db, session_in.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Une session avec ce code existe déjà"
        )
    
    session = session_examen_repository.create(db, session_in)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="create",
        entity_type="session_examen",
        entity_id=session.id,
        new_values=fields_snapshot(session, *_SESSION_EXAMEN_FIELDS),
    )
    return session


@router.put("/{session_id}", response_model=SessionExamen, summary="Modifier une session")
async def update_session_examen(
    session_id: int,
    session_in: SessionExamenUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("evaluations_notes", "update")),
):
    """
    Met à jour une session d'examen existante.
    
    Requiert les droits admin ou scolarité.
    """
    session = session_examen_repository.get_by_id(db, session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session d'examen non trouvée"
        )
    
    # Vérifier unicité du code si modifié
    if session_in.code and session_examen_repository.code_exists(db, session_in.code, exclude_id=session_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Une session avec ce code existe déjà"
        )
    
    old_snapshot = fields_snapshot(session, *_SESSION_EXAMEN_FIELDS)
    updated = session_examen_repository.update(db, session_id, session_in)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="update",
        entity_type="session_examen",
        entity_id=session_id,
        old_values=old_snapshot,
        new_values=fields_snapshot(updated, *_SESSION_EXAMEN_FIELDS),
    )
    return updated


@router.patch("/{session_id}/ouvrir", response_model=SessionExamen, summary="Ouvrir une session")
async def ouvrir_session_examen(
    session_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("evaluations_notes", "update")),
):
    """
    Ouvre une session d'examen (statut = en_cours).
    
    Requiert les droits admin ou scolarité.
    """
    existing = session_examen_repository.get_by_id(db, session_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session d'examen non trouvée"
        )
    old_snapshot = fields_snapshot(existing, *_SESSION_EXAMEN_FIELDS)
    session = session_examen_repository.ouvrir_session(db, session_id)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="update",
        entity_type="session_examen",
        entity_id=session_id,
        old_values=old_snapshot,
        new_values=fields_snapshot(session, *_SESSION_EXAMEN_FIELDS),
        details="ouvrir",
    )
    return session


@router.patch("/{session_id}/cloturer", response_model=SessionExamen, summary="Clôturer une session")
async def cloturer_session_examen(
    session_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("evaluations_notes", "update")),
):
    """
    Clôture une session d'examen (statut = cloturee).
    
    Requiert les droits admin ou scolarité.
    """
    existing = session_examen_repository.get_by_id(db, session_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session d'examen non trouvée"
        )
    old_snapshot = fields_snapshot(existing, *_SESSION_EXAMEN_FIELDS)
    session = session_examen_repository.cloturer_session(db, session_id)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="update",
        entity_type="session_examen",
        entity_id=session_id,
        old_values=old_snapshot,
        new_values=fields_snapshot(session, *_SESSION_EXAMEN_FIELDS),
        details="cloturer",
    )
    return session


@router.patch("/{session_id}/valider", response_model=SessionExamen, summary="Valider une session")
async def valider_session_examen(
    session_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("evaluations_notes", "validate")),
):
    """
    Valide une session d'examen (statut = validee).
    
    Requiert les droits superuser.
    """
    existing = session_examen_repository.get_by_id(db, session_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session d'examen non trouvée"
        )
    old_snapshot = fields_snapshot(existing, *_SESSION_EXAMEN_FIELDS)
    session = session_examen_repository.valider_session(db, session_id)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="validate",
        entity_type="session_examen",
        entity_id=session_id,
        old_values=old_snapshot,
        new_values=fields_snapshot(session, *_SESSION_EXAMEN_FIELDS),
    )
    return session


@router.delete("/{session_id}", summary="Supprimer une session")
async def delete_session_examen(
    session_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("evaluations_notes", "delete")),
):
    """
    Supprime une session d'examen.
    
    Requiert les droits superuser.
    """
    existing = session_examen_repository.get_by_id(db, session_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session d'examen non trouvée"
        )
    old_snapshot = fields_snapshot(existing, *_SESSION_EXAMEN_FIELDS)
    success = session_examen_repository.delete(db, session_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session d'examen non trouvée"
        )
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="delete",
        entity_type="session_examen",
        entity_id=session_id,
        old_values=old_snapshot,
    )
    return {"message": "Session d'examen supprimée avec succès"}
