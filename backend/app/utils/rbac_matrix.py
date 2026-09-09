"""Matrice RBAC backend - miroir de frontend/src/utils/rbacActions.ts."""

from __future__ import annotations

from typing import TypedDict

SUPERADMIN = ["superadmin"]
ADMIN = ["superadmin", "admin"]
SCOLARITE = ["superadmin", "admin", "scolarite"]
FINANCES = ["superadmin", "admin", "scolarite", "comptable"]

MODULE_ACTIONS: dict[str, dict[str, list[str]]] = {
    "referentiel": {
        "read": ADMIN,
        "create": ADMIN,
        "update": ADMIN,
        "delete": ADMIN,
    },
    "parametrage": {
        "read": ADMIN,
        "create": ADMIN,
        "update": ADMIN,
        "delete": ADMIN,
        "validate": ADMIN,
    },
    "utilisateurs": {
        "read": SUPERADMIN,
        "create": SUPERADMIN,
        "update": SUPERADMIN,
        "delete": SUPERADMIN,
    },
    "etudiants": {
        "read": SCOLARITE,
        "create": SCOLARITE,
        "update": SCOLARITE,
        "delete": SCOLARITE,
        "validate": SCOLARITE,
        "export": SCOLARITE,
    },
    "inscriptions": {
        "read": SCOLARITE,
        "create": SCOLARITE,
        "update": SCOLARITE,
        "delete": SCOLARITE,
        "validate": SCOLARITE,
    },
    "evaluations_notes": {
        "read": SCOLARITE,
        "create": SCOLARITE,
        "update": SCOLARITE,
        "delete": SCOLARITE,
        "validate": SCOLARITE,
    },
    "evaluations_resultats": {
        "read": SCOLARITE,
        "calculate": SCOLARITE,
    },
    "evaluations_deliberations": {
        "read": SCOLARITE,
        "create": SCOLARITE,
        "update": SCOLARITE,
        "delete": SCOLARITE,
        "validate": SCOLARITE,
    },
    "finances": {
        "read": FINANCES,
        "create": FINANCES,
        "update": FINANCES,
        "delete": FINANCES,
        "validate": FINANCES,
    },
    "edt": {
        "read": SCOLARITE,
        "create": SCOLARITE,
        "update": SCOLARITE,
        "delete": SCOLARITE,
        "validate": SCOLARITE,
        "export": SCOLARITE,
    },
    "edt_creneaux": {
        "read": SCOLARITE,
        "create": SUPERADMIN,
        "update": SUPERADMIN,
        "delete": SUPERADMIN,
    },
    "stages": {
        "read": SCOLARITE,
        "create": SCOLARITE,
        "update": SCOLARITE,
        "delete": SCOLARITE,
        "validate": SCOLARITE,
    },
    "soutenances": {
        "read": SCOLARITE,
        "create": SCOLARITE,
        "update": SCOLARITE,
        "delete": SCOLARITE,
        "validate": SCOLARITE,
    },
}

MODULE_LABELS = {
    "referentiel": "Référentiel",
    "parametrage": "Paramétrage",
    "utilisateurs": "Utilisateurs",
    "etudiants": "Étudiants",
    "inscriptions": "Inscriptions",
    "evaluations_notes": "Notes",
    "evaluations_resultats": "Résultats",
    "evaluations_deliberations": "Délibérations",
    "finances": "Finances",
    "edt": "Emploi du temps",
    "edt_creneaux": "Créneaux EDT",
    "stages": "Stages",
    "soutenances": "Soutenances",
}

ACTION_LABELS = {
    "read": "Lire",
    "create": "Créer",
    "update": "Modifier",
    "delete": "Supprimer",
    "validate": "Valider",
    "calculate": "Calculer",
    "export": "Exporter",
}

ALL_ACTIONS = [
    "read",
    "create",
    "update",
    "delete",
    "validate",
    "calculate",
    "export",
]


class RbacMatrixRow(TypedDict):
    module: str
    module_label: str
    action: str
    action_label: str
    roles: list[str]


def get_rbac_matrix_rows_static() -> list[RbacMatrixRow]:
    rows: list[RbacMatrixRow] = []
    for module, actions in MODULE_ACTIONS.items():
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


def get_rbac_matrix_rows(db=None, *, seed_if_empty: bool = True) -> list[RbacMatrixRow]:
    """Retourne la matrice depuis la BDD si disponible, sinon le fallback statique."""
    if db is None:
        return get_rbac_matrix_rows_static()
    from app.repositories.rbac_permission_repository import RbacPermissionRepository

    if seed_if_empty:
        RbacPermissionRepository.seed_from_static(db)
    if RbacPermissionRepository.has_grants(db):
        return RbacPermissionRepository.to_matrix_rows(db)  # type: ignore[return-value]
    return get_rbac_matrix_rows_static()
