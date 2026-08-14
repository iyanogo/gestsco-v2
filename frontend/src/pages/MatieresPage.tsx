/**
 * Page de gestion des matières
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
import MatieresList from '../components/matieres/MatieresList';
import MatiereForm from '../components/matieres/MatiereForm';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useSnackbar } from '../hooks/useSnackbar';
import { handleApiError } from '../utils/errorHandler';
import { useAnneeStore } from '../store/anneeStore';
import {
  getMatieres,
  getMatiereById,
  createMatiere,
  updateMatiere,
  deleteMatiere,
  getModules,
} from '../services';
import type { Matiere, CreateMatiere, UpdateMatiere, Module } from '../types/reference';

const MatieresPage: React.FC = () => {
  const { selectedAnnee } = useAnneeStore();
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMatiere, setSelectedMatiere] = useState<Matiere | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [filterModuleId, setFilterModuleId] = useState<number | null>(null);

  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [matData, modData] = await Promise.all([
        getMatieres(),
        getModules(),
      ]);
      // Filtrer par année scolaire et module
      let filteredMatieres = matData.filter(m => !m.annee || m.annee === selectedAnnee);
      if (filterModuleId) {
        filteredMatieres = filteredMatieres.filter(m => m.module_id === filterModuleId);
      }
      setMatieres(filteredMatieres);
      setModules(modData);
    } catch (error) {
      showError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  }, [showError, selectedAnnee, filterModuleId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = () => {
    setSelectedMatiere(null);
    setDialogOpen(true);
  };

  const handleEdit = (matiere: Matiere) => {
    setSelectedMatiere(matiere);
    setDialogOpen(true);
  };

  const handleView = async (id: number) => {
    try {
      const matiere = await getMatiereById(id);
      setSelectedMatiere(matiere);
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
      await deleteMatiere(deleteId);
      showSuccess('Matière supprimée avec succès');
      loadData();
    } catch (error) {
      showError(handleApiError(error));
    } finally {
      setSubmitting(false);
      setDeleteDialogOpen(false);
      setDeleteId(null);
    }
  };

  const handleSubmit = async (data: CreateMatiere | UpdateMatiere) => {
    try {
      setSubmitting(true);
      if (selectedMatiere) {
        await updateMatiere(selectedMatiere.id, data as UpdateMatiere);
        showSuccess('Matière modifiée avec succès');
      } else {
        await createMatiere(data as CreateMatiere);
        showSuccess('Matière créée avec succès');
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
    setSelectedMatiere(null);
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
              Gestion des Matières
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreate}
            >
              Nouvelle Matière
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <MatieresList
              matieres={matieres}
              modules={modules}
              loading={loading}
              selectedModuleId={filterModuleId}
              onModuleFilter={setFilterModuleId}
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
          {selectedMatiere ? 'Modifier la matière' : 'Nouvelle matière'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <MatiereForm
              initialData={selectedMatiere}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loading={submitting}
              selectedAnnee={selectedAnnee}
            />
          </Box>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Confirmer la suppression"
        message="Êtes-vous sûr de vouloir supprimer cette matière ? Cette action est irréversible."
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

export default MatieresPage;
