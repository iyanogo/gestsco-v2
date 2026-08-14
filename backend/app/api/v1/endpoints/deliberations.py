"""
Endpoints API pour la gestion des délibérations
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user
from app.core.permissions import get_current_scolarite_user, get_current_superuser
from app.models.user import User
from app.repositories import deliberation_repository
from app.schemas.deliberation import (
    Deliberation,
    DeliberationCreate,
    DeliberationUpdate,
)

router = APIRouter(prefix="/deliberations", tags=["Délibérations"])


class CreerDeliberationRequest(BaseModel):
    session_id: int
    niveau_id: int
    filiere_id: int
    type_deliberation: str  # semestrielle, annuelle
    semestre: Optional[int] = None
    president_id: Optional[int] = None


@router.get("/", response_model=list[Deliberation], summary="Liste des délibérations")
async def list_deliberations(
    skip: int = Query(0, ge=0, description="Nombre d'éléments à ignorer"),
    limit: int = Query(100, ge=1, le=500, description="Nombre maximum d'éléments"),
    session_id: Optional[int] = Query(None, description="Filtrer par session"),
    niveau_id: Optional[int] = Query(None, description="Filtrer par niveau"),
    filiere_id: Optional[int] = Query(None, description="Filtrer par filière"),
    statut: Optional[str] = Query(None, description="Filtrer par statut"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """
    Récupère la liste des délibérations avec pagination et filtres.
    
    Requiert les droits admin ou scolarité.
    """
    if session_id:
        return deliberation_repository.get_by_session(db, session_id, skip=skip, limit=limit)
    
    if niveau_id and filiere_id:
        return deliberation_repository.get_by_niveau_filiere(
            db, niveau_id, filiere_id, session_id=session_id
        )
    
    if statut:
        return deliberation_repository.get_by_statut(db, statut, skip=skip, limit=limit)
    
    return deliberation_repository.get_all(db, skip=skip, limit=limit)


@router.get("/{deliberation_id}", response_model=Deliberation, summary="Détails d'une délibération")
async def get_deliberation(
    deliberation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère une délibération par son ID.
    """
    deliberation = deliberation_repository.get_by_id(db, deliberation_id)
    if not deliberation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Délibération non trouvée"
        )
    return deliberation


@router.get("/{deliberation_id}/statistiques", summary="Statistiques d'une délibération")
async def get_statistiques_deliberation(
    deliberation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère les statistiques actualisées d'une délibération.
    """
    deliberation = deliberation_repository.get_by_id(db, deliberation_id)
    if not deliberation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Délibération non trouvée"
        )
    
    stats = deliberation_repository.get_statistiques(db, deliberation_id)
    
    return {
        "deliberation_id": deliberation_id,
        "nombre_etudiants": stats.get("nombre_etudiants", 0),
        "nombre_admis": stats.get("nombre_admis", 0),
        "nombre_ajournes": stats.get("nombre_ajournes", 0),
        "nombre_redoublants": stats.get("nombre_redoublants", 0),
        "taux_reussite": stats.get("taux_reussite"),
    }


@router.post("/", response_model=Deliberation, status_code=status.HTTP_201_CREATED, summary="Créer une délibération")
async def create_deliberation(
    deliberation_in: DeliberationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """
    Crée une nouvelle délibération.
    
    Requiert les droits admin ou scolarité.
    """
    return deliberation_repository.create(db, deliberation_in)


@router.post("/creer", summary="Créer une délibération avec calcul automatique")
async def creer_deliberation_auto(
    request: CreerDeliberationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """
    Crée une nouvelle délibération avec calcul automatique des statistiques.
    
    Requiert les droits admin ou scolarité.
    """
    deliberation = deliberation_repository.creer_deliberation(
        db,
        session_id=request.session_id,
        niveau_id=request.niveau_id,
        filiere_id=request.filiere_id,
        type_deliberation=request.type_deliberation,
        semestre=request.semestre,
        president_id=request.president_id
    )
    
    return {
        "message": "Délibération créée avec succès",
        "deliberation": deliberation
    }


@router.put("/{deliberation_id}", response_model=Deliberation, summary="Modifier une délibération")
async def update_deliberation(
    deliberation_id: int,
    deliberation_in: DeliberationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """
    Met à jour une délibération existante.
    
    Requiert les droits admin ou scolarité.
    """
    deliberation = deliberation_repository.get_by_id(db, deliberation_id)
    if not deliberation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Délibération non trouvée"
        )
    
    # Ne pas permettre la modification d'une délibération publiée
    if deliberation.publiee:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cette délibération est publiée et ne peut plus être modifiée"
        )
    
    return deliberation_repository.update(db, deliberation_id, deliberation_in)


@router.patch("/{deliberation_id}/terminer", response_model=Deliberation, summary="Terminer une délibération")
async def terminer_deliberation(
    deliberation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """
    Termine une délibération.
    
    Requiert les droits admin ou scolarité.
    """
    deliberation = deliberation_repository.terminer_deliberation(db, deliberation_id)
    if not deliberation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Délibération non trouvée"
        )
    return deliberation


@router.patch("/{deliberation_id}/valider", response_model=Deliberation, summary="Valider une délibération")
async def valider_deliberation(
    deliberation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """
    Valide une délibération.
    
    Requiert les droits superuser.
    """
    deliberation = deliberation_repository.valider_deliberation(
        db, deliberation_id, current_user.id
    )
    if not deliberation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Délibération non trouvée"
        )
    return deliberation


@router.patch("/{deliberation_id}/publier", response_model=Deliberation, summary="Publier une délibération")
async def publier_deliberation(
    deliberation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """
    Publie une délibération (rend les résultats visibles aux étudiants).
    
    Requiert les droits admin ou scolarité.
    """
    deliberation = deliberation_repository.get_by_id(db, deliberation_id)
    if not deliberation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Délibération non trouvée"
        )
    
    # Vérifier que la délibération est validée
    if deliberation.statut != "validee":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La délibération doit être validée avant d'être publiée"
        )
    
    deliberation = deliberation_repository.publier_deliberation(db, deliberation_id)
    return deliberation


@router.patch("/{deliberation_id}/actualiser-stats", summary="Actualiser les statistiques")
async def actualiser_statistiques_deliberation(
    deliberation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """
    Actualise les statistiques d'une délibération.
    
    Requiert les droits admin ou scolarité.
    """
    deliberation = deliberation_repository.actualiser_statistiques(db, deliberation_id)
    if not deliberation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Délibération non trouvée"
        )
    
    return {
        "message": "Statistiques actualisées avec succès",
        "deliberation": deliberation
    }


@router.delete("/{deliberation_id}", summary="Supprimer une délibération")
async def delete_deliberation(
    deliberation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """
    Supprime une délibération.
    
    Requiert les droits superuser.
    """
    deliberation = deliberation_repository.get_by_id(db, deliberation_id)
    if not deliberation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Délibération non trouvée"
        )
    
    # Ne pas permettre la suppression d'une délibération publiée
    if deliberation.publiee:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cette délibération est publiée et ne peut pas être supprimée"
        )
    
    success = deliberation_repository.delete(db, deliberation_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Délibération non trouvée"
        )
    return {"message": "Délibération supprimée avec succès"}
