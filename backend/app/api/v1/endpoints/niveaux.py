"""
Endpoints API pour la gestion des niveaux.
"""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.repositories import niveau_repository
from app.schemas.niveau import Niveau, NiveauCreate, NiveauUpdate
from app.utils.administration_events import audit_and_commit
from app.utils.audit_snapshots import fields_snapshot
from app.utils.rbac_resolver import require_permission

router = APIRouter(prefix="/niveaux", tags=["Niveaux"])

_NIVEAU_FIELDS = ("code", "libelle", "semestre_id")


@router.get(
    "/",
    response_model=list[Niveau],
    summary="Liste des niveaux",
    description="Récupère la liste de tous les niveaux triés par ordre.",
)
def get_niveaux(
    skip: int = 0,
    limit: int = 100,
    cycle_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère la liste des niveaux triés par ordre.
    
    - **skip**: Nombre d'éléments à ignorer (pagination)
    - **limit**: Nombre maximum d'éléments à retourner
    - **cycle_id**: Filtrer par cycle
    """
    if cycle_id:
        return niveau_repository.get_by_cycle(db, cycle_id)
    return niveau_repository.get_ordered(db)


@router.get(
    "/count",
    response_model=dict,
    summary="Nombre de niveaux",
    description="Retourne le nombre total de niveaux actifs.",
)
def get_niveaux_count(
    cycle_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Retourne le nombre total de niveaux."""
    if cycle_id:
        return {"total": niveau_repository.count_by_cycle(db, cycle_id)}
    return {"total": niveau_repository.get_count(db)}


@router.get(
    "/{niveau_id}",
    response_model=Niveau,
    summary="Détails d'un niveau",
    description="Récupère les détails d'un niveau par son ID.",
)
def get_niveau(
    niveau_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Récupère un niveau par son ID."""
    niveau = niveau_repository.get_by_id(db, niveau_id)
    if not niveau:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Niveau non trouvé",
        )
    return niveau


@router.post(
    "/",
    response_model=Niveau,
    status_code=status.HTTP_201_CREATED,
    summary="Créer un niveau",
    description="Crée un nouveau niveau. Réservé aux administrateurs.",
)
def create_niveau(
    niveau_in: NiveauCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("referentiel", "create")),
):
    """Crée un nouveau niveau."""
    if niveau_in.code and niveau_repository.code_exists(db, niveau_in.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Le code '{niveau_in.code}' existe déjà",
        )
    try:
        niveau = niveau_repository.create(db, niveau_in)
        audit_and_commit(
            db,
            request=request,
            user=current_user,
            action="create",
            entity_type="niveau",
            entity_id=niveau.id,
            new_values=fields_snapshot(niveau, *_NIVEAU_FIELDS),
        )
        return niveau
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Erreur lors de la création du niveau",
        )


@router.put(
    "/{niveau_id}",
    response_model=Niveau,
    summary="Modifier un niveau",
    description="Met à jour un niveau existant. Réservé aux administrateurs.",
)
def update_niveau(
    niveau_id: int,
    niveau_in: NiveauUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("referentiel", "update")),
):
    """Met à jour un niveau."""
    niveau = niveau_repository.get_by_id(db, niveau_id)
    if not niveau:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Niveau non trouvé",
        )
    
    if niveau_in.code and niveau_in.code != niveau.code:
        if niveau_repository.code_exists(db, niveau_in.code, exclude_id=niveau_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Le code '{niveau_in.code}' existe déjà",
            )
    
    old_snapshot = fields_snapshot(niveau, *_NIVEAU_FIELDS)
    try:
        updated = niveau_repository.update(db, niveau_id, niveau_in)
        audit_and_commit(
            db,
            request=request,
            user=current_user,
            action="update",
            entity_type="niveau",
            entity_id=niveau_id,
            old_values=old_snapshot,
            new_values=fields_snapshot(updated, *_NIVEAU_FIELDS),
        )
        return updated
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Erreur lors de la mise à jour du niveau",
        )


@router.delete(
    "/{niveau_id}",
    response_model=dict,
    summary="Supprimer un niveau",
    description="Supprime un niveau (suppression logique). Réservé aux administrateurs.",
)
def delete_niveau(
    niveau_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("referentiel", "delete")),
):
    """Supprime un niveau (suppression logique)."""
    niveau = niveau_repository.get_by_id(db, niveau_id)
    if not niveau:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Niveau non trouvé",
        )
    old_snapshot = fields_snapshot(niveau, *_NIVEAU_FIELDS)
    if not niveau_repository.delete(db, niveau_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Niveau non trouvé",
        )
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="delete",
        entity_type="niveau",
        entity_id=niveau_id,
        old_values=old_snapshot,
    )
    return {"message": "Niveau supprimé avec succès"}
