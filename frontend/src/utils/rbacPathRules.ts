import { canPerform, type RbacAction, type RbacModule } from '@/utils/rbacActions';
import type { AppRole } from '@/utils/rbac';

type PathAccessRule =
  | { prefix: string; superadminOnly: true }
  | { prefix: string; module: RbacModule; action?: RbacAction };

/** Règles les plus spécifiques en premier (tri par longueur de préfixe). */
const ADMIN_PATH_RULES: PathAccessRule[] = [
  { prefix: '/admin/administration', superadminOnly: true },
  { prefix: '/admin/utilisateurs', module: 'utilisateurs', action: 'read' },
  { prefix: '/admin/evaluations/deliberations', module: 'evaluations_deliberations', action: 'read' },
  { prefix: '/admin/evaluations/resultats', module: 'evaluations_resultats', action: 'read' },
  { prefix: '/admin/evaluations', module: 'evaluations_notes', action: 'read' },
  { prefix: '/admin/emploi-temps/creneaux', module: 'edt_creneaux', action: 'read' },
  { prefix: '/admin/emploi-temps', module: 'edt', action: 'read' },
  { prefix: '/admin/presences', module: 'edt', action: 'read' },
  { prefix: '/admin/finances', module: 'finances', action: 'read' },
  { prefix: '/admin/parametrage', module: 'parametrage', action: 'read' },
  { prefix: '/admin/referentiel', module: 'referentiel', action: 'read' },
  { prefix: '/admin/gestion-annees', module: 'referentiel', action: 'read' },
  { prefix: '/admin/gestion-modules', module: 'parametrage', action: 'read' },
  { prefix: '/admin/configuration-deliberation', module: 'evaluations_deliberations', action: 'read' },
  { prefix: '/admin/etudiants/inscription-groupe', module: 'inscriptions', action: 'read' },
  { prefix: '/admin/etudiants/inscriptions-matieres', module: 'inscriptions', action: 'read' },
  { prefix: '/admin/etudiants/inscriptions', module: 'inscriptions', action: 'read' },
  { prefix: '/admin/etudiants/reinscriptions', module: 'inscriptions', action: 'read' },
  { prefix: '/admin/etudiants', module: 'etudiants', action: 'read' },
  { prefix: '/admin/documents', module: 'etudiants', action: 'read' },
  { prefix: '/admin/stages', module: 'stages', action: 'read' },
  { prefix: '/admin/soutenances', module: 'soutenances', action: 'read' },
  { prefix: '/admin/enseignants', module: 'etudiants', action: 'read' },
].sort((a, b) => b.prefix.length - a.prefix.length);

function resolveAdminPathRule(pathname: string): PathAccessRule | null {
  for (const rule of ADMIN_PATH_RULES) {
    if (pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)) {
      return rule;
    }
  }
  return null;
}

export function canAccessAdminPath(role: AppRole, pathname: string): boolean {
  if (role === 'superadmin') return true;

  if (pathname === '/admin/dashboard' || pathname.startsWith('/admin/dashboard/')) {
    return role === 'admin' || role === 'scolarite' || role === 'comptable';
  }

  const rule = resolveAdminPathRule(pathname);
  if (rule) {
    if ('superadminOnly' in rule) return false;
    return canPerform(role, rule.module, rule.action ?? 'read');
  }

  if (role === 'comptable') return false;
  return role === 'admin' || role === 'scolarite';
}
