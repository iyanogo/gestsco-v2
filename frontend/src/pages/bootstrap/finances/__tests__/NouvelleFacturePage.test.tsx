import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import NouvelleFacturePage from '../NouvelleFacturePage';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../../hooks/usePermissions', () => ({
  usePermissions: () => ({
    moduleActions: () => ({
      canCreate: true,
      canUpdate: true,
      canDelete: true,
      canRead: true,
    }),
  }),
}));

jest.mock('../../../../services/etudiantService', () => ({
  getEtudiants: jest.fn().mockResolvedValue([
    { id: 1, nom: 'Diallo', prenom: 'Amadou', matricule: '2024-0001' },
  ]),
}));

jest.mock('../../../../services/anneeAcademiqueService', () => ({
  __esModule: true,
  default: {
    getAnnees: jest.fn().mockResolvedValue([
      { id: 2, code: '2025-2026', libelle: 'Année 2025-2026' },
    ]),
    getCurrentAnnee: jest.fn().mockResolvedValue({
      id: 2,
      code: '2025-2026',
      libelle: 'Année 2025-2026',
    }),
  },
}));

jest.mock('../../../../services/factureService', () => ({
  factureService: {
    genererFactureAutomatique: jest.fn().mockResolvedValue({
      id: 10,
      numero_facture: 'FAC-2026-0010',
    }),
    createFacture: jest.fn().mockResolvedValue({
      id: 11,
      numero_facture: 'FAC-2026-0011',
    }),
  },
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <NouvelleFacturePage />
    </MemoryRouter>
  );

describe('NouvelleFacturePage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('should render creation form with tabs', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Nouvelle facture' })).toBeInTheDocument();
    expect(screen.getByText('Depuis les frais configurés')).toBeInTheDocument();
    expect(screen.getByText('Saisie manuelle')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Retour à la liste/i })).toHaveAttribute(
      'href',
      '/admin/finances/factures'
    );
  });

  it('should submit automatic generation', async () => {
    const user = userEvent.setup();
    const { factureService } = jest.requireMock('../../../../services/factureService');

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Diallo Amadou/i })).toBeInTheDocument();
    });

    await user.selectOptions(screen.getAllByRole('combobox')[0], '1');
    await user.click(screen.getByRole('button', { name: /Générer la facture/i }));

    await waitFor(() => {
      expect(factureService.genererFactureAutomatique).toHaveBeenCalledWith(1, 2, 'scolarite');
      expect(mockNavigate).toHaveBeenCalledWith('/admin/finances/factures', {
        state: { successMessage: 'Facture FAC-2026-0010 créée avec succès.' },
      });
    });
  });

  it('should submit manual creation', async () => {
    const user = userEvent.setup();
    const { factureService } = jest.requireMock('../../../../services/factureService');

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Diallo Amadou/i })).toBeInTheDocument();
    });

    await user.click(screen.getByText('Saisie manuelle'));
    await user.selectOptions(screen.getAllByRole('combobox')[0], '1');
    await user.type(screen.getByPlaceholderText('Libellé'), 'Frais de scolarité');
    await user.clear(screen.getAllByRole('spinbutton')[1]);
    await user.type(screen.getAllByRole('spinbutton')[1], '150000');
    await user.click(screen.getByRole('button', { name: /Créer la facture/i }));

    await waitFor(() => {
      expect(factureService.createFacture).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/admin/finances/factures', {
        state: { successMessage: 'Facture FAC-2026-0011 créée avec succès.' },
      });
    });
  });
});
