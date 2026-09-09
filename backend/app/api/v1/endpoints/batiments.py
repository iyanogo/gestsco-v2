"""
Endpoints API pour la gestion des bâtiments
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.utils.rbac_resolver import require_permission
from app.models.user import User
from app.repositories.batiment_repository import batiment_repository
from app.schemas.batiment import (
    Batiment,
    BatimentCreate,
    BatimentUpdate,
    BatimentWithEtablissement,
)
from app.utils.administration_events import audit_and_commit
from app.utils.audit_snapshots import fields_snapshot

router = APIRouter(prefix="/batiments", tags=["Bâtiments"])

_BATIMENT_FIELDS = ("code", "libelle", "etablissement_id", "nombre_etages", "is_active")


@router.get("/", response_model=List[Batiment])
def get_batiments(
    skip: int = 0,
    limit: int = 100,
    etablissement_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Liste tous les bâtiments"""
    if etablissement_id:
        return batiment_repository.get_by_etablissement(db, etablissement_id)
    return batiment_repository.get_all(db, skip=skip, limit=limit)


@router.get("/{batiment_id}", response_model=Batiment)
def get_batiment(
    batiment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Récupère un bâtiment par ID"""
    batiment = batiment_repository.get_by_id(db, batiment_id)
    if not batiment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bâtiment non trouvé"
        )
    return batiment


@router.post("/", response_model=Batiment, status_code=status.HTTP_201_CREATED)
def create_batiment(
    batiment_in: BatimentCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("edt", "create"))
):
    """Crée un nouveau bâtiment"""
    # Vérifier si le code existe déjà
    existing = batiment_repository.get_by_code(db, batiment_in.code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un bâtiment avec ce code existe déjà"
        )
    batiment = batiment_repository.create(db, batiment_in)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="create",
        entity_type="batiment",
        entity_id=batiment.id,
        new_values=fields_snapshot(batiment, *_BATIMENT_FIELDS),
    )
    return batiment


@router.put("/{batiment_id}", response_model=Batiment)
def update_batiment(
    batiment_id: int,
    batiment_in: BatimentUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("edt", "update"))
):
    """Met à jour un bâtiment"""
    batiment = batiment_repository.get_by_id(db, batiment_id)
    if not batiment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bâtiment non trouvé"
        )
    
    # Vérifier unicité du code si modifié
    if batiment_in.code and batiment_in.code != batiment.code:
        existing = batiment_repository.get_by_code(db, batiment_in.code)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Un bâtiment avec ce code existe déjà"
            )
    
    old_snapshot = fields_snapshot(batiment, *_BATIMENT_FIELDS)
    updated = batiment_repository.update(db, batiment_id, batiment_in)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="update",
        entity_type="batiment",
        entity_id=batiment_id,
        old_values=old_snapshot,
        new_values=fields_snapshot(updated, *_BATIMENT_FIELDS),
    )
    return updated


@router.delete("/{batiment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_batiment(
    batiment_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("edt", "delete"))
):
    """Supprime un bâtiment"""
    batiment = batiment_repository.get_by_id(db, batiment_id)
    if not batiment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bâtiment non trouvé"
        )
    old_snapshot = fields_snapshot(batiment, *_BATIMENT_FIELDS)
    batiment_repository.delete(db, batiment_id)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="delete",
        entity_type="batiment",
        entity_id=batiment_id,
        old_values=old_snapshot,
    )
    return None
