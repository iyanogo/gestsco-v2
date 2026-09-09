"""
Endpoints API pour la gestion des années scolaires.
"""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.api.deps import get_db, get_current_active_user
from app.utils.rbac_resolver import require_permission
from app.models.user import User
from app.repositories import annee_repository
from app.schemas.annee_scolaire import AnneeResponse, AnneeCreate, AnneeUpdate
from app.utils.administration_events import audit_and_commit
from app.utils.audit_snapshots import fields_snapshot

router = APIRouter(prefix="/annees-scolaires", tags=["Années Scolaires"])

_ANNEE_SCOLAIRE_FIELDS = ("code", "libelle", "statut", "etat")


@router.get(
    "/",
    response_model=list[AnneeResponse],
    summary="Liste des années scolaires",
    description="Récupère la liste de toutes les années scolaires.",
)
def get_annees_scolaires(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Récupère la liste des années scolaires triées par code décroissant."""
    return annee_repository.get_all_ordered(db)


@router.get(
    "/active",
    response_model=AnneeResponse,
    summary="Année scolaire active",
    description="Récupère l'année scolaire actuellement active (statut=true).",
)
def get_active_annee(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Récupère l'année scolaire active."""
    annee = annee_repository.get_active(db)
    if not annee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucune année scolaire active",
        )
    return annee


@router.get(
    "/{annee_id}",
    response_model=AnneeResponse,
    summary="Détails d'une année scolaire",
    description="Récupère les détails d'une année scolaire par son ID.",
)
def get_annee_scolaire(
    annee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Récupère une année scolaire par son ID."""
    annee = annee_repository.get_by_id(db, annee_id)
    if not annee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Année scolaire non trouvée",
        )
    return annee


@router.post(
    "/",
    response_model=AnneeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Créer une année scolaire",
    description="Crée une nouvelle année scolaire. Réservé aux administrateurs.",
)
def create_annee_scolaire(
    annee_in: AnneeCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("referentiel", "create")),
):
    """Crée une nouvelle année scolaire."""
    try:
        annee = annee_repository.create(db, annee_in)
        audit_and_commit(
            db,
            request=request,
            user=current_user,
            action="create",
            entity_type="annee_scolaire",
            entity_id=annee.id,
            new_values=fields_snapshot(annee, *_ANNEE_SCOLAIRE_FIELDS),
        )
        return annee
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Erreur lors de la création de l'année scolaire",
        )


@router.put(
    "/{annee_id}",
    response_model=AnneeResponse,
    summary="Modifier une année scolaire",
    description="Met à jour une année scolaire existante. Réservé aux administrateurs.",
)
def update_annee_scolaire(
    annee_id: int,
    annee_in: AnneeUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("referentiel", "update")),
):
    """Met à jour une année scolaire."""
    annee = annee_repository.get_by_id(db, annee_id)
    if not annee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Année scolaire non trouvée",
        )
    old_snapshot = fields_snapshot(annee, *_ANNEE_SCOLAIRE_FIELDS)
    try:
        updated = annee_repository.update(db, annee_id, annee_in)
        audit_and_commit(
            db,
            request=request,
            user=current_user,
            action="update",
            entity_type="annee_scolaire",
            entity_id=annee_id,
            old_values=old_snapshot,
            new_values=fields_snapshot(updated, *_ANNEE_SCOLAIRE_FIELDS),
        )
        return updated
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Erreur lors de la mise à jour de l'année scolaire",
        )


@router.put(
    "/{annee_id}/activate",
    response_model=AnneeResponse,
    summary="Activer une année scolaire",
    description="Définit une année scolaire comme active (désactive les autres). Réservé aux administrateurs.",
)
def activate_annee_scolaire(
    annee_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("referentiel", "update")),
):
    """Active une année scolaire et désactive les autres."""
    existing = annee_repository.get_by_id(db, annee_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Année scolaire non trouvée",
        )
    old_snapshot = fields_snapshot(existing, *_ANNEE_SCOLAIRE_FIELDS)
    annee = annee_repository.set_active(db, annee_id)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="update",
        entity_type="annee_scolaire",
        entity_id=annee_id,
        old_values=old_snapshot,
        new_values=fields_snapshot(annee, *_ANNEE_SCOLAIRE_FIELDS),
        details="activate",
    )
    return annee


@router.delete(
    "/{annee_id}",
    response_model=dict,
    summary="Supprimer une année scolaire",
    description="Supprime une année scolaire. Réservé aux administrateurs.",
)
def delete_annee_scolaire(
    annee_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("referentiel", "delete")),
):
    """Supprime une année scolaire."""
    annee = annee_repository.get_by_id(db, annee_id)
    if not annee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Année scolaire non trouvée",
        )
    old_snapshot = fields_snapshot(annee, *_ANNEE_SCOLAIRE_FIELDS)
    if not annee_repository.delete(db, annee_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Année scolaire non trouvée",
        )
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="delete",
        entity_type="annee_scolaire",
        entity_id=annee_id,
        old_values=old_snapshot,
    )
    return {"message": "Année scolaire supprimée avec succès"}
