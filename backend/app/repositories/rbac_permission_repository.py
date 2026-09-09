"""Repository pour la matrice RBAC persistée."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.rbac_permission import RbacPermissionGrant
from app.utils.rbac_matrix import ALL_ACTIONS, MODULE_ACTIONS, MODULE_LABELS, ACTION_LABELS


ALLOWED_ROLES = frozenset({"superadmin", "admin", "scolarite", "comptable"})


class RbacPermissionRepository:
    @staticmethod
    def has_grants(db: Session) -> bool:
        return db.query(RbacPermissionGrant.id).limit(1).first() is not None

    @staticmethod
    def seed_from_static(db: Session) -> int:
        """Peuple la table depuis MODULE_ACTIONS si vide."""
        if RbacPermissionRepository.has_grants(db):
            return 0
        count = 0
        for module, actions in MODULE_ACTIONS.items():
            for action, roles in actions.items():
                for role in roles:
                    db.add(RbacPermissionGrant(module=module, action=action, role=role))
                    count += 1
        db.commit()
        return count

    @staticmethod
    def to_module_actions(db: Session) -> dict[str, dict[str, list[str]]]:
        grants = db.query(RbacPermissionGrant).all()
        result: dict[str, dict[str, list[str]]] = {}
        for grant in grants:
            result.setdefault(grant.module, {}).setdefault(grant.action, []).append(grant.role)
        for module_actions in result.values():
            for action, roles in module_actions.items():
                module_actions[action] = sorted(set(roles))
        return result

    @staticmethod
    def to_matrix_rows(db: Session) -> list[dict]:
        module_actions = RbacPermissionRepository.to_module_actions(db)
        rows: list[dict] = []
        for module in sorted(module_actions.keys()):
            actions = module_actions[module]
            for action in ALL_ACTIONS:
                roles = actions.get(action)
                if not roles:
                    continue
                rows.append(
                    {
                        "module": module,
                        "module_label": MODULE_LABELS.get(module, module),
                        "action": action,
                        "action_label": ACTION_LABELS.get(action, action),
                        "roles": roles,
                    }
                )
        return rows

    @staticmethod
    def replace_matrix(db: Session, rows: list[dict]) -> None:
        """Remplace toute la matrice (validation module/action/rôle)."""
        validated: set[tuple[str, str, str]] = set()
        for row in rows:
            module = row["module"]
            action = row["action"]
            if module not in MODULE_ACTIONS:
                raise ValueError(f"Module inconnu : {module}")
            if action not in MODULE_ACTIONS[module]:
                raise ValueError(f"Action « {action} » invalide pour le module « {module} »")
            for role in row["roles"]:
                if role not in ALLOWED_ROLES:
                    raise ValueError(f"Rôle inconnu : {role}")
                validated.add((module, action, role))

        db.query(RbacPermissionGrant).delete(synchronize_session=False)
        db.flush()
        for module, action, role in validated:
            db.add(RbacPermissionGrant(module=module, action=action, role=role))
        db.flush()
