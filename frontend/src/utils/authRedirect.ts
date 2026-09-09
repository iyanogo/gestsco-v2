import { User } from '@/types/auth';
import { resolveAppRole } from '@/utils/rbac';

export function getPostLoginPath(user: User): string {
  const role = resolveAppRole(user);

  switch (role) {
    case 'superadmin':
    case 'admin':
    case 'scolarite':
    case 'comptable':
      return '/admin/dashboard';
    case 'enseignant':
      return '/enseignant/dashboard';
    case 'etudiant':
      return '/etudiant/dashboard';
    default:
      return '/admin/dashboard';
  }
}
