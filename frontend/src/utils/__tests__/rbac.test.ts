import {
  canAccessAdminPortal,
  canAccessPath,
  filterMenuForRole,
  resolveAppRole,
} from '@/utils/rbac';
import { adminMenuItems } from '@/config/menuConfig';
import { User } from '@/types/auth';

describe('rbac', () => {
  const adminUser: User = {
    id: 1,
    email: 'admin@gestsco.com',
    full_name: 'Admin',
    is_active: true,
    is_superuser: true,
    role: 'admin',
    created_at: '2026-01-01T00:00:00',
    updated_at: '2026-01-01T00:00:00',
  };

  const scolariteUser: User = {
    id: 2,
    email: 'scolarite@gestsco.com',
    full_name: 'Scolarité',
    is_active: true,
    is_superuser: false,
    role: 'scolarite',
    created_at: '2026-01-01T00:00:00',
    updated_at: '2026-01-01T00:00:00',
  };

  const comptableUser: User = {
    id: 3,
    email: 'comptable@gestsco.com',
    full_name: 'Comptable',
    is_active: true,
    is_superuser: false,
    role: 'comptable',
    created_at: '2026-01-01T00:00:00',
    updated_at: '2026-01-01T00:00:00',
  };

  it('resolveAppRole distingue superadmin et scolarité', () => {
    expect(resolveAppRole(adminUser)).toBe('superadmin');
    expect(resolveAppRole(scolariteUser)).toBe('scolarite');
    expect(resolveAppRole(comptableUser)).toBe('comptable');
  });

  it('autorise la scolarité sur le portail admin', () => {
    expect(canAccessAdminPortal('scolarite')).toBe(true);
    expect(canAccessAdminPortal('enseignant')).toBe(false);
  });

  it('restreint les routes sensibles', () => {
    expect(canAccessPath('scolarite', '/admin/utilisateurs')).toBe(false);
    expect(canAccessPath('scolarite', '/admin/etudiants')).toBe(true);
    expect(canAccessPath('scolarite', '/admin/stages')).toBe(true);
    expect(canAccessPath('scolarite', '/admin/soutenances')).toBe(true);
    expect(canAccessPath('comptable', '/admin/finances/factures')).toBe(true);
    expect(canAccessPath('comptable', '/admin/etudiants')).toBe(false);
    expect(canAccessPath('comptable', '/admin/stages')).toBe(false);
  });

  it('filtre le menu admin pour la scolarité', () => {
    const menu = filterMenuForRole(adminMenuItems, 'scolarite');
    const labels = menu.map((item) => item.label);

    expect(labels).toContain('Étudiants');
    expect(labels).toContain('Stages');
    expect(labels).not.toContain('Utilisateurs');
    expect(labels).not.toContain('Administration');
    expect(labels).not.toContain('Référentiel');
  });

  it('exclut Stages du menu comptable', () => {
    const menu = filterMenuForRole(adminMenuItems, 'comptable');
    const labels = menu.map((item) => item.label);
    expect(labels).not.toContain('Stages');
  });
});
