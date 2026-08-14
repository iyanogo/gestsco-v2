import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Alert,
  Snackbar,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { TypesFraisList, TypeFraisForm } from '../components/finances';
import { TypeFrais, CreateTypeFrais, UpdateTypeFrais } from '../types/finance';
import typeFraisService from '../services/typeFraisService';

const TypesFraisPage: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTypeFrais, setSelectedTypeFrais] = useState<TypeFrais | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleOpenDialog = (typeFrais?: TypeFrais) => {
    setSelectedTypeFrais(typeFrais || null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedTypeFrais(null);
  };

  const handleSubmit = async (data: CreateTypeFrais | UpdateTypeFrais) => {
    setLoading(true);
    try {
      if (selectedTypeFrais) {
        await typeFraisService.updateTypeFrais(selectedTypeFrais.id, data);
        setSnackbar({ open: true, message: 'Type de frais modifié avec succès', severity: 'success' });
      } else {
        await typeFraisService.createTypeFrais(data as CreateTypeFrais);
        setSnackbar({ open: true, message: 'Type de frais créé avec succès', severity: 'success' });
      }
      handleCloseDialog();
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      setSnackbar({ open: true, message: 'Une erreur est survenue', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (typeFrais: TypeFrais) => {
    if (!window.confirm(`Supprimer le type de frais "${typeFrais.libelle}" ?`)) return;
    try {
      await typeFraisService.deleteTypeFrais(typeFrais.id);
      setSnackbar({ open: true, message: 'Type de frais supprimé', severity: 'success' });
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      setSnackbar({ open: true, message: 'Erreur lors de la suppression', severity: 'error' });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Types de Frais</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nouveau Type de Frais
        </Button>
      </Box>

      <TypesFraisList
        onEdit={handleOpenDialog}
        onDelete={handleDelete}
        refreshTrigger={refreshTrigger}
      />

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedTypeFrais ? 'Modifier le type de frais' : 'Nouveau type de frais'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TypeFraisForm
              initialData={selectedTypeFrais}
              onSubmit={handleSubmit}
              onCancel={handleCloseDialog}
              loading={loading}
            />
          </Box>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TypesFraisPage;
