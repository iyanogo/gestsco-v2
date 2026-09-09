"""
Endpoints API pour la gestion des années académiques
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user
from app.utils.rbac_resolver import require_permission
from app.models.user import User
from app.repositories.annee_academique_repository import annee_academique_repository
from app.schemas.annee_academique import (
    AnneeAcademique,
    AnneeAcademiqueCreate,
    AnneeAcademiqueUpdate,
)
from app.utils.administration_events import audit_and_commit
from app.utils.audit_snapshots import fields_snapshot

router = APIRouter(prefix="/annees-academiques", tags=["Années Académiques"])

_ANNEE_ACADEMIQUE_FIELDS = ("code", "libelle", "is_active", "is_current")


@router.get("/", response_model=list[AnneeAcademique])
def list_annees_academiques(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Liste toutes les années académiques."""
    return annee_academique_repository.get_all(db, skip=skip, limit=limit, include_inactive=True)


@router.get("/current", response_model=AnneeAcademique | None)
def get_current_annee(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Récupère l'année académique en cours."""
    return annee_academique_repository.get_current(db)


@router.get("/active", response_model=AnneeAcademique | None)
def get_active_annee(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Récupère l'année académique active pour les inscriptions."""
    return annee_academique_repository.get_active(db)


@router.get("/{annee_id}", response_model=AnneeAcademique)
def get_annee_academique(
    annee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Récupère une année académique par son ID."""
    annee = annee_academique_repository.get_by_id(db, annee_id)
    if not annee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Année académique non trouvée"
        )
    return annee


@router.post("/", response_model=AnneeAcademique, status_code=status.HTTP_201_CREATED)
def create_annee_academique(
    annee_in: AnneeAcademiqueCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("referentiel", "create")),
):
    """Crée une nouvelle année académique."""
    # Vérifier si le code existe déjà
    existing = annee_academique_repository.get_by_code(db, annee_in.code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Une année académique avec ce code existe déjà"
        )
    annee = annee_academique_repository.create(db, annee_in)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="create",
        entity_type="annee_academique",
        entity_id=annee.id,
        new_values=fields_snapshot(annee, *_ANNEE_ACADEMIQUE_FIELDS),
    )
    return annee


@router.put("/{annee_id}", response_model=AnneeAcademique)
def update_annee_academique(
    annee_id: int,
    annee_in: AnneeAcademiqueUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("referentiel", "update")),
):
    """Met à jour une année académique."""
    existing = annee_academique_repository.get_by_id(db, annee_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Année académique non trouvée"
        )
    old_snapshot = fields_snapshot(existing, *_ANNEE_ACADEMIQUE_FIELDS)
    annee = annee_academique_repository.update(db, annee_id, annee_in)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="update",
        entity_type="annee_academique",
        entity_id=annee_id,
        old_values=old_snapshot,
        new_values=fields_snapshot(annee, *_ANNEE_ACADEMIQUE_FIELDS),
    )
    return annee


@router.patch("/{annee_id}/set-current", response_model=AnneeAcademique)
def set_annee_as_current(
    annee_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("referentiel", "update")),
):
    """Définit une année académique comme année en cours."""
    existing = annee_academique_repository.get_by_id(db, annee_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Année académique non trouvée"
        )
    old_snapshot = fields_snapshot(existing, *_ANNEE_ACADEMIQUE_FIELDS)
    annee = annee_academique_repository.set_as_current(db, annee_id)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="update",
        entity_type="annee_academique",
        entity_id=annee_id,
        old_values=old_snapshot,
        new_values=fields_snapshot(annee, *_ANNEE_ACADEMIQUE_FIELDS),
        details="set_current",
    )
    return annee


@router.patch("/{annee_id}/set-active", response_model=AnneeAcademique)
def set_annee_as_active(
    annee_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("referentiel", "update")),
):
    """Définit une année académique comme active pour les inscriptions."""
    existing = annee_academique_repository.get_by_id(db, annee_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Année académique non trouvée"
        )
    old_snapshot = fields_snapshot(existing, *_ANNEE_ACADEMIQUE_FIELDS)
    annee = annee_academique_repository.set_as_active(db, annee_id)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="update",
        entity_type="annee_academique",
        entity_id=annee_id,
        old_values=old_snapshot,
        new_values=fields_snapshot(annee, *_ANNEE_ACADEMIQUE_FIELDS),
        details="set_active",
    )
    return annee


@router.delete("/{annee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_annee_academique(
    annee_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("referentiel", "delete")),
):
    """Supprime une année académique."""
    existing = annee_academique_repository.get_by_id(db, annee_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Année académique non trouvée"
        )
    old_snapshot = fields_snapshot(existing, *_ANNEE_ACADEMIQUE_FIELDS)
    success = annee_academique_repository.delete(db, annee_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Année académique non trouvée"
        )
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="delete",
        entity_type="annee_academique",
        entity_id=annee_id,
        old_values=old_snapshot,
    )
    return None
