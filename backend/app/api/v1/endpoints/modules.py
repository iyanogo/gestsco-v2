"""
Endpoints API pour la gestion des modules.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.api.deps import get_db, get_current_active_user, get_current_superuser
from app.models.user import User
from app.repositories import module_repository, matiere_repository
from app.schemas.module import Module, ModuleCreate, ModuleUpdate
from app.schemas.matiere import Matiere

router = APIRouter(prefix="/modules", tags=["Modules"])


@router.get(
    "/",
    response_model=list[Module],
    summary="Liste des modules",
    description="Récupère la liste de tous les modules avec pagination et filtres.",
)
def get_modules(
    skip: int = 0,
    limit: int = 100,
    search: str | None = None,
    type_module: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère la liste des modules.
    
    - **skip**: Nombre d'éléments à ignorer (pagination)
    - **limit**: Nombre maximum d'éléments à retourner
    - **search**: Terme de recherche optionnel
    - **type_module**: Filtrer par type (Obligatoire, Optionnel)
    """
    if type_module:
        return module_repository.get_by_type(db, type_module, skip=skip, limit=limit)
    if search:
        return module_repository.search(db, search, skip=skip, limit=limit)
    return module_repository.get_all(db, skip=skip, limit=limit)


@router.get(
    "/count",
    response_model=dict,
    summary="Nombre de modules",
    description="Retourne le nombre total de modules actifs.",
)
def get_modules_count(
    type_module: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Retourne le nombre total de modules."""
    if type_module:
        return {"total": module_repository.count_by_type(db, type_module)}
    return {"total": module_repository.get_count(db)}


@router.get(
    "/{module_id}",
    response_model=Module,
    summary="Détails d'un module",
    description="Récupère les détails d'un module par son ID.",
)
def get_module(
    module_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Récupère un module par son ID."""
    module = module_repository.get_by_id(db, module_id)
    if not module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Module non trouvé",
        )
    return module


@router.post(
    "/",
    response_model=Module,
    status_code=status.HTTP_201_CREATED,
    summary="Créer un module",
    description="Crée un nouveau module. Réservé aux administrateurs.",
)
def create_module(
    module_in: ModuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """Crée un nouveau module."""
    if module_repository.code_exists(db, module_in.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Le code '{module_in.code}' existe déjà",
        )
    try:
        return module_repository.create(db, module_in)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Erreur lors de la création du module",
        )


@router.put(
    "/{module_id}",
    response_model=Module,
    summary="Modifier un module",
    description="Met à jour un module existant. Réservé aux administrateurs.",
)
def update_module(
    module_id: int,
    module_in: ModuleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """Met à jour un module."""
    module = module_repository.get_by_id(db, module_id)
    if not module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Module non trouvé",
        )
    
    if module_in.code and module_in.code != module.code:
        if module_repository.code_exists(db, module_in.code, exclude_id=module_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Le code '{module_in.code}' existe déjà",
            )
    
    try:
        return module_repository.update(db, module_id, module_in)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Erreur lors de la mise à jour du module",
        )


@router.delete(
    "/{module_id}",
    response_model=dict,
    summary="Supprimer un module",
    description="Supprime un module (suppression logique). Réservé aux administrateurs.",
)
def delete_module(
    module_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """Supprime un module (suppression logique)."""
    if not module_repository.delete(db, module_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Module non trouvé",
        )
    return {"message": "Module supprimé avec succès"}


@router.get(
    "/{module_id}/matieres",
    response_model=list[Matiere],
    summary="Matières d'un module",
    description="Liste les matières appartenant à un module.",
)
def get_module_matieres(
    module_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Liste les matières d'un module."""
    module = module_repository.get_by_id(db, module_id)
    if not module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Module non trouvé",
        )
    return matiere_repository.get_by_module(db, module_id, skip=skip, limit=limit)
