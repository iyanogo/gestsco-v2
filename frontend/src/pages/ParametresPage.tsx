import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { ParametresList } from '../components/parametrage';
import parametreService from '../services/parametreService';
import { ParametreSysteme } from '../types/parametrage';

const ParametresPage: React.FC = () => {
  const [parametresParCategorie, setParametresParCategorie] = useState<Record<string, ParametreSysteme[]>>({});
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const loadParametres = async () => {
    setLoading(true);
    try {
      const data = await parametreService.getParCategorie();
      setParametresParCategorie(data);
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors du chargement des paramètres',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParametres();
  }, []);

  const handleUpdateValeur = async (cle: string, valeur: any) => {
    try {
      await parametreService.updateValeur(cle, valeur);
      setSnackbar({
        open: true,
        message: 'Paramètre mis à jour avec succès',
        severity: 'success',
      });
      loadParametres();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors de la mise à jour du paramètre',
        severity: 'error',
      });
    }
  };

  const handleInitialiser = async () => {
    try {
      const result = await parametreService.initialiser();
      setSnackbar({
        open: true,
        message: `${result.parametres_crees} paramètres initialisés`,
        severity: 'success',
      });
      loadParametres();
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors de l\'initialisation des paramètres',
        severity: 'error',
      });
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <SettingsIcon color="primary" />
          <Typography variant="h5">Paramètres Système</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleInitialiser}
          >
            Initialiser par défaut
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 3 }}>
        <ParametresList
          parametresParCategorie={parametresParCategorie}
          loading={loading}
          onUpdateValeur={handleUpdateValeur}
          onRefresh={loadParametres}
        />
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ParametresPage;
