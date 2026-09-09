"""Résolution RBAC dynamique depuis la matrice persistée (fallback statique)."""

from __future__ import annotations

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db
from app.models.user import User
from app.utils.rbac_matrix import MODULE_ACTIONS

ROLE_ALIASES = {"administrateur": "admin"}


def normalize_role(user: User) -> str:
    if user.is_superuser:
        return "superadmin"
    role = getattr(user, "role", None) or ""
    return ROLE_ALIASES.get(role, role)


def get_module_actions(db: Session) -> dict[str, dict[str, list[str]]]:
    from app.repositories.rbac_permission_repository import RbacPermissionRepository

    RbacPermissionRepository.seed_from_static(db)
    if RbacPermissionRepository.has_grants(db):
        return RbacPermissionRepository.to_module_actions(db)
    return MODULE_ACTIONS


def can_perform(db: Session, user: User, module: str, action: str) -> bool:
    role = normalize_role(user)
    if role == "superadmin":
        return True
    actions = get_module_actions(db)
    return role in actions.get(module, {}).get(action, [])


def require_permission(module: str, action: str):
    """Fabrique une dépendance FastAPI vérifiant module × action."""

    async def _dependency(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_active_user),
    ) -> User:
        if not can_perform(db, current_user, module, action):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Droits insuffisants pour {module}.{action}",
            )
        return current_user

    return _dependency
