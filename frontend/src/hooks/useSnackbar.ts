/**
 * Custom hook pour gérer les notifications Snackbar
 */

import { useState, useCallback } from 'react';
import type { AlertColor } from '@mui/material';

interface SnackbarState {
  open: boolean;
  message: string;
  severity: AlertColor;
}

interface UseSnackbarReturn {
  snackbar: SnackbarState;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
  showWarning: (message: string) => void;
  closeSnackbar: () => void;
}

export function useSnackbar(): UseSnackbarReturn {
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info',
  });

  const showSuccess = useCallback((message: string) => {
    setSnackbar({ open: true, message, severity: 'success' });
  }, []);

  const showError = useCallback((message: string) => {
    setSnackbar({ open: true, message, severity: 'error' });
  }, []);

  const showInfo = useCallback((message: string) => {
    setSnackbar({ open: true, message, severity: 'info' });
  }, []);

  const showWarning = useCallback((message: string) => {
    setSnackbar({ open: true, message, severity: 'warning' });
  }, []);

  const closeSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  return {
    snackbar,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    closeSnackbar,
  };
}

export default useSnackbar;
