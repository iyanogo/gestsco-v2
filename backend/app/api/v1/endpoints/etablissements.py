"""
Endpoints API pour la gestion des établissements.
"""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.api.deps import get_db, get_current_active_user
from app.utils.rbac_resolver import require_permission
from app.models.user import User
from app.repositories import etablissement_repository, departement_repository, universite_repository
from app.schemas.etablissement import Etablissement, EtablissementCreate, EtablissementUpdate
from app.schemas.departement import Departement
from app.utils.administration_events import audit_and_commit
from app.utils.audit_snapshots import fields_snapshot

router = APIRouter(prefix="/etablissements", tags=["Établissements"])

_ETABLISSEMENT_FIELDS = ("code", "nom", "sigle", "ville", "universite_id", "is_active")


@router.get(
    "/",
    response_model=list[Etablissement],
    summary="Liste des établissements",
    description="Récupère la liste de tous les établissements avec pagination et filtres.",
)
def get_etablissements(
    skip: int = 0,
    limit: int = 100,
    search: str | None = None,
    universite_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère la liste des établissements.
    
    - **skip**: Nombre d'éléments à ignorer (pagination)
    - **limit**: Nombre maximum d'éléments à retourner
    - **search**: Terme de recherche optionnel
    - **universite_id**: Filtrer par université
    """
    if universite_id:
        return etablissement_repository.get_by_universite(db, universite_id, skip=skip, limit=limit)
    if search:
        return etablissement_repository.search(db, search, skip=skip, limit=limit)
    return etablissement_repository.get_all(db, skip=skip, limit=limit)


@router.get(
    "/count",
    response_model=dict,
    summary="Nombre d'établissements",
    description="Retourne le nombre total d'établissements actifs.",
)
def get_etablissements_count(
    universite_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Retourne le nombre total d'établissements."""
    if universite_id:
        return {"total": etablissement_repository.count_by_universite(db, universite_id)}
    return {"total": etablissement_repository.get_count(db)}


@router.get(
    "/{etablissement_id}",
    response_model=Etablissement,
    summary="Détails d'un établissement",
    description="Récupère les détails d'un établissement par son ID.",
)
def get_etablissement(
    etablissement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Récupère un établissement par son ID."""
    etablissement = etablissement_repository.get_by_id(db, etablissement_id)
    if not etablissement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Établissement non trouvé",
        )
    return etablissement


@router.post(
    "/",
    response_model=Etablissement,
    status_code=status.HTTP_201_CREATED,
    summary="Créer un établissement",
    description="Crée un nouvel établissement. Réservé aux administrateurs.",
)
def create_etablissement(
    etablissement_in: EtablissementCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("referentiel", "create")),
):
    """Crée un nouvel établissement."""
    if not universite_repository.exists(db, etablissement_in.universite_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Université non trouvée",
        )
    if etablissement_repository.code_exists(db, etablissement_in.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Le code '{etablissement_in.code}' existe déjà",
        )
    try:
        etablissement = etablissement_repository.create(db, etablissement_in)
        audit_and_commit(
            db,
            request=request,
            user=current_user,
            action="create",
            entity_type="etablissement",
            entity_id=etablissement.id,
            new_values=fields_snapshot(etablissement, *_ETABLISSEMENT_FIELDS),
        )
        return etablissement
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Erreur lors de la création de l'établissement",
        )


@router.put(
    "/{etablissement_id}",
    response_model=Etablissement,
    summary="Modifier un établissement",
    description="Met à jour un établissement existant. Réservé aux administrateurs.",
)
def update_etablissement(
    etablissement_id: int,
    etablissement_in: EtablissementUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("referentiel", "update")),
):
    """Met à jour un établissement."""
    etablissement = etablissement_repository.get_by_id(db, etablissement_id)
    if not etablissement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Établissement non trouvé",
        )
    
    if etablissement_in.universite_id and not universite_repository.exists(db, etablissement_in.universite_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Université non trouvée",
        )
    
    if etablissement_in.code and etablissement_in.code != etablissement.code:
        if etablissement_repository.code_exists(db, etablissement_in.code, exclude_id=etablissement_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Le code '{etablissement_in.code}' existe déjà",
            )
    
    old_snapshot = fields_snapshot(etablissement, *_ETABLISSEMENT_FIELDS)
    try:
        updated = etablissement_repository.update(db, etablissement_id, etablissement_in)
        audit_and_commit(
            db,
            request=request,
            user=current_user,
            action="update",
            entity_type="etablissement",
            entity_id=etablissement_id,
            old_values=old_snapshot,
            new_values=fields_snapshot(updated, *_ETABLISSEMENT_FIELDS),
        )
        return updated
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Erreur lors de la mise à jour de l'établissement",
        )


@router.delete(
    "/{etablissement_id}",
    response_model=dict,
    summary="Supprimer un établissement",
    description="Supprime un établissement (suppression logique). Réservé aux administrateurs.",
)
def delete_etablissement(
    etablissement_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("referentiel", "delete")),
):
    """Supprime un établissement (suppression logique)."""
    etablissement = etablissement_repository.get_by_id(db, etablissement_id)
    if not etablissement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Établissement non trouvé",
        )
    old_snapshot = fields_snapshot(etablissement, *_ETABLISSEMENT_FIELDS)
    if not etablissement_repository.delete(db, etablissement_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Établissement non trouvé",
        )
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="delete",
        entity_type="etablissement",
        entity_id=etablissement_id,
        old_values=old_snapshot,
    )
    return {"message": "Établissement supprimé avec succès"}


@router.get(
    "/{etablissement_id}/departements",
    response_model=list[Departement],
    summary="Départements d'un établissement",
    description="Liste les départements appartenant à un établissement.",
)
def get_etablissement_departements(
    etablissement_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Liste les départements d'un établissement."""
    etablissement = etablissement_repository.get_by_id(db, etablissement_id)
    if not etablissement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Établissement non trouvé",
        )
    return departement_repository.get_by_etablissement(db, etablissement_id, skip=skip, limit=limit)
