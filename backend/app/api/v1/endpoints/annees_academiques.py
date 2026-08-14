"""
Endpoints API pour la gestion des années académiques
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user, get_current_superuser
from app.models.user import User
from app.repositories.annee_academique_repository import annee_academique_repository
from app.schemas.annee_academique import (
    AnneeAcademique,
    AnneeAcademiqueCreate,
    AnneeAcademiqueUpdate,
)

router = APIRouter(prefix="/annees-academiques", tags=["Années Académiques"])


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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """Crée une nouvelle année académique."""
    # Vérifier si le code existe déjà
    existing = annee_academique_repository.get_by_code(db, annee_in.code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Une année académique avec ce code existe déjà"
        )
    return annee_academique_repository.create(db, annee_in)


@router.put("/{annee_id}", response_model=AnneeAcademique)
def update_annee_academique(
    annee_id: int,
    annee_in: AnneeAcademiqueUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """Met à jour une année académique."""
    annee = annee_academique_repository.update(db, annee_id, annee_in)
    if not annee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Année académique non trouvée"
        )
    return annee


@router.patch("/{annee_id}/set-current", response_model=AnneeAcademique)
def set_annee_as_current(
    annee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """Définit une année académique comme année en cours."""
    annee = annee_academique_repository.set_as_current(db, annee_id)
    if not annee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Année académique non trouvée"
        )
    return annee


@router.patch("/{annee_id}/set-active", response_model=AnneeAcademique)
def set_annee_as_active(
    annee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """Définit une année académique comme active pour les inscriptions."""
    annee = annee_academique_repository.set_as_active(db, annee_id)
    if not annee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Année académique non trouvée"
        )
    return annee


@router.delete("/{annee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_annee_academique(
    annee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """Supprime une année académique."""
    success = annee_academique_repository.delete(db, annee_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Année académique non trouvée"
        )
    return None
