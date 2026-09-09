import { create } from 'zustand';
import authService from '@/services/authService';
import {
  clearRuntimeModuleActions,
  setRuntimeModuleActionsFromRows,
  type RbacMatrixApiRow,
} from '@/utils/rbacActions';

interface RbacMatrixState {
  loaded: boolean;
  fromApi: boolean;
  loading: boolean;
  loadMatrix: () => Promise<void>;
  applyRows: (rows: RbacMatrixApiRow[]) => void;
  reset: () => void;
}

export const useRbacMatrixStore = create<RbacMatrixState>((set) => ({
  loaded: false,
  fromApi: false,
  loading: false,

  loadMatrix: async () => {
    if (!authService.isAuthenticated()) {
      clearRuntimeModuleActions();
      set({ loaded: false, fromApi: false, loading: false });
      return;
    }

    set({ loading: true });
    try {
      const rows = await authService.getPermissionsMatrix();
      setRuntimeModuleActionsFromRows(rows);
      set({ loaded: true, fromApi: true, loading: false });
    } catch {
      clearRuntimeModuleActions();
      set({ loaded: true, fromApi: false, loading: false });
    }
  },

  applyRows: (rows) => {
    setRuntimeModuleActionsFromRows(rows);
    set({ loaded: true, fromApi: true, loading: false });
  },

  reset: () => {
    clearRuntimeModuleActions();
    set({ loaded: false, fromApi: false, loading: false });
  },
}));

export default useRbacMatrixStore;
