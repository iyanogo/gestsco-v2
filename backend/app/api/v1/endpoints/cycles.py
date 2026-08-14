"""
Endpoints API pour la gestion des cycles.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.api.deps import get_db, get_current_active_user, get_current_superuser
from app.models.user import User
from app.repositories import cycle_repository, niveau_repository
from app.schemas.cycle import Cycle, CycleCreate, CycleUpdate
from app.schemas.niveau import Niveau

router = APIRouter(prefix="/cycles", tags=["Cycles"])


@router.get(
    "/",
    response_model=list[Cycle],
    summary="Liste des cycles",
    description="Récupère la liste de tous les cycles triés par ordre (L, M, D).",
)
def get_cycles(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère la liste des cycles triés par ordre.
    
    - **skip**: Nombre d'éléments à ignorer (pagination)
    - **limit**: Nombre maximum d'éléments à retourner
    """
    return cycle_repository.get_ordered(db)


@router.get(
    "/count",
    response_model=dict,
    summary="Nombre de cycles",
    description="Retourne le nombre total de cycles actifs.",
)
def get_cycles_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Retourne le nombre total de cycles."""
    return {"total": cycle_repository.get_count(db)}


@router.get(
    "/{cycle_id}",
    response_model=Cycle,
    summary="Détails d'un cycle",
    description="Récupère les détails d'un cycle par son ID.",
)
def get_cycle(
    cycle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Récupère un cycle par son ID."""
    cycle = cycle_repository.get_by_id(db, cycle_id)
    if not cycle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cycle non trouvé",
        )
    return cycle


@router.post(
    "/",
    response_model=Cycle,
    status_code=status.HTTP_201_CREATED,
    summary="Créer un cycle",
    description="Crée un nouveau cycle. Réservé aux administrateurs.",
)
def create_cycle(
    cycle_in: CycleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """Crée un nouveau cycle."""
    if cycle_repository.code_exists(db, cycle_in.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Le code '{cycle_in.code}' existe déjà",
        )
    try:
        return cycle_repository.create(db, cycle_in)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Erreur lors de la création du cycle",
        )


@router.put(
    "/{cycle_id}",
    response_model=Cycle,
    summary="Modifier un cycle",
    description="Met à jour un cycle existant. Réservé aux administrateurs.",
)
def update_cycle(
    cycle_id: int,
    cycle_in: CycleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """Met à jour un cycle."""
    cycle = cycle_repository.get_by_id(db, cycle_id)
    if not cycle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cycle non trouvé",
        )
    
    if cycle_in.code and cycle_in.code != cycle.code:
        if cycle_repository.code_exists(db, cycle_in.code, exclude_id=cycle_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Le code '{cycle_in.code}' existe déjà",
            )
    
    try:
        return cycle_repository.update(db, cycle_id, cycle_in)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Erreur lors de la mise à jour du cycle",
        )


@router.delete(
    "/{cycle_id}",
    response_model=dict,
    summary="Supprimer un cycle",
    description="Supprime un cycle (suppression logique). Réservé aux administrateurs.",
)
def delete_cycle(
    cycle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """Supprime un cycle (suppression logique)."""
    if not cycle_repository.delete(db, cycle_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cycle non trouvé",
        )
    return {"message": "Cycle supprimé avec succès"}


@router.get(
    "/{cycle_id}/niveaux",
    response_model=list[Niveau],
    summary="Niveaux d'un cycle",
    description="Liste les niveaux appartenant à un cycle.",
)
def get_cycle_niveaux(
    cycle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Liste les niveaux d'un cycle."""
    cycle = cycle_repository.get_by_id(db, cycle_id)
    if not cycle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cycle non trouvé",
        )
    return niveau_repository.get_by_cycle(db, cycle_id)
