import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../auth/LoginPage';

jest.mock('../../../services/api');

const renderLoginPage = () => {
  return render(
    <BrowserRouter>
      <LoginPage />
    </BrowserRouter>
  );
};

describe('LoginPage', () => {
  describe('rendering', () => {
    it('should render login form', () => {
      renderLoginPage();
      
      // Check for email input
      expect(screen.getByPlaceholderText(/email|utilisateur/i)).toBeInTheDocument();
      // Check for submit button
      expect(screen.getByRole('button', { name: /connexion|login|se connecter/i })).toBeInTheDocument();
    });

    it('should render quick access buttons for demo', () => {
      renderLoginPage();
      
      expect(screen.getByText(/SuperAdmin/i)).toBeInTheDocument();
      // Admin appears in SuperAdmin too, so use getAllByText
      expect(screen.getAllByText(/Admin/).length).toBeGreaterThan(0);
    });

    it('should render logo and title', () => {
      renderLoginPage();
      
      // Multiple elements may match - use getAllByText
      expect(screen.getAllByText(/GestSco/i).length).toBeGreaterThan(0);
    });
  });

  describe('form interaction', () => {
    it('should allow typing in email field', () => {
      renderLoginPage();
      
      const emailInput = screen.getByPlaceholderText(/email|utilisateur/i);
      fireEvent.change(emailInput, { target: { value: 'test@email.com' } });
      
      expect(emailInput).toHaveValue('test@email.com');
    });
  });

  describe('quick access buttons', () => {
    it('should fill form with SuperAdmin credentials on click', () => {
      renderLoginPage();
      
      const superAdminButton = screen.getByText(/SuperAdmin/i);
      fireEvent.click(superAdminButton);
      
      const emailInput = screen.getByPlaceholderText(/email|utilisateur/i);
      expect(emailInput).toHaveValue('superadmin@gestsco.com');
    });
  });
});
