import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SaisieNotesPage from '../evaluations/SaisieNotesPage';

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

describe('SaisieNotesPage', () => {
  it('should render page title', async () => {
    render(
      <BrowserRouter>
        <SaisieNotesPage />
      </BrowserRouter>,
    );
    expect(await screen.findByRole('heading', { name: /saisie des notes/i })).toBeInTheDocument();
  });
});
