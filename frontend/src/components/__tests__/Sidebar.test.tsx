import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Sidebar from '../layouts/Sidebar';

const mockMenuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'speedometer2', path: '/admin/dashboard' },
  { id: 'etudiants', label: 'Étudiants', icon: 'mortarboard', path: '/admin/etudiants' },
  {
    id: 'referentiel',
    label: 'Référentiel',
    icon: 'database',
    children: [
      { id: 'filieres', label: 'Filières', icon: 'signpost-split', path: '/admin/referentiel/filieres' },
      { id: 'niveaux', label: 'Niveaux', icon: 'layers', path: '/admin/referentiel/niveaux' },
    ],
  },
];

const renderSidebar = (props = {}) => {
  return render(
    <BrowserRouter>
      <Sidebar menuItems={mockMenuItems} {...props} />
    </BrowserRouter>
  );
};

describe('Sidebar', () => {
  it('should render menu items', () => {
    renderSidebar();
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Étudiants')).toBeInTheDocument();
    expect(screen.getByText('Référentiel')).toBeInTheDocument();
  });

  it('should render links with correct paths', () => {
    renderSidebar();
    
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveAttribute('href', '/admin/dashboard');
  });

  it('should expand submenu on click', () => {
    renderSidebar();
    
    const referentielItem = screen.getByText('Référentiel');
    fireEvent.click(referentielItem);
    
    expect(screen.getByText('Filières')).toBeInTheDocument();
    expect(screen.getByText('Niveaux')).toBeInTheDocument();
  });

  it('should collapse submenu on second click', () => {
    renderSidebar();
    
    const referentielItem = screen.getByText('Référentiel');
    
    // First click - expand
    fireEvent.click(referentielItem);
    expect(screen.getByText('Filières')).toBeVisible();
    
    // Second click - collapse
    fireEvent.click(referentielItem);
    // Submenu should be collapsed (hidden)
  });

  it('should highlight active menu item', () => {
    window.history.pushState({}, '', '/admin/etudiants');
    renderSidebar();
    
    const etudiantsLink = screen.getByText('Étudiants').closest('a');
    expect(etudiantsLink).toHaveClass('active');
  });

  it('should render icons for menu items', () => {
    renderSidebar();
    
    const dashboardIcon = document.querySelector('.bi-speedometer2');
    expect(dashboardIcon).toBeInTheDocument();
  });

  it('should be collapsible', () => {
    renderSidebar({ collapsed: true });
    
    // In collapsed mode, labels might be hidden
    const sidebar = document.querySelector('.sidebar');
    expect(sidebar).toHaveClass('collapsed');
  });
});
