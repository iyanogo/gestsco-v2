"""
Endpoints API pour la gestion des filières.
"""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.api.deps import get_db, get_current_active_user
from app.utils.rbac_resolver import require_permission
from app.models.user import User
from app.repositories import filiere_repository, etablissement_repository
from app.schemas.filiere import Filiere, FiliereCreate, FiliereUpdate
from app.utils.administration_events import audit_and_commit
from app.utils.audit_snapshots import fields_snapshot

router = APIRouter(prefix="/filieres", tags=["Filières"])

_FILIERE_FIELDS = ("code", "libelle", "etablissement_id", "departement_id", "is_active")


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
    etablissement_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère la liste des filières.

    - **skip**: Nombre d'éléments à ignorer (pagination)
    - **limit**: Nombre maximum d'éléments à retourner
    - **search**: Terme de recherche optionnel
    - **etablissement_id**: Filtrer par établissement
    """
    if etablissement_id:
        return filiere_repository.get_by_etablissement(
            db, etablissement_id, skip=skip, limit=limit
        )
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
    etablissement_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Retourne le nombre total de filières."""
    if etablissement_id:
        return {"total": filiere_repository.count_by_etablissement(db, etablissement_id)}
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
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("referentiel", "create")),
):
    """Crée une nouvelle filière."""
    if filiere_in.etablissement_id is not None and not etablissement_repository.exists(
        db, filiere_in.etablissement_id
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Établissement non trouvé",
        )
    if filiere_in.code and filiere_repository.code_exists(db, filiere_in.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Le code '{filiere_in.code}' existe déjà",
        )
    try:
        filiere = filiere_repository.create(db, filiere_in)
        audit_and_commit(
            db,
            request=request,
            user=current_user,
            action="create",
            entity_type="filiere",
            entity_id=filiere.id,
            new_values=fields_snapshot(filiere, *_FILIERE_FIELDS),
        )
        return filiere
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
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("referentiel", "update")),
):
    """Met à jour une filière."""
    filiere = filiere_repository.get_by_id(db, filiere_id)
    if not filiere:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Filière non trouvée",
        )

    if filiere_in.etablissement_id is not None and not etablissement_repository.exists(
        db, filiere_in.etablissement_id
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Établissement non trouvé",
        )

    if filiere_in.code and filiere_in.code != filiere.code:
        if filiere_repository.code_exists(db, filiere_in.code, exclude_id=filiere_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Le code '{filiere_in.code}' existe déjà",
            )

    old_snapshot = fields_snapshot(filiere, *_FILIERE_FIELDS)
    try:
        updated = filiere_repository.update(db, filiere_id, filiere_in)
        audit_and_commit(
            db,
            request=request,
            user=current_user,
            action="update",
            entity_type="filiere",
            entity_id=filiere_id,
            old_values=old_snapshot,
            new_values=fields_snapshot(updated, *_FILIERE_FIELDS),
        )
        return updated
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
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("referentiel", "delete")),
):
    """Supprime une filière (suppression logique)."""
    filiere = filiere_repository.get_by_id(db, filiere_id)
    if not filiere:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Filière non trouvée",
        )
    old_snapshot = fields_snapshot(filiere, *_FILIERE_FIELDS)
    if not filiere_repository.delete(db, filiere_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Filière non trouvée",
        )
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="delete",
        entity_type="filiere",
        entity_id=filiere_id,
        old_values=old_snapshot,
    )
    return {"message": "Filière supprimée avec succès"}
