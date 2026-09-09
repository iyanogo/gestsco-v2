import {
  getPortalHomePath,
  getPortalProfilePath,
  getPortalProfilePathForUser,
  getPortalSettingsPath,
} from '../portalPaths';
import { User } from '@/types/auth';

describe('portalPaths', () => {
  it('resolves home path from pathname', () => {
    expect(getPortalHomePath('/etudiant/notes')).toBe('/etudiant/dashboard');
    expect(getPortalHomePath('/enseignant/cours')).toBe('/enseignant/dashboard');
    expect(getPortalHomePath('/admin/finances/factures')).toBe('/admin/dashboard');
  });

  it('resolves profile path per portal', () => {
    expect(getPortalProfilePath('student')).toBe('/etudiant/profil');
    expect(getPortalProfilePath('teacher')).toBe('/enseignant/profil');
    expect(getPortalProfilePath('admin')).toBe('/admin/profil');
  });

  it('resolves profile path for user role', () => {
    const student: User = {
      id: 1,
      email: 'e@test.com',
      full_name: 'Etudiant',
      role: 'etudiant',
      is_active: true,
      is_superuser: false,
    };
    expect(getPortalProfilePathForUser(student)).toBe('/etudiant/profil');
  });

  it('exposes settings only for admin portal admins', () => {
    expect(getPortalSettingsPath('admin', 'admin')).toBe('/admin/parametrage/parametres');
    expect(getPortalSettingsPath('admin', 'scolarite')).toBeNull();
    expect(getPortalSettingsPath('student', 'etudiant')).toBeNull();
  });
});
