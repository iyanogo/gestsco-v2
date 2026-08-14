"""
Endpoints API pour la gestion des salles
"""
from datetime import date, time
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.core.permissions import get_current_scolarite_user
from app.models.user import User
from app.repositories.salle_repository import salle_repository
from app.repositories.seance_repository import seance_repository
from app.schemas.salle import (
    Salle,
    SalleCreate,
    SalleUpdate,
    SalleWithBatiment,
    SalleWithDisponibilite,
)

router = APIRouter(prefix="/salles", tags=["Salles"])


@router.get("/", response_model=List[Salle])
def get_salles(
    skip: int = 0,
    limit: int = 100,
    batiment_id: Optional[int] = None,
    type_salle: Optional[str] = None,
    capacite_min: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Liste toutes les salles"""
    if batiment_id:
        return salle_repository.get_by_batiment(db, batiment_id)
    if type_salle:
        return salle_repository.get_by_type(db, type_salle)
    if capacite_min:
        return salle_repository.get_by_capacite_min(db, capacite_min)
    return salle_repository.get_all(db, skip=skip, limit=limit)


@router.get("/disponibles", response_model=List[Salle])
def get_salles_disponibles(
    date_check: date = Query(..., alias="date"),
    heure_debut: time = Query(...),
    heure_fin: time = Query(...),
    capacite_min: Optional[int] = None,
    type_salle: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Liste les salles disponibles sur un créneau"""
    return salle_repository.get_disponibles(
        db, date_check, heure_debut, heure_fin, capacite_min, type_salle
    )


@router.get("/disponibilite")
def get_disponibilite_salles(
    date_check: date = Query(..., alias="date"),
    creneau_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Disponibilité des salles pour un créneau"""
    return salle_repository.get_with_disponibilite(db, date_check, creneau_id)


@router.get("/{salle_id}", response_model=Salle)
def get_salle(
    salle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Récupère une salle par ID"""
    salle = salle_repository.get_by_id(db, salle_id)
    if not salle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Salle non trouvée"
        )
    return salle


@router.get("/{salle_id}/occupation")
def get_occupation_salle(
    salle_id: int,
    date_debut: date = Query(...),
    date_fin: date = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Planning d'occupation d'une salle"""
    salle = salle_repository.get_by_id(db, salle_id)
    if not salle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Salle non trouvée"
        )
    
    seances = seance_repository.get_by_periode(db, date_debut, date_fin)
    seances_salle = [s for s in seances if s.salle_id == salle_id]
    
    return {
        "salle": salle,
        "seances": seances_salle
    }


@router.post("/", response_model=Salle, status_code=status.HTTP_201_CREATED)
def create_salle(
    salle_in: SalleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user)
):
    """Crée une nouvelle salle"""
    # Vérifier si le code existe déjà
    existing = salle_repository.get_by_code(db, salle_in.code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Une salle avec ce code existe déjà"
        )
    return salle_repository.create(db, salle_in)


@router.put("/{salle_id}", response_model=Salle)
def update_salle(
    salle_id: int,
    salle_in: SalleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user)
):
    """Met à jour une salle"""
    salle = salle_repository.get_by_id(db, salle_id)
    if not salle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Salle non trouvée"
        )
    
    # Vérifier unicité du code si modifié
    if salle_in.code and salle_in.code != salle.code:
        existing = salle_repository.get_by_code(db, salle_in.code)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Une salle avec ce code existe déjà"
            )
    
    return salle_repository.update(db, salle_id, salle_in)


@router.delete("/{salle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_salle(
    salle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user)
):
    """Supprime une salle"""
    salle = salle_repository.get_by_id(db, salle_id)
    if not salle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Salle non trouvée"
        )
    salle_repository.delete(db, salle_id)
    return None
