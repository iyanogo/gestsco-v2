"""
Endpoints API pour la gestion des salles
"""
from datetime import date, time
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.utils.rbac_resolver import require_permission
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
from app.utils.administration_events import audit_and_commit
from app.utils.audit_snapshots import fields_snapshot

router = APIRouter(prefix="/salles", tags=["Salles"])

_SALLE_FIELDS = ("code", "libelle", "batiment_id", "type_salle", "capacite", "is_active")


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
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("edt", "create"))
):
    """Crée une nouvelle salle"""
    # Vérifier si le code existe déjà
    existing = salle_repository.get_by_code(db, salle_in.code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Une salle avec ce code existe déjà"
        )
    salle = salle_repository.create(db, salle_in)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="create",
        entity_type="salle",
        entity_id=salle.id,
        new_values=fields_snapshot(salle, *_SALLE_FIELDS),
    )
    return salle


@router.put("/{salle_id}", response_model=Salle)
def update_salle(
    salle_id: int,
    salle_in: SalleUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("edt", "update"))
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
    
    old_snapshot = fields_snapshot(salle, *_SALLE_FIELDS)
    updated = salle_repository.update(db, salle_id, salle_in)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="update",
        entity_type="salle",
        entity_id=salle_id,
        old_values=old_snapshot,
        new_values=fields_snapshot(updated, *_SALLE_FIELDS),
    )
    return updated


@router.delete("/{salle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_salle(
    salle_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("edt", "delete"))
):
    """Supprime une salle"""
    salle = salle_repository.get_by_id(db, salle_id)
    if not salle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Salle non trouvée"
        )
    old_snapshot = fields_snapshot(salle, *_SALLE_FIELDS)
    salle_repository.delete(db, salle_id)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="delete",
        entity_type="salle",
        entity_id=salle_id,
        old_values=old_snapshot,
    )
    return None
