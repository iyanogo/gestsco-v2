import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminDashboard from '../../dashboards/AdminDashboard';

jest.mock('../../../services/api');

const renderDashboard = () => {
  return render(
    <BrowserRouter>
      <AdminDashboard />
    </BrowserRouter>
  );
};

describe('AdminDashboard', () => {
  describe('rendering', () => {
    it('should render dashboard page', () => {
      renderDashboard();
      
      // Check for breadcrumb - may have multiple matches
      expect(screen.getAllByText('Tableau de bord').length).toBeGreaterThan(0);
    });

    it('should render statistics cards', () => {
      renderDashboard();
      
      // Check for student stats
      expect(screen.getByText('Total Étudiants')).toBeInTheDocument();
      expect(screen.getByText('Enseignants')).toBeInTheDocument();
    });

    it('should render export button', () => {
      renderDashboard();
      
      expect(screen.getByText('Exporter le rapport')).toBeInTheDocument();
    });
  });
});
