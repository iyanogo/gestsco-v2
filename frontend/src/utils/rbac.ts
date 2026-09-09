import { User } from '@/types/auth';
import { MenuItem } from '@/components/layouts';
import { canAccessAdminPath } from '@/utils/rbacPathRules';

/** Rôles normalisés de l'application */
export type AppRole =
  | 'superadmin'
  | 'admin'
  | 'scolarite'
  | 'comptable'
  | 'enseignant'
  | 'etudiant';

export const ADMIN_PORTAL_ROLES: AppRole[] = [
  'superadmin',
  'admin',
  'scolarite',
  'comptable',
];

export function resolveAppRole(user: User | null | undefined): AppRole {
  if (!user) return 'etudiant';
  if (user.is_superuser) return 'superadmin';

  switch (user.role) {
    case 'admin':
    case 'administrateur':
      return 'admin';
    case 'scolarite':
      return 'scolarite';
    case 'comptable':
      return 'comptable';
    case 'teacher':
    case 'enseignant':
      return 'enseignant';
    case 'student':
    case 'etudiant':
      return 'etudiant';
    default:
      return 'scolarite';
  }
}

export function getRoleLabel(role: AppRole): string {
  const labels: Record<AppRole, string> = {
    superadmin: 'Super Admin',
    admin: 'Administrateur',
    scolarite: 'Scolarité',
    comptable: 'Comptable',
    enseignant: 'Enseignant',
    etudiant: 'Étudiant',
  };
  return labels[role];
}

export function canAccessAdminPortal(role: AppRole): boolean {
  return ADMIN_PORTAL_ROLES.includes(role);
}

export function canAccessTeacherPortal(role: AppRole): boolean {
  return role === 'enseignant' || role === 'superadmin';
}

export function canAccessStudentPortal(role: AppRole): boolean {
  return role === 'etudiant';
}

export function canAccessPath(role: AppRole, pathname: string): boolean {
  if (pathname.startsWith('/admin')) {
    return canAccessAdminPath(role, pathname);
  }
  if (pathname.startsWith('/enseignant')) {
    return canAccessTeacherPortal(role);
  }
  if (pathname.startsWith('/etudiant')) {
    return canAccessStudentPortal(role);
  }
  return true;
}

export function filterMenuForRole(items: MenuItem[], role: AppRole): MenuItem[] {
  return items
    .map((item) => {
      const children = item.children
        ? filterMenuForRole(item.children, role)
        : undefined;

      return { ...item, children };
    })
    .filter((item) => {
      if (item.superuserOnly && role !== 'superadmin') return false;
      if (item.roles && !item.roles.includes(role)) return false;
      if (item.path && !canAccessPath(role, item.path)) return false;
      if (item.children) return item.children.length > 0;
      return Boolean(item.path);
    });
}
