"""
Endpoints API pour la gestion des départements.
"""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.repositories import departement_repository, filiere_repository, etablissement_repository
from app.schemas.departement import Departement, DepartementCreate, DepartementUpdate
from app.schemas.filiere import Filiere
from app.utils.administration_events import audit_and_commit
from app.utils.audit_snapshots import fields_snapshot
from app.utils.rbac_resolver import require_permission

router = APIRouter(prefix="/departements", tags=["Départements"])

_DEPT_FIELDS = ("code", "libelle", "etablissement_id")


@router.get(
    "/",
    response_model=list[Departement],
    summary="Liste des départements",
    description="Récupère la liste de tous les départements avec pagination et filtres.",
)
def get_departements(
    skip: int = 0,
    limit: int = 100,
    search: str | None = None,
    etablissement_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère la liste des départements.
    
    - **skip**: Nombre d'éléments à ignorer (pagination)
    - **limit**: Nombre maximum d'éléments à retourner
    - **search**: Terme de recherche optionnel
    - **etablissement_id**: Filtrer par établissement
    """
    if etablissement_id:
        return departement_repository.get_by_etablissement(db, etablissement_id, skip=skip, limit=limit)
    if search:
        return departement_repository.search(db, search, skip=skip, limit=limit)
    return departement_repository.get_all(db, skip=skip, limit=limit)


@router.get(
    "/count",
    response_model=dict,
    summary="Nombre de départements",
    description="Retourne le nombre total de départements actifs.",
)
def get_departements_count(
    etablissement_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Retourne le nombre total de départements."""
    if etablissement_id:
        return {"total": departement_repository.count_by_etablissement(db, etablissement_id)}
    return {"total": departement_repository.get_count(db)}


@router.get(
    "/{departement_id}",
    response_model=Departement,
    summary="Détails d'un département",
    description="Récupère les détails d'un département par son ID.",
)
def get_departement(
    departement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Récupère un département par son ID."""
    departement = departement_repository.get_by_id(db, departement_id)
    if not departement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Département non trouvé",
        )
    return departement


@router.post(
    "/",
    response_model=Departement,
    status_code=status.HTTP_201_CREATED,
    summary="Créer un département",
    description="Crée un nouveau département. Réservé aux administrateurs.",
)
def create_departement(
    departement_in: DepartementCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("referentiel", "create")),
):
    """Crée un nouveau département."""
    if not etablissement_repository.exists(db, departement_in.etablissement_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Établissement non trouvé",
        )
    if departement_repository.code_exists(db, departement_in.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Le code '{departement_in.code}' existe déjà",
        )
    try:
        departement = departement_repository.create(db, departement_in)
        audit_and_commit(
            db,
            request=request,
            user=current_user,
            action="create",
            entity_type="departement",
            entity_id=departement.id,
            new_values=fields_snapshot(departement, *_DEPT_FIELDS),
        )
        return departement
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Erreur lors de la création du département",
        )


@router.put(
    "/{departement_id}",
    response_model=Departement,
    summary="Modifier un département",
    description="Met à jour un département existant. Réservé aux administrateurs.",
)
def update_departement(
    departement_id: int,
    departement_in: DepartementUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("referentiel", "update")),
):
    """Met à jour un département."""
    departement = departement_repository.get_by_id(db, departement_id)
    if not departement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Département non trouvé",
        )
    
    if departement_in.etablissement_id and not etablissement_repository.exists(db, departement_in.etablissement_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Établissement non trouvé",
        )
    
    if departement_in.code and departement_in.code != departement.code:
        if departement_repository.code_exists(db, departement_in.code, exclude_id=departement_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Le code '{departement_in.code}' existe déjà",
            )
    
    old_snapshot = fields_snapshot(departement, *_DEPT_FIELDS)
    try:
        updated = departement_repository.update(db, departement_id, departement_in)
        audit_and_commit(
            db,
            request=request,
            user=current_user,
            action="update",
            entity_type="departement",
            entity_id=departement_id,
            old_values=old_snapshot,
            new_values=fields_snapshot(updated, *_DEPT_FIELDS),
        )
        return updated
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Erreur lors de la mise à jour du département",
        )


@router.delete(
    "/{departement_id}",
    response_model=dict,
    summary="Supprimer un département",
    description="Supprime un département (suppression logique). Réservé aux administrateurs.",
)
def delete_departement(
    departement_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("referentiel", "delete")),
):
    """Supprime un département (suppression logique)."""
    departement = departement_repository.get_by_id(db, departement_id)
    if not departement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Département non trouvé",
        )
    old_snapshot = fields_snapshot(departement, *_DEPT_FIELDS)
    if not departement_repository.delete(db, departement_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Département non trouvé",
        )
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="delete",
        entity_type="departement",
        entity_id=departement_id,
        old_values=old_snapshot,
    )
    return {"message": "Département supprimé avec succès"}


@router.get(
    "/{departement_id}/filieres",
    response_model=list[Filiere],
    summary="Filières d'un département",
    description="Liste les filières appartenant à un département.",
)
def get_departement_filieres(
    departement_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Liste les filières d'un département."""
    departement = departement_repository.get_by_id(db, departement_id)
    if not departement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Département non trouvé",
        )
    if not departement.etablissement_id:
        return []
    return filiere_repository.get_by_etablissement(
        db, departement.etablissement_id, skip=skip, limit=limit
    )
