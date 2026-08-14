from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_active_user
from app.models.user import User
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Crée un nouveau barème de notation"""
    existing = bareme_notation_repository.get_by_code(db, bareme_in.code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Un barème avec le code '{bareme_in.code}' existe déjà"
        )
    
    return bareme_notation_repository.create(db, bareme_in)


@router.put("/{bareme_id}", response_model=BaremeNotationResponse)
def update_bareme(
    bareme_id: int,
    bareme_in: BaremeNotationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Met à jour un barème de notation"""
    bareme = bareme_notation_repository.get_by_id(db, bareme_id)
    if not bareme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Barème non trouvé"
        )
    
    return bareme_notation_repository.update(db, bareme, bareme_in)


@router.delete("/{bareme_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bareme(
    bareme_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Supprime un barème de notation"""
    if not bareme_notation_repository.delete(db, bareme_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Barème non trouvé"
        )


# Endpoints pour les mentions
@router.post("/{bareme_id}/mentions", response_model=MentionNotationResponse, status_code=status.HTTP_201_CREATED)
def create_mention(
    bareme_id: int,
    mention_in: MentionNotationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Ajoute une mention à un barème"""
    bareme = bareme_notation_repository.get_by_id(db, bareme_id)
    if not bareme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Barème non trouvé"
        )
    
    mention_in.bareme_id = bareme_id
    return bareme_notation_repository.create_mention(db, mention_in)


@router.put("/mentions/{mention_id}", response_model=MentionNotationResponse)
def update_mention(
    mention_id: int,
    mention_in: MentionNotationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Met à jour une mention"""
    mention = bareme_notation_repository.get_mention_by_id(db, mention_id)
    if not mention:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mention non trouvée"
        )
    
    return bareme_notation_repository.update_mention(db, mention, mention_in)


@router.delete("/mentions/{mention_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_mention(
    mention_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Supprime une mention"""
    if not bareme_notation_repository.delete_mention(db, mention_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mention non trouvée"
        )


@router.post("/initialiser")
def initialiser_baremes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Initialise les barèmes par défaut"""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les super-utilisateurs peuvent initialiser les barèmes"
        )
    
    count = init_baremes(db)
    return {"message": "Barèmes initialisés", "baremes_crees": count}
