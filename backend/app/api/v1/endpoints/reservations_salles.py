"""
Endpoints API pour la gestion des réservations de salles
"""
from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.core.permissions import is_scolarite_portal_user
from app.models.user import User
from app.repositories.reservation_salle_repository import reservation_salle_repository
from app.utils.reservation_access import assert_can_modify_reservation, assert_can_read_reservation
from app.utils.administration_events import audit_and_commit
from app.utils.audit_snapshots import fields_snapshot
from app.utils.rbac_resolver import require_permission

_RESERVATION_FIELDS = ("salle_id", "demandeur_id", "date_reservation", "statut", "motif")
from app.schemas.reservation_salle import (
    ReservationSalle,
    ReservationSalleCreate,
    ReservationSalleUpdate,
    ReservationSalleWithDetails,
)

router = APIRouter(prefix="/reservations-salles", tags=["Réservations de Salles"])


class RefuserReservationRequest(BaseModel):
    motif_refus: str


@router.get("/", response_model=List[ReservationSalle])
def get_reservations(
    skip: int = 0,
    limit: int = 100,
    salle_id: Optional[int] = None,
    date_reservation: Optional[date] = Query(None, alias="date"),
    statut: Optional[str] = None,
    demandeur_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Liste toutes les réservations"""
    if not is_scolarite_portal_user(current_user):
        if demandeur_id is not None and demandeur_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accès refusé : vous ne pouvez consulter que vos propres réservations",
            )
        demandeur_id = current_user.id

    if salle_id:
        return reservation_salle_repository.get_by_salle(db, salle_id, date_reservation)
    
    if demandeur_id:
        return reservation_salle_repository.get_by_demandeur(db, demandeur_id, statut)

    if statut:
        return reservation_salle_repository.get_by_statut(db, statut, skip, limit)

    return reservation_salle_repository.get_all(db, skip=skip, limit=limit)


@router.get("/mes-reservations", response_model=List[ReservationSalle])
def get_mes_reservations(
    statut: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Réservations de l'utilisateur connecté"""
    return reservation_salle_repository.get_by_demandeur(db, current_user.id, statut)


@router.get("/en-attente", response_model=List[ReservationSalle])
def get_reservations_en_attente(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("edt", "validate"))
):
    """Réservations en attente d'approbation"""
    return reservation_salle_repository.get_en_attente(db)


@router.get("/{reservation_id}", response_model=ReservationSalle)
def get_reservation(
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Récupère une réservation par ID"""
    reservation = reservation_salle_repository.get_by_id(db, reservation_id)
    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Réservation non trouvée"
        )
    assert_can_read_reservation(current_user, reservation)
    return reservation


@router.post("/", response_model=ReservationSalle, status_code=status.HTTP_201_CREATED)
def create_reservation(
    reservation_in: ReservationSalleCreate,
    http_request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Crée une nouvelle réservation"""
    result = reservation_salle_repository.create_with_verification(
        db, reservation_in, current_user.id
    )
    
    if isinstance(result, dict) and "errors" in result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["errors"]
        )
    audit_and_commit(
        db,
        request=http_request,
        user=current_user,
        action="create",
        entity_type="reservation_salle",
        entity_id=result.id,
        new_values=fields_snapshot(result, *_RESERVATION_FIELDS),
    )
    return result


@router.put("/{reservation_id}", response_model=ReservationSalle)
def update_reservation(
    reservation_id: int,
    reservation_in: ReservationSalleUpdate,
    http_request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Met à jour une réservation (si demandeur)"""
    reservation = reservation_salle_repository.get_by_id(db, reservation_id)
    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Réservation non trouvée"
        )
    
    # Vérifier que l'utilisateur est le demandeur ou scolarité
    assert_can_modify_reservation(current_user, reservation)
    
    # Ne peut modifier que si en attente
    if reservation.statut != "en_attente":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Seules les réservations en attente peuvent être modifiées"
        )
    
    result = reservation_salle_repository.update_with_verification(
        db, reservation_id, reservation_in
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Réservation non trouvée",
        )
    if isinstance(result, dict) and "errors" in result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["errors"],
        )
    audit_and_commit(
        db,
        request=http_request,
        user=current_user,
        action="update",
        entity_type="reservation_salle",
        entity_id=reservation_id,
        old_values=fields_snapshot(reservation, *_RESERVATION_FIELDS),
        new_values=fields_snapshot(result, *_RESERVATION_FIELDS),
    )
    return result


@router.patch("/{reservation_id}/approuver", response_model=ReservationSalle)
def approuver_reservation(
    reservation_id: int,
    http_request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("edt", "validate")),
):
    """Approuve une réservation"""
    result = reservation_salle_repository.approuver(db, reservation_id, current_user.id)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Réservation non trouvée ou déjà traitée",
        )
    if isinstance(result, dict) and "errors" in result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["errors"],
        )
    audit_and_commit(
        db,
        request=http_request,
        user=current_user,
        action="validate",
        entity_type="reservation_salle",
        entity_id=reservation_id,
        new_values=fields_snapshot(result, *_RESERVATION_FIELDS),
    )
    return result


@router.patch("/{reservation_id}/refuser", response_model=ReservationSalle)
def refuser_reservation(
    reservation_id: int,
    request: RefuserReservationRequest,
    http_request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("edt", "validate")),
):
    """Refuse une réservation"""
    reservation = reservation_salle_repository.refuser(
        db, reservation_id, current_user.id, request.motif_refus
    )
    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Réservation non trouvée ou déjà traitée"
        )
    audit_and_commit(
        db,
        request=http_request,
        user=current_user,
        action="reject",
        entity_type="reservation_salle",
        entity_id=reservation_id,
        new_values=fields_snapshot(reservation, *_RESERVATION_FIELDS),
        details=request.motif_refus,
    )
    return reservation


@router.patch("/{reservation_id}/annuler", response_model=ReservationSalle)
def annuler_reservation(
    reservation_id: int,
    http_request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Annule une réservation (si demandeur)"""
    reservation = reservation_salle_repository.get_by_id(db, reservation_id)
    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Réservation non trouvée"
        )
    
    assert_can_modify_reservation(current_user, reservation)
    old_snapshot = fields_snapshot(reservation, *_RESERVATION_FIELDS)
    reservation = reservation_salle_repository.annuler(db, reservation_id)
    audit_and_commit(
        db,
        request=http_request,
        user=current_user,
        action="cancel",
        entity_type="reservation_salle",
        entity_id=reservation_id,
        old_values=old_snapshot,
        new_values=fields_snapshot(reservation, *_RESERVATION_FIELDS),
    )
    return reservation


@router.delete("/{reservation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reservation(
    reservation_id: int,
    http_request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("edt", "delete")),
):
    """Supprime une réservation"""
    reservation = reservation_salle_repository.get_by_id(db, reservation_id)
    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Réservation non trouvée"
        )
    old_snapshot = fields_snapshot(reservation, *_RESERVATION_FIELDS)
    reservation_salle_repository.delete(db, reservation_id)
    audit_and_commit(
        db,
        request=http_request,
        user=current_user,
        action="delete",
        entity_type="reservation_salle",
        entity_id=reservation_id,
        old_values=old_snapshot,
    )
    return None
