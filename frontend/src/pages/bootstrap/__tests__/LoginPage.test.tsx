import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../auth/LoginPage';

const mockLogin = jest.fn();

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    isAuthenticated: false,
    isLoading: false,
    user: null,
  }),
}));

const renderLoginPage = () => {
  return render(
    <BrowserRouter>
      <LoginPage />
    </BrowserRouter>
  );
};

describe('LoginPage', () => {
  beforeEach(() => {
    mockLogin.mockReset();
  });

  describe('rendering', () => {
    it('should render login form', () => {
      renderLoginPage();

      expect(screen.getByPlaceholderText(/votre@email.com/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument();
    });

    it('should render demo account buttons', () => {
      renderLoginPage();

      expect(screen.getByRole('button', { name: /Admin/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Scolarité/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Comptable/i })).toBeInTheDocument();
    });

    it('should render logo and title', () => {
      renderLoginPage();

      expect(screen.getAllByText(/GestSco/i).length).toBeGreaterThan(0);
    });
  });

  describe('form interaction', () => {
    it('should allow typing in email field', () => {
      renderLoginPage();

      const emailInput = screen.getByPlaceholderText(/votre@email.com/i);
      fireEvent.change(emailInput, { target: { value: 'test@email.com' } });

      expect(emailInput).toHaveValue('test@email.com');
    });

    it('should call login on submit', async () => {
      mockLogin.mockResolvedValue(undefined);
      renderLoginPage();

      fireEvent.change(screen.getByPlaceholderText(/votre@email.com/i), {
        target: { value: 'admin@gestsco.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('••••••••'), {
        target: { value: 'Admin@123' },
      });
      fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));

      expect(mockLogin).toHaveBeenCalledWith('admin@gestsco.com', 'Admin@123');
    });
  });

  describe('quick access buttons', () => {
    it('should fill form with admin credentials on click', () => {
      renderLoginPage();

      fireEvent.click(screen.getByRole('button', { name: /^Admin$/i }));

      expect(screen.getByPlaceholderText(/votre@email.com/i)).toHaveValue('admin@gestsco.com');
    });
  });
});
