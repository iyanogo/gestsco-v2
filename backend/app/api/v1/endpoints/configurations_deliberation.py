"""
Endpoints API pour les configurations de délibération.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.utils.rbac_resolver import require_permission
from app.models.user import User
from app.utils.administration_events import audit_and_commit
from app.utils.audit_snapshots import fields_snapshot
from app.repositories.configuration_deliberation_repository import (
    configuration_deliberation_repository,
)
from app.schemas.configuration_deliberation import (
    ConfigurationDeliberation,
    ConfigurationDeliberationCreate,
    ConfigurationDeliberationUpdate,
)

router = APIRouter()

_CONFIG_DELIB_FIELDS = (
    "annee_academique_id", "niveau_id", "periodicite", "compensation_semestres",
    "moyenne_validation", "moyenne_passage_conditionnel", "autoriser_rattrapage",
)


@router.get("/", response_model=list[ConfigurationDeliberation])
def list_configurations(
    annee_academique_id: Optional[int] = Query(None),
    niveau_id: Optional[int] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("evaluations_deliberations", "read")),
):
    """Liste les configurations de délibération."""
    if annee_academique_id is not None:
        return configuration_deliberation_repository.get_by_annee(
            db, annee_academique_id, niveau_id
        )
    return configuration_deliberation_repository.get_all(db, skip=skip, limit=limit)


@router.get("/{config_id}", response_model=ConfigurationDeliberation)
def get_configuration(
    config_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("evaluations_deliberations", "read")),
):
    """Récupère une configuration par ID."""
    config = configuration_deliberation_repository.get_by_id(db, config_id)
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuration de délibération introuvable",
        )
    return config


@router.post("/", response_model=ConfigurationDeliberation, status_code=status.HTTP_201_CREATED)
def create_or_update_configuration(
    config_in: ConfigurationDeliberationCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("parametrage", "update")),
):
    """Crée ou met à jour une configuration (upsert par année + niveau)."""
    existing = configuration_deliberation_repository.find_by_annee_niveau(
        db, config_in.annee_academique_id, config_in.niveau_id
    )
    if existing:
        old_snapshot = fields_snapshot(existing, *_CONFIG_DELIB_FIELDS)
        updated = configuration_deliberation_repository.update(
            db,
            existing.id,
            ConfigurationDeliberationUpdate(**config_in.model_dump()),
        )
        audit_and_commit(
            db,
            request=request,
            user=current_user,
            action="update",
            entity_type="configuration_deliberation",
            entity_id=existing.id,
            old_values=old_snapshot,
            new_values=fields_snapshot(updated, *_CONFIG_DELIB_FIELDS),
        )
        return updated
    created = configuration_deliberation_repository.create(db, config_in)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="create",
        entity_type="configuration_deliberation",
        entity_id=created.id,
        new_values=fields_snapshot(created, *_CONFIG_DELIB_FIELDS),
    )
    return created


@router.put("/{config_id}", response_model=ConfigurationDeliberation)
def update_configuration(
    config_id: int,
    config_in: ConfigurationDeliberationUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("parametrage", "update")),
):
    """Met à jour une configuration existante."""
    config = configuration_deliberation_repository.get_by_id(db, config_id)
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuration de délibération introuvable",
        )
    old_snapshot = fields_snapshot(config, *_CONFIG_DELIB_FIELDS)
    updated = configuration_deliberation_repository.update(db, config_id, config_in)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="update",
        entity_type="configuration_deliberation",
        entity_id=config_id,
        old_values=old_snapshot,
        new_values=fields_snapshot(updated, *_CONFIG_DELIB_FIELDS),
    )
    return updated


@router.delete("/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_configuration(
    config_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("parametrage", "delete")),
):
    """Supprime une configuration."""
    config = configuration_deliberation_repository.get_by_id(db, config_id)
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuration de délibération introuvable",
        )
    old_snapshot = fields_snapshot(config, *_CONFIG_DELIB_FIELDS)
    configuration_deliberation_repository.delete(db, config_id)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="delete",
        entity_type="configuration_deliberation",
        entity_id=config_id,
        old_values=old_snapshot,
    )
