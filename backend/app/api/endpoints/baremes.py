from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_active_user
from app.utils.rbac_resolver import require_permission
from app.models.user import User
from app.utils.administration_events import audit_and_commit
from app.utils.audit_snapshots import fields_snapshot
from app.schemas.bareme_notation import (
    BaremeNotationCreate,
    BaremeNotationUpdate,
    BaremeNotationResponse,
    BaremeNotationWithMentions,
    MentionNotationCreate,
    MentionNotationUpdate,
    MentionNotationResponse
)
from app.repositories.bareme_notation_repository import bareme_notation_repository
from app.scripts.init_baremes import init_baremes

router = APIRouter()

_BAREME_FIELDS = ("code", "libelle", "note_min", "note_max", "est_systeme_defaut", "is_active")
_MENTION_FIELDS = ("code", "libelle", "note_min", "note_max", "couleur", "is_active")


@router.get("/", response_model=List[BaremeNotationResponse])
def get_all_baremes(
    etablissement_id: Optional[int] = None,
    cycle_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Récupère tous les barèmes de notation"""
    return bareme_notation_repository.get_all(db, etablissement_id, cycle_id)


@router.get("/defaut", response_model=BaremeNotationWithMentions)
def get_bareme_defaut(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Récupère le barème par défaut avec ses mentions"""
    bareme = bareme_notation_repository.get_defaut(db)
    if not bareme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucun barème par défaut configuré"
        )
    return bareme_notation_repository.get_with_mentions(db, bareme.id)


@router.get("/{bareme_id}", response_model=BaremeNotationWithMentions)
def get_bareme_by_id(
    bareme_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Récupère un barème avec ses mentions"""
    bareme = bareme_notation_repository.get_with_mentions(db, bareme_id)
    if not bareme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Barème non trouvé"
        )
    return bareme


@router.get("/{bareme_id}/mention/{note}")
def get_mention_for_note(
    bareme_id: int,
    note: float,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Détermine la mention pour une note donnée"""
    mention = bareme_notation_repository.determiner_mention(db, bareme_id, note)
    if not mention:
        return {"note": note, "mention": None, "message": "Aucune mention trouvée pour cette note"}
    return {
        "note": note,
        "mention": {
            "code": mention.code,
            "libelle": mention.libelle,
            "couleur": mention.couleur
        }
    }


@router.post("/", response_model=BaremeNotationResponse, status_code=status.HTTP_201_CREATED)
def create_bareme(
    bareme_in: BaremeNotationCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("parametrage", "create")),
):
    """Crée un nouveau barème de notation (superuser uniquement)."""
    existing = bareme_notation_repository.get_by_code(db, bareme_in.code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Un barème avec le code '{bareme_in.code}' existe déjà"
        )

    bareme = bareme_notation_repository.create(db, bareme_in)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="create",
        entity_type="bareme",
        entity_id=bareme.id,
        new_values=fields_snapshot(bareme, *_BAREME_FIELDS),
    )
    return bareme


@router.put("/{bareme_id}", response_model=BaremeNotationResponse)
def update_bareme(
    bareme_id: int,
    bareme_in: BaremeNotationUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("parametrage", "update")),
):
    """Met à jour un barème de notation (superuser uniquement)."""
    bareme = bareme_notation_repository.get_by_id(db, bareme_id)
    if not bareme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Barème non trouvé"
        )

    old_snapshot = fields_snapshot(bareme, *_BAREME_FIELDS)
    updated = bareme_notation_repository.update(db, bareme, bareme_in)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="update",
        entity_type="bareme",
        entity_id=bareme_id,
        old_values=old_snapshot,
        new_values=fields_snapshot(updated, *_BAREME_FIELDS),
    )
    return updated


@router.delete("/{bareme_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bareme(
    bareme_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("parametrage", "delete")),
):
    """Supprime un barème de notation (superuser uniquement)."""
    bareme = bareme_notation_repository.get_by_id(db, bareme_id)
    if not bareme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Barème non trouvé"
        )
    old_snapshot = fields_snapshot(bareme, *_BAREME_FIELDS)
    bareme_notation_repository.delete(db, bareme_id)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="delete",
        entity_type="bareme",
        entity_id=bareme_id,
        old_values=old_snapshot,
    )


# Endpoints pour les mentions
@router.post("/{bareme_id}/mentions", response_model=MentionNotationResponse, status_code=status.HTTP_201_CREATED)
def create_mention(
    bareme_id: int,
    mention_in: MentionNotationCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("parametrage", "create")),
):
    """Ajoute une mention à un barème (superuser uniquement)."""
    bareme = bareme_notation_repository.get_by_id(db, bareme_id)
    if not bareme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Barème non trouvé"
        )

    mention_in.bareme_id = bareme_id
    mention = bareme_notation_repository.create_mention(db, mention_in)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="create",
        entity_type="mention",
        entity_id=mention.id,
        new_values=fields_snapshot(mention, *_MENTION_FIELDS),
        details=f"bareme_id={bareme_id}",
    )
    return mention


@router.put("/mentions/{mention_id}", response_model=MentionNotationResponse)
def update_mention(
    mention_id: int,
    mention_in: MentionNotationUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("parametrage", "update")),
):
    """Met à jour une mention (superuser uniquement)."""
    mention = bareme_notation_repository.get_mention_by_id(db, mention_id)
    if not mention:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mention non trouvée"
        )

    old_snapshot = fields_snapshot(mention, *_MENTION_FIELDS)
    updated = bareme_notation_repository.update_mention(db, mention, mention_in)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="update",
        entity_type="mention",
        entity_id=mention_id,
        old_values=old_snapshot,
        new_values=fields_snapshot(updated, *_MENTION_FIELDS),
    )
    return updated


@router.delete("/mentions/{mention_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_mention(
    mention_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("parametrage", "delete")),
):
    """Supprime une mention (superuser uniquement)."""
    mention = bareme_notation_repository.get_mention_by_id(db, mention_id)
    if not mention:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mention non trouvée"
        )
    old_snapshot = fields_snapshot(mention, *_MENTION_FIELDS)
    bareme_notation_repository.delete_mention(db, mention_id)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="delete",
        entity_type="mention",
        entity_id=mention_id,
        old_values=old_snapshot,
    )


@router.post("/initialiser")
def initialiser_baremes(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("parametrage", "create")),
):
    """Initialise les barèmes par défaut (superuser uniquement)."""
    count = init_baremes(db)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="create",
        entity_type="bareme",
        entity_id="initialiser",
        new_values={"baremes_crees": count},
        details="initialiser",
    )
    return {"message": "Barèmes initialisés", "baremes_crees": count}
