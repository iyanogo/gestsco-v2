"""
Endpoints API pour la gestion des examens
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user
from app.core.permissions import get_current_scolarite_user
from app.models.user import User
from app.repositories import examen_repository, note_repository
from app.schemas.examen import (
    Examen,
    ExamenCreate,
    ExamenUpdate,
)

router = APIRouter(prefix="/examens", tags=["Examens"])


@router.get("/", response_model=list[Examen], summary="Liste des examens")
async def list_examens(
    skip: int = Query(0, ge=0, description="Nombre d'éléments à ignorer"),
    limit: int = Query(100, ge=1, le=500, description="Nombre maximum d'éléments"),
    session_id: Optional[int] = Query(None, description="Filtrer par session"),
    matiere_id: Optional[int] = Query(None, description="Filtrer par matière"),
    niveau_id: Optional[int] = Query(None, description="Filtrer par niveau"),
    type_evaluation: Optional[str] = Query(None, description="Filtrer par type (cc, tp, examen, projet)"),
    enseignant_id: Optional[int] = Query(None, description="Filtrer par enseignant"),
    statut: Optional[str] = Query(None, description="Filtrer par statut"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère la liste des examens avec pagination et filtres.
    """
    if session_id:
        return examen_repository.get_by_session(db, session_id, skip=skip, limit=limit)
    
    if matiere_id:
        return examen_repository.get_by_matiere(db, matiere_id, session_id=session_id)
    
    if niveau_id:
        return examen_repository.get_by_niveau(db, niveau_id, session_id=session_id)
    
    if enseignant_id:
        return examen_repository.get_by_enseignant(db, enseignant_id, session_id=session_id)
    
    if type_evaluation:
        return examen_repository.get_by_type(db, type_evaluation, session_id=session_id)
    
    if statut:
        return examen_repository.get_by_statut(db, statut, session_id=session_id)
    
    return examen_repository.get_all(db, skip=skip, limit=limit)


@router.get("/{examen_id}", response_model=Examen, summary="Détails d'un examen")
async def get_examen(
    examen_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère un examen par son ID.
    """
    examen = examen_repository.get_by_id(db, examen_id)
    if not examen:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Examen non trouvé"
        )
    return examen


@router.get("/{examen_id}/statistiques", summary="Statistiques d'un examen")
async def get_statistiques_examen(
    examen_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère les statistiques d'un examen.
    
    Retourne :
    - **moyenne**: Moyenne des notes
    - **min**: Note minimale
    - **max**: Note maximale
    - **nombre_presents**: Nombre d'étudiants présents
    - **nombre_absents**: Nombre d'étudiants absents
    - **taux_reussite**: Pourcentage de réussite (note >= 10)
    """
    examen = examen_repository.get_by_id(db, examen_id)
    if not examen:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Examen non trouvé"
        )
    
    return note_repository.get_statistiques_examen(db, examen_id)


@router.post("/", response_model=Examen, status_code=status.HTTP_201_CREATED, summary="Créer un examen")
async def create_examen(
    examen_in: ExamenCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """
    Crée un nouvel examen.
    
    Requiert les droits admin ou scolarité.
    """
    return examen_repository.create(db, examen_in)


@router.put("/{examen_id}", response_model=Examen, summary="Modifier un examen")
async def update_examen(
    examen_id: int,
    examen_in: ExamenUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """
    Met à jour un examen existant.
    
    Requiert les droits admin ou scolarité.
    """
    examen = examen_repository.get_by_id(db, examen_id)
    if not examen:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Examen non trouvé"
        )
    
    return examen_repository.update(db, examen_id, examen_in)


@router.patch("/{examen_id}/terminer", response_model=Examen, summary="Terminer un examen")
async def terminer_examen(
    examen_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """
    Marque un examen comme terminé.
    
    Requiert les droits admin ou scolarité.
    """
    examen = examen_repository.terminer_examen(db, examen_id)
    if not examen:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Examen non trouvé"
        )
    return examen


@router.patch("/{examen_id}/notes-saisies", response_model=Examen, summary="Marquer notes saisies")
async def marquer_notes_saisies(
    examen_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Marque les notes d'un examen comme saisies.
    """
    examen = examen_repository.marquer_notes_saisies(db, examen_id)
    if not examen:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Examen non trouvé"
        )
    return examen


@router.patch("/{examen_id}/valider", response_model=Examen, summary="Valider un examen")
async def valider_examen(
    examen_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """
    Valide un examen.
    
    Requiert les droits admin ou scolarité.
    """
    examen = examen_repository.valider_examen(db, examen_id)
    if not examen:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Examen non trouvé"
        )
    return examen


@router.delete("/{examen_id}", summary="Supprimer un examen")
async def delete_examen(
    examen_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """
    Supprime un examen.
    
    Requiert les droits admin ou scolarité.
    """
    success = examen_repository.delete(db, examen_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Examen non trouvé"
        )
    return {"message": "Examen supprimé avec succès"}
