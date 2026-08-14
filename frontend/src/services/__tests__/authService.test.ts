import { authService } from '../authService';
import api from '../api';

jest.mock('../api');
const mockedApi = api as jest.Mocked<typeof api>;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

beforeEach(() => {
  jest.clearAllMocks();
  localStorageMock.clear();
});

describe('authService', () => {
  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      mockedApi.post.mockResolvedValue({
        data: {
          access_token: 'mock-token-admin',
          token_type: 'bearer',
        },
      });

      const result = await authService.login('admin@gestsco.com', 'password123');
      
      expect(result).toHaveProperty('access_token');
      expect(result.access_token).toBe('mock-token-admin');
      expect(mockedApi.post).toHaveBeenCalledWith(
        '/api/v1/auth/login',
        expect.any(URLSearchParams),
        expect.objectContaining({
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
      );
    });

    it('should save token to localStorage on successful login', async () => {
      mockedApi.post.mockResolvedValue({
        data: {
          access_token: 'mock-token-admin',
          token_type: 'bearer',
        },
      });

      await authService.login('admin@gestsco.com', 'password123');
      
      expect(localStorage.getItem('token')).toBe('mock-token-admin');
    });

    it('should throw error with invalid credentials', async () => {
      mockedApi.post.mockRejectedValue(new Error('Invalid credentials'));

      await expect(authService.login('invalid@email.com', 'wrongpassword'))
        .rejects.toThrow('Invalid credentials');
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user when authenticated', async () => {
      const mockUser = {
        id: 1,
        email: 'admin@gestsco.com',
        nom: 'Admin',
        prenom: 'Test',
        role: 'admin',
      };
      mockedApi.get.mockResolvedValue({ data: mockUser });

      const user = await authService.getCurrentUser();
      
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user.role).toBe('admin');
    });

    it('should throw error when not authenticated', async () => {
      mockedApi.get.mockRejectedValue(new Error('Not authenticated'));

      await expect(authService.getCurrentUser()).rejects.toThrow('Not authenticated');
    });
  });

  describe('logout', () => {
    it('should clear token from localStorage on logout', () => {
      localStorage.setItem('token', 'test-token');
      
      authService.logout();
      
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      localStorage.setItem('token', 'test-token');
      
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should return false when no token', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('getToken', () => {
    it('should return token from localStorage', () => {
      localStorage.setItem('token', 'my-token');
      
      expect(authService.getToken()).toBe('my-token');
    });

    it('should return null when no token', () => {
      expect(authService.getToken()).toBeNull();
    });
  });
});
