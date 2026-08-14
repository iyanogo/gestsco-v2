/**
 * Page pour créer un nouvel étudiant
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import EtudiantForm from '../components/etudiants/EtudiantForm';
import type { CreateEtudiant } from '../types/etudiant';
import { createEtudiant } from '../services/etudiantService';

const NouvelEtudiantPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const handleSubmit = async (data: CreateEtudiant) => {
    setLoading(true);
    try {
      const etudiant = await createEtudiant(data);
      setSnackbar({
        open: true,
        message: 'Étudiant créé avec succès',
        severity: 'success',
      });
      // Rediriger vers la page de détails après création
      setTimeout(() => {
        navigate(`/etudiants/${etudiant.id}`);
      }, 1500);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Erreur lors de la création',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/etudiants');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/etudiants')}>
          Retour à la liste
        </Button>
      </Box>

      <Typography variant="h4" component="h1" gutterBottom>
        Nouvel Étudiant
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Remplissez le formulaire pour inscrire un nouvel étudiant.
      </Typography>

      <Paper sx={{ p: 3 }}>
        <EtudiantForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NouvelEtudiantPage;
