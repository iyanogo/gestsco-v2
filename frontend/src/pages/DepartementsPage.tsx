/**
 * Page de gestion des départements
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
import DepartementsList from '../components/departements/DepartementsList';
import DepartementForm from '../components/departements/DepartementForm';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useSnackbar } from '../hooks/useSnackbar';
import { handleApiError } from '../utils/errorHandler';
import {
  getDepartements,
  getDepartementById,
  createDepartement,
  updateDepartement,
  deleteDepartement,
  getEtablissements,
} from '../services';
import type { Departement, CreateDepartement, UpdateDepartement, Etablissement } from '../types/reference';

const DepartementsPage: React.FC = () => {
  const [departements, setDepartements] = useState<Departement[]>([]);
  const [etablissements, setEtablissements] = useState<Etablissement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDepartement, setSelectedDepartement] = useState<Departement | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [filterEtablissementId, setFilterEtablissementId] = useState<number | null>(null);

  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [deptData, etabData] = await Promise.all([
        getDepartements(filterEtablissementId ? { etablissement_id: filterEtablissementId } : undefined),
        getEtablissements(),
      ]);
      setDepartements(deptData);
      setEtablissements(etabData);
    } catch (error) {
      showError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  }, [showError, filterEtablissementId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = () => {
    setSelectedDepartement(null);
    setDialogOpen(true);
  };

  const handleEdit = (departement: Departement) => {
    setSelectedDepartement(departement);
    setDialogOpen(true);
  };

  const handleView = async (id: number) => {
    try {
      const departement = await getDepartementById(id);
      setSelectedDepartement(departement);
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
      await deleteDepartement(deleteId);
      showSuccess('Département supprimé avec succès');
      loadData();
    } catch (error) {
      showError(handleApiError(error));
    } finally {
      setSubmitting(false);
      setDeleteDialogOpen(false);
      setDeleteId(null);
    }
  };

  const handleSubmit = async (data: CreateDepartement | UpdateDepartement) => {
    try {
      setSubmitting(true);
      if (selectedDepartement) {
        await updateDepartement(selectedDepartement.id, data as UpdateDepartement);
        showSuccess('Département modifié avec succès');
      } else {
        await createDepartement(data as CreateDepartement);
        showSuccess('Département créé avec succès');
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
    setSelectedDepartement(null);
  };

  const handleEtablissementFilter = (etablissementId: number | null) => {
    setFilterEtablissementId(etablissementId);
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
              Gestion des Départements
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreate}
            >
              Nouveau Département
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <DepartementsList
              departements={departements}
              etablissements={etablissements}
              loading={loading}
              selectedEtablissementId={filterEtablissementId}
              onEtablissementFilter={handleEtablissementFilter}
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
          {selectedDepartement ? 'Modifier le département' : 'Nouveau département'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <DepartementForm
              initialData={selectedDepartement}
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
        message="Êtes-vous sûr de vouloir supprimer ce département ? Cette action est irréversible."
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

export default DepartementsPage;
