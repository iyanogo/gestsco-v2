import {
  canPerform,
  clearRuntimeModuleActions,
  getModuleActionPermissions,
  getRbacMatrixRows,
  setRuntimeModuleActionsFromRows,
} from '@/utils/rbacActions';

describe('rbacActions', () => {
  describe('canPerform', () => {
    it('référentiel - admin oui, scolarité non', () => {
      expect(canPerform('admin', 'referentiel', 'create')).toBe(true);
      expect(canPerform('superadmin', 'referentiel', 'delete')).toBe(true);
      expect(canPerform('scolarite', 'referentiel', 'create')).toBe(false);
      expect(canPerform('comptable', 'referentiel', 'read')).toBe(false);
    });

    it('étudiants - scolarité CRUD + export, comptable non', () => {
      expect(canPerform('scolarite', 'etudiants', 'create')).toBe(true);
      expect(canPerform('scolarite', 'etudiants', 'export')).toBe(true);
      expect(canPerform('comptable', 'etudiants', 'read')).toBe(false);
      expect(canPerform('enseignant', 'etudiants', 'export')).toBe(false);
    });

    it('finances - comptable autorisé', () => {
      expect(canPerform('comptable', 'finances', 'create')).toBe(true);
      expect(canPerform('comptable', 'finances', 'validate')).toBe(true);
      expect(canPerform('comptable', 'stages', 'read')).toBe(false);
    });

    it('délibérations - scolarité validate, enseignant non', () => {
      expect(canPerform('scolarite', 'evaluations_deliberations', 'validate')).toBe(true);
      expect(canPerform('enseignant', 'evaluations_deliberations', 'validate')).toBe(false);
    });

    it('résultats - calculate réservé scolarité/admin', () => {
      expect(canPerform('admin', 'evaluations_resultats', 'calculate')).toBe(true);
      expect(canPerform('comptable', 'evaluations_resultats', 'calculate')).toBe(false);
    });

    it('créneaux EDT - écriture superadmin uniquement', () => {
      expect(canPerform('superadmin', 'edt_creneaux', 'create')).toBe(true);
      expect(canPerform('admin', 'edt_creneaux', 'create')).toBe(false);
      expect(canPerform('scolarite', 'edt_creneaux', 'read')).toBe(true);
    });

    it('edt - export réservé scolarité/admin', () => {
      expect(canPerform('scolarite', 'edt', 'export')).toBe(true);
      expect(canPerform('enseignant', 'edt', 'export')).toBe(false);
    });

    it('utilisateurs - superadmin uniquement', () => {
      expect(canPerform('superadmin', 'utilisateurs', 'create')).toBe(true);
      expect(canPerform('admin', 'utilisateurs', 'create')).toBe(false);
    });
  });

  describe('getModuleActionPermissions', () => {
    it('retourne les flags attendus pour la scolarité sur étudiants', () => {
      const perms = getModuleActionPermissions('scolarite', 'etudiants');
      expect(perms.canCreate).toBe(true);
      expect(perms.canDelete).toBe(true);
      expect(perms.canExport).toBe(true);
      expect(perms.canCalculate).toBe(false);
    });
  });

  describe('getRbacMatrixRows', () => {
    it('exporte des lignes module × action avec rôles', () => {
      const rows = getRbacMatrixRows();
      expect(rows.length).toBeGreaterThan(10);
      const etuCreate = rows.find((r) => r.module === 'etudiants' && r.action === 'create');
      expect(etuCreate?.roles).toContain('scolarite');
      expect(etuCreate?.roles).not.toContain('comptable');
    });
  });

  describe('matrice runtime API', () => {
    afterEach(() => {
      clearRuntimeModuleActions();
    });

    it('applique les droits depuis les lignes API', () => {
      setRuntimeModuleActionsFromRows([
        { module: 'referentiel', action: 'create', roles: ['scolarite'] },
      ]);
      expect(canPerform('scolarite', 'referentiel', 'create')).toBe(true);
      expect(canPerform('admin', 'referentiel', 'create')).toBe(false);
    });

    it('revient au statique après clear', () => {
      setRuntimeModuleActionsFromRows([
        { module: 'referentiel', action: 'create', roles: ['scolarite'] },
      ]);
      clearRuntimeModuleActions();
      expect(canPerform('admin', 'referentiel', 'create')).toBe(true);
    });
  });
});
