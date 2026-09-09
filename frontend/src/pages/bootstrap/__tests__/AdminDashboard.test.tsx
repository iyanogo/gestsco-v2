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

  describe('quick actions', () => {
    it('should link quick actions to admin routes', () => {
      renderDashboard();

      expect(screen.getByRole('link', { name: /Nouvelle inscription/i })).toHaveAttribute(
        'href',
        '/admin/etudiants/nouveau'
      );
      expect(screen.getByRole('link', { name: /Saisir des notes/i })).toHaveAttribute(
        'href',
        '/admin/evaluations/notes'
      );
      expect(screen.getByRole('link', { name: /Créer une facture/i })).toHaveAttribute(
        'href',
        '/admin/finances/factures/nouveau'
      );
      expect(screen.getByRole('link', { name: /Emploi du temps/i })).toHaveAttribute(
        'href',
        '/admin/emploi-temps/planning'
      );
    });

    it('should link voir tout actions to admin routes', () => {
      renderDashboard();

      const voirToutLinks = screen.getAllByRole('link', { name: /Voir tout/i });
      expect(voirToutLinks[0]).toHaveAttribute('href', '/admin/etudiants/inscriptions');
      expect(voirToutLinks[1]).toHaveAttribute('href', '/admin/finances/paiements');
    });
  });
});
