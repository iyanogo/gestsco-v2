import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRbacMatrixStore } from '@/store/rbacMatrixStore';
import { MenuItem } from '@/components/layouts';
import {
  AppRole,
  canAccessAdminPortal,
  canAccessPath,
  canAccessStudentPortal,
  canAccessTeacherPortal,
  filterMenuForRole,
  getRoleLabel,
  resolveAppRole,
} from '@/utils/rbac';
import {
  canPerform as canPerformAction,
  getModuleActionPermissions,
  type RbacAction,
  type RbacModule,
  type ModuleActionPermissions,
} from '@/utils/rbacActions';

export function usePermissions() {
  const { user } = useAuth();
  const matrixLoaded = useRbacMatrixStore((s) => s.loaded);
  const matrixFromApi = useRbacMatrixStore((s) => s.fromApi);
  const matrixLoading = useRbacMatrixStore((s) => s.loading);

  const role = useMemo(() => resolveAppRole(user), [user]);

  return {
    user,
    role,
    roleLabel: getRoleLabel(role),
    isSuperuser: role === 'superadmin',
    matrixLoaded,
    matrixFromApi,
    matrixLoading,
    canAccessAdmin: canAccessAdminPortal(role),
    canAccessTeacher: canAccessTeacherPortal(role),
    canAccessStudent: canAccessStudentPortal(role),
    canAccessPath: (pathname: string) => canAccessPath(role, pathname),
    filterMenu: (items: MenuItem[]) => filterMenuForRole(items, role),
    /** Vérifie une action fine (module × action) - matrice BDD ou repli statique */
    canPerform: (module: RbacModule, action: RbacAction) =>
      canPerformAction(role, module, action),
    /** Tous les droits d'action pour un module */
    moduleActions: (module: RbacModule): ModuleActionPermissions =>
      getModuleActionPermissions(role, module),
  };
}

export type { AppRole, RbacModule, RbacAction, ModuleActionPermissions };
