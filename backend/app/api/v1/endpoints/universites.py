"""
Endpoints API pour la gestion des universités.
"""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.api.deps import get_db, get_current_active_user
from app.utils.rbac_resolver import require_permission
from app.models.user import User
from app.repositories import universite_repository, etablissement_repository
from app.schemas.universite import Universite, UniversiteCreate, UniversiteUpdate
from app.schemas.etablissement import Etablissement
from app.utils.administration_events import audit_and_commit
from app.utils.audit_snapshots import fields_snapshot

router = APIRouter(prefix="/universites", tags=["Universités"])

_UNIVERSITE_FIELDS = ("code", "libelle", "sigle", "is_active")


@router.get(
    "/",
    response_model=list[Universite],
    summary="Liste des universités",
    description="Récupère la liste de toutes les universités avec pagination et recherche optionnelle.",
)
def get_universites(
    skip: int = 0,
    limit: int = 100,
    search: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère la liste des universités.
    
    - **skip**: Nombre d'éléments à ignorer (pagination)
    - **limit**: Nombre maximum d'éléments à retourner
    - **search**: Terme de recherche optionnel (code ou libellé)
    """
    if search:
        return universite_repository.search(db, search, skip=skip, limit=limit)
    return universite_repository.get_all(db, skip=skip, limit=limit)


@router.get(
    "/count",
    response_model=dict,
    summary="Nombre d'universités",
    description="Retourne le nombre total d'universités actives.",
)
def get_universites_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Retourne le nombre total d'universités."""
    return {"total": universite_repository.get_count(db)}


@router.get(
    "/{universite_id}",
    response_model=Universite,
    summary="Détails d'une université",
    description="Récupère les détails d'une université par son ID.",
)
def get_universite(
    universite_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère une université par son ID.
    
    - **universite_id**: ID de l'université
    """
    universite = universite_repository.get_by_id(db, universite_id)
    if not universite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Université non trouvée",
        )
    return universite


@router.post(
    "/",
    response_model=Universite,
    status_code=status.HTTP_201_CREATED,
    summary="Créer une université",
    description="Crée une nouvelle université. Réservé aux administrateurs.",
)
def create_universite(
    universite_in: UniversiteCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("referentiel", "create")),
):
    """
    Crée une nouvelle université.
    
    - **code**: Code unique de l'université
    - **libelle**: Nom complet de l'université
    - **sigle**: Sigle optionnel
    """
    if universite_repository.code_exists(db, universite_in.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Le code '{universite_in.code}' existe déjà",
        )
    try:
        universite = universite_repository.create(db, universite_in)
        audit_and_commit(
            db,
            request=request,
            user=current_user,
            action="create",
            entity_type="universite",
            entity_id=universite.id,
            new_values=fields_snapshot(universite, *_UNIVERSITE_FIELDS),
        )
        return universite
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Erreur lors de la création de l'université",
        )


@router.put(
    "/{universite_id}",
    response_model=Universite,
    summary="Modifier une université",
    description="Met à jour une université existante. Réservé aux administrateurs.",
)
def update_universite(
    universite_id: int,
    universite_in: UniversiteUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("referentiel", "update")),
):
    """
    Met à jour une université.
    
    - **universite_id**: ID de l'université à modifier
    """
    universite = universite_repository.get_by_id(db, universite_id)
    if not universite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Université non trouvée",
        )
    
    if universite_in.code and universite_in.code != universite.code:
        if universite_repository.code_exists(db, universite_in.code, exclude_id=universite_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Le code '{universite_in.code}' existe déjà",
            )
    
    old_snapshot = fields_snapshot(universite, *_UNIVERSITE_FIELDS)
    try:
        updated = universite_repository.update(db, universite_id, universite_in)
        audit_and_commit(
            db,
            request=request,
            user=current_user,
            action="update",
            entity_type="universite",
            entity_id=universite_id,
            old_values=old_snapshot,
            new_values=fields_snapshot(updated, *_UNIVERSITE_FIELDS),
        )
        return updated
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Erreur lors de la mise à jour de l'université",
        )


@router.delete(
    "/{universite_id}",
    response_model=dict,
    summary="Supprimer une université",
    description="Supprime une université (suppression logique). Réservé aux administrateurs.",
)
def delete_universite(
    universite_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("referentiel", "delete")),
):
    """
    Supprime une université (suppression logique).
    
    - **universite_id**: ID de l'université à supprimer
    """
    universite = universite_repository.get_by_id(db, universite_id)
    if not universite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Université non trouvée",
        )
    old_snapshot = fields_snapshot(universite, *_UNIVERSITE_FIELDS)
    if not universite_repository.delete(db, universite_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Université non trouvée",
        )
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="delete",
        entity_type="universite",
        entity_id=universite_id,
        old_values=old_snapshot,
    )
    return {"message": "Université supprimée avec succès"}


@router.get(
    "/{universite_id}/etablissements",
    response_model=list[Etablissement],
    summary="Établissements d'une université",
    description="Liste les établissements appartenant à une université.",
)
def get_universite_etablissements(
    universite_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Liste les établissements d'une université.
    
    - **universite_id**: ID de l'université
    """
    universite = universite_repository.get_by_id(db, universite_id)
    if not universite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Université non trouvée",
        )
    return etablissement_repository.get_by_universite(db, universite_id, skip=skip, limit=limit)
