import type { AppRole } from '@/utils/rbac';

/**
 * Modules métier - alignés sur 07_MODULES_FONCTIONNELS.md §11 et gardes backend.
 * Le périmètre enseignant (notes/présences) reste géré via portalMode + API ;
 * ces modules couvrent surtout le portail admin/scolarité/comptable.
 */
export type RbacModule =
  | 'referentiel'
  | 'parametrage'
  | 'utilisateurs'
  | 'etudiants'
  | 'inscriptions'
  | 'evaluations_notes'
  | 'evaluations_resultats'
  | 'evaluations_deliberations'
  | 'finances'
  | 'edt'
  | 'edt_creneaux'
  | 'stages'
  | 'soutenances';

export type RbacAction =
  | 'read'
  | 'create'
  | 'update'
  | 'delete'
  | 'validate'
  | 'calculate'
  | 'export';

const SUPERADMIN: AppRole[] = ['superadmin'];
const ADMIN: AppRole[] = ['superadmin', 'admin'];
const SCOLARITE: AppRole[] = ['superadmin', 'admin', 'scolarite'];
const FINANCES: AppRole[] = ['superadmin', 'admin', 'scolarite', 'comptable'];
const NONE: AppRole[] = [];

/**
 * Matrice actions × rôles - reflète les gardes backend (permissions.py, deps.py).
 * Défaut implicite : refus si action absente.
 */
/** Matrice statique - repli si l'API est indisponible. */
export const STATIC_MODULE_ACTIONS: Record<RbacModule, Partial<Record<RbacAction, AppRole[]>>> = {
  referentiel: {
    read: ADMIN,
    create: ADMIN,
    update: ADMIN,
    delete: ADMIN,
  },
  parametrage: {
    read: ADMIN,
    create: ADMIN,
    update: ADMIN,
    delete: ADMIN,
    validate: ADMIN,
  },
  utilisateurs: {
    read: SUPERADMIN,
    create: SUPERADMIN,
    update: SUPERADMIN,
    delete: SUPERADMIN,
  },
  etudiants: {
    read: SCOLARITE,
    create: SCOLARITE,
    update: SCOLARITE,
    delete: SCOLARITE,
    validate: SCOLARITE,
    /** Export liste - données nominatives, même périmètre que la scolarité admin. */
    export: SCOLARITE,
  },
  inscriptions: {
    read: SCOLARITE,
    create: SCOLARITE,
    update: SCOLARITE,
    delete: SCOLARITE,
    validate: SCOLARITE,
  },
  evaluations_notes: {
    read: SCOLARITE,
    create: SCOLARITE,
    update: SCOLARITE,
    delete: SCOLARITE,
    validate: SCOLARITE,
  },
  evaluations_resultats: {
    read: SCOLARITE,
    calculate: SCOLARITE,
  },
  evaluations_deliberations: {
    read: SCOLARITE,
    create: SCOLARITE,
    update: SCOLARITE,
    delete: SCOLARITE,
    validate: SCOLARITE,
  },
  finances: {
    read: FINANCES,
    create: FINANCES,
    update: FINANCES,
    delete: FINANCES,
    validate: FINANCES,
  },
  edt: {
    read: SCOLARITE,
    create: SCOLARITE,
    update: SCOLARITE,
    delete: SCOLARITE,
    validate: SCOLARITE,
    export: SCOLARITE,
  },
  /** Créneaux horaires - réservés superadmin (aligné CreneauxListPage + backend). */
  edt_creneaux: {
    read: SCOLARITE,
    create: SUPERADMIN,
    update: SUPERADMIN,
    delete: SUPERADMIN,
  },
  stages: {
    read: SCOLARITE,
    create: SCOLARITE,
    update: SCOLARITE,
    delete: SCOLARITE,
    validate: SCOLARITE,
  },
  soutenances: {
    read: SCOLARITE,
    create: SCOLARITE,
    update: SCOLARITE,
    delete: SCOLARITE,
    validate: SCOLARITE,
  },
};

let runtimeModuleActions: Record<RbacModule, Partial<Record<RbacAction, AppRole[]>>> | null =
  null;

export interface RbacMatrixApiRow {
  module: string;
  action: string;
  roles: string[];
}

function rowsToModuleActions(
  rows: RbacMatrixApiRow[],
): Record<RbacModule, Partial<Record<RbacAction, AppRole[]>>> {
  const map = {} as Record<RbacModule, Partial<Record<RbacAction, AppRole[]>>>;
  for (const row of rows) {
    const module = row.module as RbacModule;
    const action = row.action as RbacAction;
    if (!map[module]) map[module] = {};
    map[module][action] = row.roles as AppRole[];
  }
  return map;
}

export function getEffectiveModuleActions(): Record<
  RbacModule,
  Partial<Record<RbacAction, AppRole[]>>
> {
  return runtimeModuleActions ?? STATIC_MODULE_ACTIONS;
}

export function setRuntimeModuleActionsFromRows(rows: RbacMatrixApiRow[]): void {
  runtimeModuleActions = rowsToModuleActions(rows);
}

export function clearRuntimeModuleActions(): void {
  runtimeModuleActions = null;
}

/** Message tooltip par défaut lorsqu'une action est masquée/désactivée. */
export const RBAC_DENIED_TOOLTIP = 'Droits insuffisants pour cette action';

export function canPerform(
  role: AppRole,
  module: RbacModule,
  action: RbacAction,
): boolean {
  const actions = getEffectiveModuleActions();
  const allowed = actions[module]?.[action] ?? NONE;
  return allowed.includes(role);
}

export interface ModuleActionPermissions {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canValidate: boolean;
  canCalculate: boolean;
  canExport: boolean;
}

export function getModuleActionPermissions(
  role: AppRole,
  module: RbacModule,
): ModuleActionPermissions {
  return {
    canRead: canPerform(role, module, 'read'),
    canCreate: canPerform(role, module, 'create'),
    canUpdate: canPerform(role, module, 'update'),
    canDelete: canPerform(role, module, 'delete'),
    canValidate: canPerform(role, module, 'validate'),
    canCalculate: canPerform(role, module, 'calculate'),
    canExport: canPerform(role, module, 'export'),
  };
}

export const RBAC_MODULE_LABELS: Record<RbacModule, string> = {
  referentiel: 'Référentiel',
  parametrage: 'Paramétrage',
  utilisateurs: 'Utilisateurs',
  etudiants: 'Étudiants',
  inscriptions: 'Inscriptions',
  evaluations_notes: 'Notes',
  evaluations_resultats: 'Résultats',
  evaluations_deliberations: 'Délibérations',
  finances: 'Finances',
  edt: 'Emploi du temps',
  edt_creneaux: 'Créneaux EDT',
  stages: 'Stages',
  soutenances: 'Soutenances',
};

export const RBAC_ACTION_LABELS: Record<RbacAction, string> = {
  read: 'Lire',
  create: 'Créer',
  update: 'Modifier',
  delete: 'Supprimer',
  validate: 'Valider',
  calculate: 'Calculer',
  export: 'Exporter',
};

const ALL_ACTIONS: RbacAction[] = [
  'read',
  'create',
  'update',
  'delete',
  'validate',
  'calculate',
  'export',
];

export interface RbacMatrixRow {
  module: RbacModule;
  moduleLabel: string;
  action: RbacAction;
  actionLabel: string;
  roles: AppRole[];
}

/** Matrice complète module × action pour affichage read-only (PermissionsPage). */
export function getRbacMatrixRows(): RbacMatrixRow[] {
  const rows: RbacMatrixRow[] = [];
  (Object.keys(STATIC_MODULE_ACTIONS) as RbacModule[]).forEach((module) => {
    ALL_ACTIONS.forEach((action) => {
      const roles = STATIC_MODULE_ACTIONS[module]?.[action];
      if (!roles) return;
      rows.push({
        module,
        moduleLabel: RBAC_MODULE_LABELS[module],
        action,
        actionLabel: RBAC_ACTION_LABELS[action],
        roles,
      });
    });
  });
  return rows;
}
