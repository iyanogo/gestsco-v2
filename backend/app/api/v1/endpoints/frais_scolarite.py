"""
Endpoints API pour la gestion des frais de scolarité
"""

from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user
from app.core.permissions import get_current_scolarite_user
from app.models.user import User
from app.repositories.frais_scolarite_repository import frais_scolarite_repository
from app.schemas.frais_scolarite import (
    FraisScolarite,
    FraisScolariteCreate,
    FraisScolariteUpdate,
)

router = APIRouter()


@router.get("/", response_model=list[FraisScolarite])
def get_frais_scolarite(
    skip: int = 0,
    limit: int = 100,
    niveau_id: int = None,
    filiere_id: int = None,
    cycle_id: int = None,
    annee_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Liste tous les frais de scolarité avec filtres optionnels.
    """
    if niveau_id and filiere_id and annee_id:
        return frais_scolarite_repository.get_by_niveau_filiere(
            db, niveau_id, filiere_id, annee_id
        )
    if cycle_id and annee_id:
        return frais_scolarite_repository.get_by_cycle(db, cycle_id, annee_id)
    if annee_id:
        return frais_scolarite_repository.get_by_annee(db, annee_id)
    
    return frais_scolarite_repository.get_all(db, skip=skip, limit=limit)


@router.get("/niveau/{niveau_id}/filiere/{filiere_id}", response_model=list[FraisScolarite])
def get_frais_by_niveau_filiere(
    niveau_id: int,
    filiere_id: int,
    annee_id: int = Query(..., description="ID de l'année académique"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Liste les frais de scolarité pour un niveau et une filière.
    """
    return frais_scolarite_repository.get_by_niveau_filiere(
        db, niveau_id, filiere_id, annee_id
    )


@router.get("/valides", response_model=list[FraisScolarite])
def get_frais_valides(
    date_reference: date = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Liste les frais de scolarité valides à une date donnée.
    """
    return frais_scolarite_repository.get_valides(db, date_reference)


@router.get("/{frais_id}", response_model=FraisScolarite)
def get_frais(
    frais_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère un frais de scolarité par son ID.
    """
    frais = frais_scolarite_repository.get_by_id(db, frais_id)
    if not frais:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Frais de scolarité non trouvé"
        )
    return frais


@router.post("/", response_model=FraisScolarite, status_code=status.HTTP_201_CREATED)
def create_frais(
    frais_in: FraisScolariteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """
    Crée un nouveau frais de scolarité.
    
    Réservé au personnel de scolarité.
    """
    return frais_scolarite_repository.create(db, frais_in)


@router.put("/{frais_id}", response_model=FraisScolarite)
def update_frais(
    frais_id: int,
    frais_in: FraisScolariteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """
    Met à jour un frais de scolarité.
    
    Réservé au personnel de scolarité.
    """
    frais = frais_scolarite_repository.get_by_id(db, frais_id)
    if not frais:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Frais de scolarité non trouvé"
        )
    
    return frais_scolarite_repository.update(db, frais_id, frais_in)


@router.delete("/{frais_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_frais(
    frais_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """
    Supprime un frais de scolarité (désactivation logique).
    
    Réservé au personnel de scolarité.
    """
    frais = frais_scolarite_repository.get_by_id(db, frais_id)
    if not frais:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Frais de scolarité non trouvé"
        )
    
    frais_scolarite_repository.delete(db, frais_id)
    return None
