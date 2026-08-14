import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import EtudiantsListPage from '../etudiants/EtudiantsListPage';

jest.mock('../../../services/api');

const renderPage = () => {
  return render(
    <BrowserRouter>
      <EtudiantsListPage />
    </BrowserRouter>
  );
};

describe('EtudiantsListPage', () => {
  describe('rendering', () => {
    it('should render page title', () => {
      renderPage();
      
      // Multiple elements may match - use getAllByText
      expect(screen.getAllByText(/étudiants|students|liste/i).length).toBeGreaterThan(0);
    });

    it('should render search input', () => {
      renderPage();
      
      const searchInput = screen.queryByPlaceholderText(/rechercher|search/i);
      expect(searchInput).toBeInTheDocument();
    });

    it('should render filter selects', () => {
      renderPage();
      
      // Check for filter dropdowns
      expect(screen.getByText('Toutes les filières')).toBeInTheDocument();
      expect(screen.getByText('Tous les niveaux')).toBeInTheDocument();
    });
  });
});
