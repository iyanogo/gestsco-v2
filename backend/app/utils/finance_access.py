"""Contrôle d'accès module finances - listes globales réservées au staff."""

from fastapi import HTTPException, status

from app.core.portal_access import can_access_any_etudiant
from app.models.user import User


def assert_finances_staff_list(user: User) -> None:
    """
    Garde-fou listes sans filtre étudiant.

    Étudiants et enseignants doivent utiliser /mes-factures, /mes-paiements
    ou préciser etudiant_id (avec assert_etudiant_owner en amont).
    """
    if can_access_any_etudiant(user):
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=(
            "Accès refusé à la liste globale. "
            "Utilisez /mes-factures ou /mes-paiements (portail étudiant) "
            "ou précisez etudiant_id."
        ),
    )
