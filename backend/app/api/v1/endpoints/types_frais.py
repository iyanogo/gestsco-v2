"""
Endpoints API pour la gestion des types de frais
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user
from app.utils.rbac_resolver import require_permission
from app.models.user import User
from app.repositories.type_frais_repository import type_frais_repository
from app.schemas.type_frais import (
    TypeFrais,
    TypeFraisCreate,
    TypeFraisUpdate,
)
from app.utils.administration_events import audit_and_commit
from app.utils.audit_snapshots import fields_snapshot

router = APIRouter()

_TYPE_FRAIS_FIELDS = ("code", "libelle", "categorie", "montant_defaut", "est_obligatoire", "is_active")


@router.get("/", response_model=list[TypeFrais])
def get_types_frais(
    skip: int = 0,
    limit: int = 100,
    categorie: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Liste tous les types de frais.
    
    - **skip**: Nombre d'éléments à ignorer
    - **limit**: Nombre maximum d'éléments à retourner
    - **categorie**: Filtrer par catégorie (optionnel)
    """
    if categorie:
        return type_frais_repository.get_by_categorie(db, categorie)
    return type_frais_repository.get_all(db, skip=skip, limit=limit)


@router.get("/obligatoires", response_model=list[TypeFrais])
def get_types_frais_obligatoires(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Liste les types de frais obligatoires.
    """
    return type_frais_repository.get_obligatoires(db)


@router.get("/recurrents", response_model=list[TypeFrais])
def get_types_frais_recurrents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Liste les types de frais récurrents.
    """
    return type_frais_repository.get_recurrents(db)


@router.get("/{type_frais_id}", response_model=TypeFrais)
def get_type_frais(
    type_frais_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère un type de frais par son ID.
    """
    type_frais = type_frais_repository.get_by_id(db, type_frais_id)
    if not type_frais:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Type de frais non trouvé"
        )
    return type_frais


@router.post("/", response_model=TypeFrais, status_code=status.HTTP_201_CREATED)
def create_type_frais(
    type_frais_in: TypeFraisCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("finances", "create")),
):
    """
    Crée un nouveau type de frais.
    
    Réservé aux superutilisateurs.
    """
    # Vérifier si le code existe déjà
    existing = type_frais_repository.get_by_code(db, type_frais_in.code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un type de frais avec ce code existe déjà"
        )
    
    type_frais = type_frais_repository.create(db, type_frais_in)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="create",
        entity_type="type_frais",
        entity_id=type_frais.id,
        new_values=fields_snapshot(type_frais, *_TYPE_FRAIS_FIELDS),
    )
    return type_frais


@router.put("/{type_frais_id}", response_model=TypeFrais)
def update_type_frais(
    type_frais_id: int,
    type_frais_in: TypeFraisUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("finances", "update")),
):
    """
    Met à jour un type de frais.
    
    Réservé aux superutilisateurs.
    """
    type_frais = type_frais_repository.get_by_id(db, type_frais_id)
    if not type_frais:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Type de frais non trouvé"
        )
    
    # Vérifier l'unicité du code si modifié
    if type_frais_in.code and type_frais_in.code != type_frais.code:
        existing = type_frais_repository.get_by_code(db, type_frais_in.code)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Un type de frais avec ce code existe déjà"
            )
    
    old_snapshot = fields_snapshot(type_frais, *_TYPE_FRAIS_FIELDS)
    updated = type_frais_repository.update(db, type_frais_id, type_frais_in)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="update",
        entity_type="type_frais",
        entity_id=type_frais_id,
        old_values=old_snapshot,
        new_values=fields_snapshot(updated, *_TYPE_FRAIS_FIELDS),
    )
    return updated


@router.delete("/{type_frais_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_type_frais(
    type_frais_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("finances", "delete")),
):
    """
    Supprime un type de frais (désactivation logique).
    
    Réservé aux superutilisateurs.
    """
    type_frais = type_frais_repository.get_by_id(db, type_frais_id)
    if not type_frais:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Type de frais non trouvé"
        )
    
    old_snapshot = fields_snapshot(type_frais, *_TYPE_FRAIS_FIELDS)
    type_frais_repository.delete(db, type_frais_id)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="delete",
        entity_type="type_frais",
        entity_id=type_frais_id,
        old_values=old_snapshot,
    )
    return None
