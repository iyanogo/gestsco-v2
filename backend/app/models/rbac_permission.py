"""Grants RBAC persistés - module × action × rôle."""

from sqlalchemy import Column, Integer, String, UniqueConstraint

from app.core.database import Base


class RbacPermissionGrant(Base):
    __tablename__ = "rbac_permission_grants"

    id = Column(Integer, primary_key=True, index=True)
    module = Column(String(50), nullable=False, index=True)
    action = Column(String(20), nullable=False, index=True)
    role = Column(String(30), nullable=False, index=True)

    __table_args__ = (
        UniqueConstraint("module", "action", "role", name="uq_rbac_module_action_role"),
    )
