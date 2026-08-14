"""
Endpoints API pour la gestion des sessions d'examen
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user
from app.core.permissions import get_current_scolarite_user, get_current_superuser
from app.models.user import User
from app.repositories import session_examen_repository
from app.schemas.session_examen import (
    SessionExamen,
    SessionExamenCreate,
    SessionExamenUpdate,
)

router = APIRouter(prefix="/sessions-examen", tags=["Sessions d'Examen"])


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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
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
    
    return session_examen_repository.create(db, session_in)


@router.put("/{session_id}", response_model=SessionExamen, summary="Modifier une session")
async def update_session_examen(
    session_id: int,
    session_in: SessionExamenUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
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
    
    return session_examen_repository.update(db, session_id, session_in)


@router.patch("/{session_id}/ouvrir", response_model=SessionExamen, summary="Ouvrir une session")
async def ouvrir_session_examen(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """
    Ouvre une session d'examen (statut = en_cours).
    
    Requiert les droits admin ou scolarité.
    """
    session = session_examen_repository.ouvrir_session(db, session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session d'examen non trouvée"
        )
    return session


@router.patch("/{session_id}/cloturer", response_model=SessionExamen, summary="Clôturer une session")
async def cloturer_session_examen(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """
    Clôture une session d'examen (statut = cloturee).
    
    Requiert les droits admin ou scolarité.
    """
    session = session_examen_repository.cloturer_session(db, session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session d'examen non trouvée"
        )
    return session


@router.patch("/{session_id}/valider", response_model=SessionExamen, summary="Valider une session")
async def valider_session_examen(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """
    Valide une session d'examen (statut = validee).
    
    Requiert les droits superuser.
    """
    session = session_examen_repository.valider_session(db, session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session d'examen non trouvée"
        )
    return session


@router.delete("/{session_id}", summary="Supprimer une session")
async def delete_session_examen(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """
    Supprime une session d'examen.
    
    Requiert les droits superuser.
    """
    success = session_examen_repository.delete(db, session_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session d'examen non trouvée"
        )
    return {"message": "Session d'examen supprimée avec succès"}
