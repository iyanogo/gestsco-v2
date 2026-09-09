"""Tests resolver RBAC dynamique."""

import pytest
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.user import User
from app.repositories.rbac_permission_repository import RbacPermissionRepository
from app.utils.rbac_resolver import can_perform, normalize_role


@pytest.fixture
def admin_user(db: Session) -> User:
    user = User(
        email="admin-rbac@test.com",
        hashed_password=get_password_hash("pass"),
        full_name="Admin RBAC",
        is_active=True,
        is_superuser=False,
        role="admin",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def comptable_user(db: Session) -> User:
    user = User(
        email="comptable-rbac@test.com",
        hashed_password=get_password_hash("pass"),
        full_name="Comptable",
        is_active=True,
        is_superuser=False,
        role="comptable",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


class TestRbacResolver:
    def test_superadmin_bypass(self, db: Session, admin_user: User):
        admin_user.is_superuser = True
        assert normalize_role(admin_user) == "superadmin"
        assert can_perform(db, admin_user, "utilisateurs", "read")

    def test_static_fallback_referentiel(self, db: Session, admin_user: User):
        assert can_perform(db, admin_user, "referentiel", "create")
        assert not can_perform(db, admin_user, "utilisateurs", "read")

    def test_comptable_finances_read(self, db: Session, comptable_user: User):
        assert can_perform(db, comptable_user, "finances", "read")
        assert not can_perform(db, comptable_user, "referentiel", "create")

    def test_persisted_matrix_overrides_static(
        self, db: Session, admin_user: User, comptable_user: User
    ):
        RbacPermissionRepository.seed_from_static(db)
        matrix = RbacPermissionRepository.to_matrix_rows(db)
        payload = [
            {"module": r["module"], "action": r["action"], "roles": r["roles"]}
            for r in matrix
        ]
        users_read = next(r for r in payload if r["module"] == "utilisateurs" and r["action"] == "read")
        users_read["roles"] = ["superadmin", "admin", "comptable"]
        RbacPermissionRepository.replace_matrix(db, payload)
        db.commit()

        assert can_perform(db, comptable_user, "utilisateurs", "read")
        assert not can_perform(db, comptable_user, "utilisateurs", "create")
