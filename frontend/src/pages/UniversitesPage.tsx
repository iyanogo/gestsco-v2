/**
 * Page de gestion des universités
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import UniversitesList from '../components/universites/UniversitesList';
import UniversiteForm from '../components/universites/UniversiteForm';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useSnackbar } from '../hooks/useSnackbar';
import { handleApiError } from '../utils/errorHandler';
import {
  getUniversites,
  getUniversiteById,
  createUniversite,
  updateUniversite,
  deleteUniversite,
} from '../services';
import type { Universite, CreateUniversite, UpdateUniversite } from '../types/reference';

const UniversitesPage: React.FC = () => {
  const [universites, setUniversites] = useState<Universite[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUniversite, setSelectedUniversite] = useState<Universite | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();

  const loadUniversites = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getUniversites();
      setUniversites(data);
    } catch (error) {
      showError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadUniversites();
  }, [loadUniversites]);

  const handleCreate = () => {
    setSelectedUniversite(null);
    setDialogOpen(true);
  };

  const handleEdit = (universite: Universite) => {
    setSelectedUniversite(universite);
    setDialogOpen(true);
  };

  const handleView = async (id: number) => {
    try {
      const universite = await getUniversiteById(id);
      setSelectedUniversite(universite);
      setDialogOpen(true);
    } catch (error) {
      showError(handleApiError(error));
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;

    try {
      setSubmitting(true);
      await deleteUniversite(deleteId);
      showSuccess('Université supprimée avec succès');
      loadUniversites();
    } catch (error) {
      showError(handleApiError(error));
    } finally {
      setSubmitting(false);
      setDeleteDialogOpen(false);
      setDeleteId(null);
    }
  };

  const handleSubmit = async (data: CreateUniversite | UpdateUniversite) => {
    try {
      setSubmitting(true);
      if (selectedUniversite) {
        await updateUniversite(selectedUniversite.id, data as UpdateUniversite);
        showSuccess('Université modifiée avec succès');
      } else {
        await createUniversite(data as CreateUniversite);
        showSuccess('Université créée avec succès');
      }
      setDialogOpen(false);
      loadUniversites();
    } catch (error) {
      showError(handleApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setDialogOpen(false);
    setSelectedUniversite(null);
  };

  return (
    <Box>
      <Card>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <Typography variant="h5" component="h1">
              Gestion des Universités
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreate}
            >
              Nouvelle Université
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <UniversitesList
              universites={universites}
              loading={loading}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              onView={handleView}
            />
          )}
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onClose={handleCancel}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedUniversite ? 'Modifier l\'université' : 'Nouvelle université'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <UniversiteForm
              initialData={selectedUniversite}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loading={submitting}
            />
          </Box>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Confirmer la suppression"
        message="Êtes-vous sûr de vouloir supprimer cette université ? Cette action est irréversible."
        confirmText="Supprimer"
        confirmColor="error"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialogOpen(false)}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={closeSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UniversitesPage;
