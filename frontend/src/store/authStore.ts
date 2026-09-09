import { create } from 'zustand';
import { User, RegisterRequest, AuthState } from '@/types/auth';
import authService from '@/services/authService';
import { useRbacMatrixStore } from '@/store/rbacMatrixStore';

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  setError: (error: string | null) => void;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: authService.getToken(),
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    console.log('[AuthStore] Starting login...');
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login(email, password);
      console.log('[AuthStore] Login response received:', response);
      set({ token: response.access_token, isAuthenticated: true, isLoading: false });
      
      // Try to get user info but don't block on failure
      try {
        const user = await authService.getCurrentUser();
        set({ user });
        void useRbacMatrixStore.getState().loadMatrix();
      } catch (userError) {
        console.warn('[AuthStore] Could not fetch user info:', userError);
      }
    } catch (error: any) {
      console.error('[AuthStore] Login error:', error);
      const message = error.response?.data?.detail || 'Erreur de connexion';
      set({ error: message, isLoading: false, isAuthenticated: false });
      throw error;
    }
  },

  register: async (data: RegisterRequest) => {
    set({ isLoading: true, error: null });
    try {
      await authService.register(data);
      set({ isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.detail || "Erreur lors de l'inscription";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  logout: () => {
    authService.logout();
    useRbacMatrixStore.getState().reset();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  loadUser: async () => {
    const token = authService.getToken();
    if (!token) {
      set({ isAuthenticated: false, user: null, isLoading: false });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const user = await authService.getCurrentUser();
      set({ user, isAuthenticated: true, isLoading: false, error: null });
      void useRbacMatrixStore.getState().loadMatrix();
    } catch (error) {
      authService.logout();
      useRbacMatrixStore.getState().reset();
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  updateProfile: async (data: Partial<User>) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.updateProfile(data);
      set({ user, isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Erreur lors de la mise à jour';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),
}));

export default useAuthStore;
