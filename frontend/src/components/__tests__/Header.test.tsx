import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Header from '../layouts/Header';

const mockUser = {
  name: 'Admin Test',
  role: 'admin',
};

const mockOnLogout = jest.fn();
const mockOnToggleSidebar = jest.fn();

const renderHeader = (props = {}) => {
  return render(
    <BrowserRouter>
      <Header 
        user={mockUser} 
        onLogout={mockOnLogout} 
        onToggleSidebar={mockOnToggleSidebar}
        {...props} 
      />
    </BrowserRouter>
  );
};

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render user name', () => {
    renderHeader();
    
    expect(screen.getByText('Admin Test')).toBeInTheDocument();
  });

  it('should render user role', () => {
    renderHeader();
    
    // Role is displayed in the header
    const roleElement = screen.getByText('admin');
    expect(roleElement).toBeInTheDocument();
  });

  it('should call onToggleSidebar when menu button is clicked', () => {
    renderHeader();
    
    const menuButton = screen.getByRole('button', { name: /toggle sidebar/i });
    fireEvent.click(menuButton);
    
    expect(mockOnToggleSidebar).toHaveBeenCalledTimes(1);
  });

  it('should display notifications icon', () => {
    renderHeader();
    
    const notificationIcon = document.querySelector('.bi-bell');
    expect(notificationIcon).toBeInTheDocument();
  });

  it('should show empty state when there are no notifications', () => {
    renderHeader({ notificationItems: [] });

    expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
    expect(screen.queryByText('3')).not.toBeInTheDocument();
  });

  it('should render notification badge and links', () => {
    renderHeader({
      notificationItems: [
        {
          id: 'doc-1',
          title: 'Documents à valider',
          message: '2 documents en attente',
          href: '/admin/documents/liste',
          variant: 'warning',
        },
      ],
      notificationsViewAllHref: '/admin/documents/liste',
    });

    expect(screen.getByText('1')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Notifications'));
    expect(screen.getByRole('link', { name: /Documents à valider/i })).toHaveAttribute(
      'href',
      '/admin/documents/liste'
    );
    expect(screen.getByRole('link', { name: /Voir le détail/i })).toHaveAttribute(
      'href',
      '/admin/documents/liste'
    );
  });

  it('should render search input', () => {
    renderHeader();
    
    const searchInput = screen.getByPlaceholderText(/rechercher/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('should handle search input', () => {
    renderHeader();
    
    const searchInput = screen.getByPlaceholderText(/rechercher/i);
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    
    expect(searchInput).toHaveValue('test search');
  });

  it('should render user avatar with initials', () => {
    renderHeader();
    
    // Avatar should show initials "AT" for "Admin Test"
    expect(screen.getByText('AT')).toBeInTheDocument();
  });

  it('should hide search when showSearch is false', () => {
    renderHeader({ showSearch: false });
    
    const searchInput = screen.queryByPlaceholderText(/rechercher/i);
    expect(searchInput).not.toBeInTheDocument();
  });
});
