/**
 * Page de gestion des années scolaires
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
import AnneeScolairesList from '../components/annees-scolaires/AnneeScolairesList';
import AnneeScolaireForm from '../components/annees-scolaires/AnneeScolaireForm';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useSnackbar } from '../hooks/useSnackbar';
import { handleApiError } from '../utils/errorHandler';
import { useAnneeStore } from '../store/anneeStore';
import {
  getAnneesScolaires,
  getAnneeScolaireById,
  createAnneeScolaire,
  updateAnneeScolaire,
  deleteAnneeScolaire,
} from '../services';
import type { Annee, CreateAnnee, UpdateAnnee } from '../types/reference';

const AnneesScolairesPage: React.FC = () => {
  const { setAvailableAnnees, initFromActiveAnnee } = useAnneeStore();
  const [annees, setAnnees] = useState<Annee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAnnee, setSelectedAnnee] = useState<Annee | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAnneesScolaires();
      setAnnees(data);
      setAvailableAnnees(data);
      
      // Initialiser avec l'année active
      const activeAnnee = data.find(a => a.statut);
      if (activeAnnee) {
        initFromActiveAnnee(activeAnnee);
      }
    } catch (error) {
      showError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  }, [showError, setAvailableAnnees, initFromActiveAnnee]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = () => {
    setSelectedAnnee(null);
    setDialogOpen(true);
  };

  const handleEdit = (annee: Annee) => {
    setSelectedAnnee(annee);
    setDialogOpen(true);
  };

  const handleView = async (id: number) => {
    try {
      const annee = await getAnneeScolaireById(id);
      setSelectedAnnee(annee);
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
      await deleteAnneeScolaire(deleteId);
      showSuccess('Année scolaire supprimée avec succès');
      loadData();
    } catch (error) {
      showError(handleApiError(error));
    } finally {
      setSubmitting(false);
      setDeleteDialogOpen(false);
      setDeleteId(null);
    }
  };

  const handleSubmit = async (data: CreateAnnee | UpdateAnnee) => {
    try {
      setSubmitting(true);
      if (selectedAnnee) {
        await updateAnneeScolaire(selectedAnnee.id, data as UpdateAnnee);
        showSuccess('Année scolaire modifiée avec succès');
      } else {
        await createAnneeScolaire(data as CreateAnnee);
        showSuccess('Année scolaire créée avec succès');
      }
      setDialogOpen(false);
      loadData();
    } catch (error) {
      showError(handleApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setDialogOpen(false);
    setSelectedAnnee(null);
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
              Gestion des Années Scolaires
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreate}
            >
              Nouvelle Année
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <AnneeScolairesList
              annees={annees}
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
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedAnnee ? 'Modifier l\'année scolaire' : 'Nouvelle année scolaire'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <AnneeScolaireForm
              initialData={selectedAnnee}
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
        message="Êtes-vous sûr de vouloir supprimer cette année scolaire ? Cette action est irréversible."
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

export default AnneesScolairesPage;
