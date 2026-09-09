import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PermissionsPage from '../administration/PermissionsPage';

jest.mock('../../../services/administrationService', () => ({
  __esModule: true,
  default: {
    getPermissionsSummary: jest.fn().mockResolvedValue({
      total_users: 3,
      active_count: 3,
      inactive_count: 0,
      superuser_count: 1,
      by_role: { admin: 1, scolarite: 1, comptable: 1 },
    }),
    getPermissionsMatrix: jest.fn().mockResolvedValue([
      {
        module: 'finances',
        module_label: 'Finances',
        action: 'read',
        action_label: 'Lire',
        roles: ['superadmin', 'admin', 'scolarite', 'comptable'],
      },
    ]),
  },
}));

describe('PermissionsPage', () => {
  it('should show permissions summary and RBAC matrix from API', async () => {
    render(
      <BrowserRouter>
        <PermissionsPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/comptes total/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { name: /matrice rbac active/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /gestion des utilisateurs/i })).toBeInTheDocument();
    expect(screen.getAllByText('Finances').length).toBeGreaterThan(0);
  });
});
