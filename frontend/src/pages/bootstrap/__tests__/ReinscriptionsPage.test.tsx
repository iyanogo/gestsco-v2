import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ReinscriptionsPage from '../etudiants/ReinscriptionsPage';

jest.mock('../../../services/etudiantService', () => ({
  getEtudiants: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../../services/inscriptionService', () => ({
  getInscriptions: jest.fn().mockResolvedValue([]),
  createInscription: jest.fn(),
}));

jest.mock('../../../services/filiereService', () => ({
  getFilieres: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../../services/niveauService', () => ({
  getNiveaux: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../../services/anneeAcademiqueService', () => ({
  anneeAcademiqueService: {
    getActiveAnnee: jest.fn().mockResolvedValue({
      id: 1,
      code: '2025-2026',
      libelle: '2025-2026',
      statut: 'ouverte',
    }),
  },
}));

jest.mock('../../../services/resultatService', () => ({
  resultatService: {
    getResultatsAnnuels: jest.fn().mockResolvedValue([]),
  },
}));

const renderPage = () =>
  render(
    <BrowserRouter>
      <ReinscriptionsPage />
    </BrowserRouter>,
  );

describe('ReinscriptionsPage', () => {
  it('should render page title and deliberation notice', async () => {
    renderPage();
    expect(await screen.findByText(/réinscriptions/i)).toBeInTheDocument();
    expect(screen.getByText(/ResultatAnnuel/i)).toBeInTheDocument();
    expect(screen.getByText(/is_valide=true/i)).toBeInTheDocument();
  });
});
