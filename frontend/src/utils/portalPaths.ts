import { User } from '@/types/auth';
import { AppRole, resolveAppRole } from '@/utils/rbac';

export type PortalKind = 'admin' | 'teacher' | 'student';

export function getPortalKindFromPath(pathname: string): PortalKind {
  if (pathname.startsWith('/etudiant')) return 'student';
  if (pathname.startsWith('/enseignant')) return 'teacher';
  return 'admin';
}

export function getPortalKindForUser(user: User | null | undefined): PortalKind {
  const role = resolveAppRole(user);
  if (role === 'etudiant') return 'student';
  if (role === 'enseignant') return 'teacher';
  return 'admin';
}

export function getPortalHomePath(pathname?: string): string {
  const kind = pathname ? getPortalKindFromPath(pathname) : 'admin';
  return `${portalPrefix(kind)}/dashboard`;
}

export function getPortalProfilePath(kind: PortalKind): string {
  return `${portalPrefix(kind)}/profil`;
}

export function getPortalProfilePathForUser(user: User | null | undefined): string {
  return getPortalProfilePath(getPortalKindForUser(user));
}

/** Paramètres système - réservé admin/superadmin du portail admin. */
export function getPortalSettingsPath(
  kind: PortalKind,
  role?: AppRole,
): string | null {
  if (kind === 'admin' && (role === 'superadmin' || role === 'admin')) {
    return '/admin/parametrage/parametres';
  }
  return null;
}

function portalPrefix(kind: PortalKind): string {
  switch (kind) {
    case 'student':
      return '/etudiant';
    case 'teacher':
      return '/enseignant';
    default:
      return '/admin';
  }
}
