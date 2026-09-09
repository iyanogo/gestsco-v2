import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ResultatsPage from '../evaluations/ResultatsPage';

jest.mock('../../../services/sessionExamenService', () => ({
  sessionExamenService: {
    getSessions: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('../../../services/filiereService', () => ({
  getFilieres: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../../services/niveauService', () => ({
  getNiveaux: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../../services/matiereService', () => ({
  getMatieres: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../../services/inscriptionService', () => ({
  getInscriptions: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../../services/etudiantService', () => ({
  getEtudiants: jest.fn().mockResolvedValue([]),
}));

describe('ResultatsPage', () => {
  it('should render page title and backend notice', async () => {
    render(
      <BrowserRouter>
        <ResultatsPage />
      </BrowserRouter>,
    );
    expect(await screen.findByRole('heading', { name: /^Résultats$/i })).toBeInTheDocument();
    expect(screen.getByText(/resultats\/calculer/i)).toBeInTheDocument();
  });
});
