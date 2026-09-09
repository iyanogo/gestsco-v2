"""
Endpoints API pour la gestion des remises
"""

from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user
from app.utils.rbac_resolver import require_permission
from app.models.user import User
from app.repositories.remise_repository import remise_repository
from app.schemas.remise import (
    Remise,
    RemiseCreate,
    RemiseUpdate,
)
from app.schemas.remise_etudiant import RemiseEtudiant, RemiseEtudiantCreate
from app.utils.administration_events import audit_and_commit
from app.utils.audit_snapshots import remise_snapshot

router = APIRouter()


@router.get("/", response_model=list[Remise])
def get_remises(
    skip: int = 0,
    limit: int = 100,
    is_active: bool = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Liste toutes les remises."""
    if is_active is not None:
        return remise_repository.get_all(db, skip=skip, limit=limit, include_inactive=not is_active)
    return remise_repository.get_all(db, skip=skip, limit=limit, include_inactive=True)


@router.get("/valides", response_model=list[Remise])
def get_remises_valides(
    date_reference: date = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Liste les remises valides à une date donnée."""
    return remise_repository.get_valides(db, date_reference)


@router.get("/disponibles", response_model=list[Remise])
def get_remises_disponibles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Liste les remises disponibles (non épuisées)."""
    return remise_repository.get_disponibles(db)


@router.get("/{remise_id}", response_model=Remise)
def get_remise(
    remise_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Récupère une remise par son ID."""
    remise = remise_repository.get_by_id(db, remise_id)
    if not remise:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Remise non trouvée")
    return remise


@router.get("/{remise_id}/attributions", response_model=list[RemiseEtudiant])
def get_attributions_remise(
    remise_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("finances", "read")),
):
    """Liste les attributions d'une remise."""
    remise = remise_repository.get_by_id(db, remise_id)
    if not remise:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Remise non trouvée")
    return remise_repository.get_attributions(db, remise_id)


@router.post("/", response_model=Remise, status_code=status.HTTP_201_CREATED)
def create_remise(
    remise_in: RemiseCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("finances", "create")),
):
    """Crée une nouvelle remise."""
    existing = remise_repository.get_by_code(db, remise_in.code)
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Code déjà utilisé")
    remise = remise_repository.create(db, remise_in)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="create",
        entity_type="remise",
        entity_id=remise.id,
        new_values=remise_snapshot(remise),
    )
    return remise


@router.post("/appliquer", response_model=RemiseEtudiant, status_code=status.HTTP_201_CREATED)
def appliquer_remise(
    data: RemiseEtudiantCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("finances", "create")),
):
    """Applique une remise à un étudiant."""
    result = remise_repository.appliquer_remise(
        db, data.remise_id, data.etudiant_id, data.facture_id,
        data.annee_academique_id, current_user.id
    )
    if not result:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Impossible d'appliquer la remise")
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="apply",
        entity_type="remise",
        entity_id=data.remise_id,
        new_values={
            "remise_id": data.remise_id,
            "etudiant_id": data.etudiant_id,
            "facture_id": data.facture_id,
            "attribution_id": result.id,
        },
    )
    return result


@router.put("/{remise_id}", response_model=Remise)
def update_remise(
    remise_id: int,
    remise_in: RemiseUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("finances", "update")),
):
    """Met à jour une remise."""
    remise = remise_repository.get_by_id(db, remise_id)
    if not remise:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Remise non trouvée")
    if remise_in.code and remise_in.code != remise.code:
        existing = remise_repository.get_by_code(db, remise_in.code)
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Code déjà utilisé")
    old_snapshot = remise_snapshot(remise)
    updated = remise_repository.update(db, remise_id, remise_in)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="update",
        entity_type="remise",
        entity_id=remise_id,
        old_values=old_snapshot,
        new_values=remise_snapshot(updated),
    )
    return updated


@router.delete("/{remise_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_remise(
    remise_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("finances", "delete")),
):
    """Supprime une remise."""
    remise = remise_repository.get_by_id(db, remise_id)
    if not remise:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Remise non trouvée")
    old_snapshot = remise_snapshot(remise)
    remise_repository.delete(db, remise_id)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="delete",
        entity_type="remise",
        entity_id=remise_id,
        old_values=old_snapshot,
    )
    return None
