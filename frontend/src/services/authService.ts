import api from './api';
import { User, RegisterRequest, AuthResponse } from '@/types/auth';

const TOKEN_KEY = 'token';

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    console.log('[AuthService] Starting login for:', email);
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);

    try {
      const response = await api.post<AuthResponse>('/api/v1/auth/login', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      console.log('[AuthService] Login response:', response.data);

      if (response.data.access_token) {
        this.setToken(response.data.access_token);
        console.log('[AuthService] Token saved');
      }

      return response.data;
    } catch (error) {
      console.error('[AuthService] Login error:', error);
      throw error;
    }
  },

  async register(data: RegisterRequest): Promise<User> {
    const response = await api.post<User>('/api/v1/auth/register', data);
    return response.data;
  },

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/api/v1/auth/me');
    return response.data;
  },

  async getPermissionsMatrix(): Promise<
    Array<{ module: string; action: string; roles: string[] }>
  > {
    const response = await api.get<
      Array<{ module: string; action: string; roles: string[] }>
    >('/api/v1/auth/permissions-matrix');
    return response.data;
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.put<User>('/api/v1/auth/me', data);
    return response.data;
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};

export default authService;
