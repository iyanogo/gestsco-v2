"""Contrôle d'accès documents administratifs étudiants."""

from fastapi import HTTPException, status

from app.core.portal_access import STUDENT_ROLES, can_access_any_etudiant
from app.models.user import User


def assert_documents_staff_list(user: User) -> None:
    """Liste globale ou filtre statut sans etudiant_id - staff uniquement."""
    if can_access_any_etudiant(user):
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=(
            "Accès refusé à la liste globale. "
            "Utilisez /mes-documents (portail étudiant) ou précisez etudiant_id."
        ),
    )


def assert_student_can_create_document(user: User, etudiant_id: int, owned_etudiant_id: int) -> None:
    """Étudiant : création limitée à sa propre fiche."""
    if can_access_any_etudiant(user):
        return
    if getattr(user, "role", None) in STUDENT_ROLES:
        if owned_etudiant_id != etudiant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous ne pouvez déposer un document que pour votre propre dossier",
            )
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Droits insuffisants pour créer un document étudiant",
    )
