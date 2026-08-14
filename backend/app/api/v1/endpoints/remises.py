"""
Endpoints API pour la gestion des remises
"""

from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user
from app.core.permissions import get_current_scolarite_user
from app.models.user import User
from app.repositories.remise_repository import remise_repository
from app.schemas.remise import (
    Remise,
    RemiseCreate,
    RemiseUpdate,
)
from app.schemas.remise_etudiant import RemiseEtudiant, RemiseEtudiantCreate

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
    current_user: User = Depends(get_current_scolarite_user),
):
    """Liste les attributions d'une remise."""
    remise = remise_repository.get_by_id(db, remise_id)
    if not remise:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Remise non trouvée")
    return remise_repository.get_attributions(db, remise_id)


@router.post("/", response_model=Remise, status_code=status.HTTP_201_CREATED)
def create_remise(
    remise_in: RemiseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """Crée une nouvelle remise."""
    existing = remise_repository.get_by_code(db, remise_in.code)
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Code déjà utilisé")
    return remise_repository.create(db, remise_in)


@router.post("/appliquer", response_model=RemiseEtudiant, status_code=status.HTTP_201_CREATED)
def appliquer_remise(
    data: RemiseEtudiantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """Applique une remise à un étudiant."""
    result = remise_repository.appliquer_remise(
        db, data.remise_id, data.etudiant_id, data.facture_id,
        data.annee_academique_id, current_user.id
    )
    if not result:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Impossible d'appliquer la remise")
    return result


@router.put("/{remise_id}", response_model=Remise)
def update_remise(
    remise_id: int,
    remise_in: RemiseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """Met à jour une remise."""
    remise = remise_repository.get_by_id(db, remise_id)
    if not remise:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Remise non trouvée")
    if remise_in.code and remise_in.code != remise.code:
        existing = remise_repository.get_by_code(db, remise_in.code)
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Code déjà utilisé")
    return remise_repository.update(db, remise_id, remise_in)


@router.delete("/{remise_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_remise(
    remise_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """Supprime une remise."""
    remise = remise_repository.get_by_id(db, remise_id)
    if not remise:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Remise non trouvée")
    remise_repository.delete(db, remise_id)
    return None
