"""Contrôle d'accès réservations de salles - portail enseignant."""

from __future__ import annotations

from fastapi import HTTPException, status

from app.core.permissions import is_scolarite_portal_user
from app.models.reservation_salle import ReservationSalle
from app.models.user import User


def assert_can_read_reservation(user: User, reservation: ReservationSalle) -> None:
    """Scolarité/admin ou demandeur de la réservation."""
    if is_scolarite_portal_user(user):
        return
    if reservation.demandeur_id == user.id:
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Accès refusé : vous n'êtes pas le demandeur de cette réservation",
    )


def assert_can_modify_reservation(user: User, reservation: ReservationSalle) -> None:
    """Modification/annulation - demandeur ou scolarité."""
    if is_scolarite_portal_user(user):
        return
    if reservation.demandeur_id == user.id:
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Vous n'êtes pas autorisé à modifier cette réservation",
    )
