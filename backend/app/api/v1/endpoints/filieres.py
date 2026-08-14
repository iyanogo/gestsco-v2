"""
Endpoints API pour la gestion des filières.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.api.deps import get_db, get_current_active_user, get_current_superuser
from app.models.user import User
from app.repositories import filiere_repository, departement_repository, cycle_repository
from app.schemas.filiere import Filiere, FiliereCreate, FiliereUpdate

router = APIRouter(prefix="/filieres", tags=["Filières"])


@router.get(
    "/",
    response_model=list[Filiere],
    summary="Liste des filières",
    description="Récupère la liste de toutes les filières avec pagination et filtres.",
)
def get_filieres(
    skip: int = 0,
    limit: int = 100,
    search: str | None = None,
    departement_id: int | None = None,
    cycle_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère la liste des filières.
    
    - **skip**: Nombre d'éléments à ignorer (pagination)
    - **limit**: Nombre maximum d'éléments à retourner
    - **search**: Terme de recherche optionnel
    - **departement_id**: Filtrer par département
    - **cycle_id**: Filtrer par cycle
    """
    if departement_id and cycle_id:
        return filiere_repository.get_by_departement_and_cycle(db, departement_id, cycle_id)
    if departement_id:
        return filiere_repository.get_by_departement(db, departement_id, skip=skip, limit=limit)
    if cycle_id:
        return filiere_repository.get_by_cycle(db, cycle_id, skip=skip, limit=limit)
    if search:
        return filiere_repository.search(db, search, skip=skip, limit=limit)
    return filiere_repository.get_all(db, skip=skip, limit=limit)


@router.get(
    "/count",
    response_model=dict,
    summary="Nombre de filières",
    description="Retourne le nombre total de filières actives.",
)
def get_filieres_count(
    departement_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Retourne le nombre total de filières."""
    if departement_id:
        return {"total": filiere_repository.count_by_departement(db, departement_id)}
    return {"total": filiere_repository.get_count(db)}


@router.get(
    "/{filiere_id}",
    response_model=Filiere,
    summary="Détails d'une filière",
    description="Récupère les détails d'une filière par son ID.",
)
def get_filiere(
    filiere_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Récupère une filière par son ID."""
    filiere = filiere_repository.get_by_id(db, filiere_id)
    if not filiere:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Filière non trouvée",
        )
    return filiere


@router.post(
    "/",
    response_model=Filiere,
    status_code=status.HTTP_201_CREATED,
    summary="Créer une filière",
    description="Crée une nouvelle filière. Réservé aux administrateurs.",
)
def create_filiere(
    filiere_in: FiliereCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """Crée une nouvelle filière."""
    if not departement_repository.exists(db, filiere_in.departement_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Département non trouvé",
        )
    if not cycle_repository.exists(db, filiere_in.cycle_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cycle non trouvé",
        )
    if filiere_repository.code_exists(db, filiere_in.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Le code '{filiere_in.code}' existe déjà",
        )
    try:
        return filiere_repository.create(db, filiere_in)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Erreur lors de la création de la filière",
        )


@router.put(
    "/{filiere_id}",
    response_model=Filiere,
    summary="Modifier une filière",
    description="Met à jour une filière existante. Réservé aux administrateurs.",
)
def update_filiere(
    filiere_id: int,
    filiere_in: FiliereUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """Met à jour une filière."""
    filiere = filiere_repository.get_by_id(db, filiere_id)
    if not filiere:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Filière non trouvée",
        )
    
    if filiere_in.departement_id and not departement_repository.exists(db, filiere_in.departement_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Département non trouvé",
        )
    if filiere_in.cycle_id and not cycle_repository.exists(db, filiere_in.cycle_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cycle non trouvé",
        )
    
    if filiere_in.code and filiere_in.code != filiere.code:
        if filiere_repository.code_exists(db, filiere_in.code, exclude_id=filiere_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Le code '{filiere_in.code}' existe déjà",
            )
    
    try:
        return filiere_repository.update(db, filiere_id, filiere_in)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Erreur lors de la mise à jour de la filière",
        )


@router.delete(
    "/{filiere_id}",
    response_model=dict,
    summary="Supprimer une filière",
    description="Supprime une filière (suppression logique). Réservé aux administrateurs.",
)
def delete_filiere(
    filiere_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """Supprime une filière (suppression logique)."""
    if not filiere_repository.delete(db, filiere_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Filière non trouvée",
        )
    return {"message": "Filière supprimée avec succès"}
