import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DeliberationsPage from '../evaluations/DeliberationsPage';

jest.mock('../../../services/deliberationService', () => ({
  deliberationService: {
    getDeliberations: jest.fn().mockResolvedValue([]),
  },
}));

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

describe('DeliberationsPage', () => {
  it('renders title and config notice', async () => {
    render(
      <BrowserRouter>
        <DeliberationsPage />
      </BrowserRouter>,
    );
    expect(await screen.findByRole('heading', { name: /^Délibérations$/i })).toBeInTheDocument();
    expect(screen.getAllByText(/ConfigurationDeliberation/i).length).toBeGreaterThan(0);
  });
});
