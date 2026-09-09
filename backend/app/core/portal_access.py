"""
Contrôle d'accès portails enseignant / étudiant.

Résolution User → Etudiant via FK user_id (repli email legacy si non lié).
"""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.permissions import is_scolarite_portal_user
from app.models.annee_academique import AnneeAcademique
from app.models.etudiant import Etudiant
from app.models.user import User
from app.repositories import inscription_repository

STUDENT_ROLES = frozenset({"etudiant", "student"})
TEACHER_ROLES = frozenset({"enseignant", "teacher"})
STAFF_ETUDIANT_ROLES = frozenset({"admin", "administrateur", "scolarite", "comptable"})


def can_access_any_etudiant(user: User) -> bool:
    """Admin, scolarité, comptable ou superuser - accès à toutes les fiches étudiant."""
    if user.is_superuser:
        return True
    return getattr(user, "role", None) in STAFF_ETUDIANT_ROLES


def resolve_etudiant_id(db: Session, user: User) -> int:
    """
    Retourne l'ID étudiant lié au compte connecté.

    Priorité : FK user_id, puis correspondance email (legacy).
    """
    etudiant = db.query(Etudiant).filter(Etudiant.user_id == user.id).first()
    if not etudiant and user.email:
        etudiant = db.query(Etudiant).filter(Etudiant.email == user.email).first()
    if not etudiant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profil étudiant non lié à ce compte utilisateur",
        )
    return etudiant.id


def resolve_annee_academique_id(
    db: Session,
    etudiant_id: int,
    annee_id: int | None = None,
) -> int | None:
    """Résout l'ID année académique (paramètre explicite ou inscription active)."""
    if annee_id is not None:
        return annee_id
    inscription = inscription_repository.get_current_inscription(db, etudiant_id)
    if not inscription or not inscription.annee_academique:
        return None
    annee = (
        db.query(AnneeAcademique)
        .filter(AnneeAcademique.code == inscription.annee_academique)
        .first()
    )
    return annee.id if annee else None


def assert_etudiant_owner(user: User, etudiant_id: int, db: Session) -> None:
    """
    Vérifie que l'utilisateur peut accéder aux données de l'étudiant ciblé.

    - Staff (admin/scolarité/comptable) : accès libre
    - Étudiant : uniquement sa propre fiche
    - Autres rôles : refus
    """
    if can_access_any_etudiant(user):
        return

    if getattr(user, "role", None) in STUDENT_ROLES:
        owned_id = resolve_etudiant_id(db, user)
        if owned_id != etudiant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accès refusé aux données d'un autre étudiant",
            )
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Droits insuffisants pour consulter ces données étudiant",
    )


def assert_encadrant_owner(user: User, encadrant_id: int) -> None:
    """
    Vérifie que l'enseignant connecté est bien l'encadrant demandé.

    - Staff : accès libre
    - Enseignant : uniquement si encadrant_id == user.id
    """
    if is_scolarite_portal_user(user):
        return

    if getattr(user, "role", None) in TEACHER_ROLES:
        if user.id != encadrant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accès refusé aux stages encadrés par un autre enseignant",
            )
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Droits insuffisants pour consulter ces stages encadrés",
    )


def verifier_acces_etudiant(user: User, etudiant_id: int, db: Session) -> bool:
    """Compatibilité bulletins - retourne True si accès autorisé, False sinon."""
    try:
        assert_etudiant_owner(user, etudiant_id, db)
        return True
    except HTTPException as exc:
        if exc.status_code == status.HTTP_403_FORBIDDEN:
            return False
        raise
