/**
 * Page de gestion des filières
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
import FilieresList from '../components/filieres/FilieresList';
import FiliereForm from '../components/filieres/FiliereForm';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useSnackbar } from '../hooks/useSnackbar';
import { handleApiError } from '../utils/errorHandler';
import { useAnneeStore } from '../store/anneeStore';
import {
  getFilieres,
  getFiliereById,
  createFiliere,
  updateFiliere,
  deleteFiliere,
  getEtablissements,
} from '../services';
import type { Filiere, CreateFiliere, UpdateFiliere, Etablissement } from '../types/reference';

const FilieresPage: React.FC = () => {
  const { selectedAnnee } = useAnneeStore();
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [etablissements, setEtablissements] = useState<Etablissement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFiliere, setSelectedFiliere] = useState<Filiere | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [filterEtablissementId, setFilterEtablissementId] = useState<number | null>(null);

  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [filData, etabData] = await Promise.all([
        getFilieres(),
        getEtablissements(),
      ]);
      // Filtrer par année scolaire et établissement
      let filteredFilieres = filData.filter(f => !f.annee || f.annee === selectedAnnee);
      if (filterEtablissementId) {
        filteredFilieres = filteredFilieres.filter(f => f.etablissement_id === filterEtablissementId);
      }
      setFilieres(filteredFilieres);
      setEtablissements(etabData);
    } catch (error) {
      showError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  }, [showError, selectedAnnee, filterEtablissementId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = () => {
    setSelectedFiliere(null);
    setDialogOpen(true);
  };

  const handleEdit = (filiere: Filiere) => {
    setSelectedFiliere(filiere);
    setDialogOpen(true);
  };

  const handleView = async (id: number) => {
    try {
      const filiere = await getFiliereById(id);
      setSelectedFiliere(filiere);
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
      await deleteFiliere(deleteId);
      showSuccess('Filière supprimée avec succès');
      loadData();
    } catch (error) {
      showError(handleApiError(error));
    } finally {
      setSubmitting(false);
      setDeleteDialogOpen(false);
      setDeleteId(null);
    }
  };

  const handleSubmit = async (data: CreateFiliere | UpdateFiliere) => {
    try {
      setSubmitting(true);
      if (selectedFiliere) {
        await updateFiliere(selectedFiliere.id, data as UpdateFiliere);
        showSuccess('Filière modifiée avec succès');
      } else {
        await createFiliere(data as CreateFiliere);
        showSuccess('Filière créée avec succès');
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
    setSelectedFiliere(null);
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
              Gestion des Filières
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreate}
            >
              Nouvelle Filière
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <FilieresList
              filieres={filieres}
              etablissements={etablissements}
              loading={loading}
              selectedEtablissementId={filterEtablissementId}
              onEtablissementFilter={setFilterEtablissementId}
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
          {selectedFiliere ? 'Modifier la filière' : 'Nouvelle filière'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FiliereForm
              initialData={selectedFiliere}
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
        message="Êtes-vous sûr de vouloir supprimer cette filière ? Cette action est irréversible."
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

export default FilieresPage;
