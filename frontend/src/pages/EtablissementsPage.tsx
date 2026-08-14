/**
 * Page de gestion des établissements
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
import EtablissementsList from '../components/etablissements/EtablissementsList';
import EtablissementForm from '../components/etablissements/EtablissementForm';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useSnackbar } from '../hooks/useSnackbar';
import { handleApiError } from '../utils/errorHandler';
import {
  getEtablissements,
  getEtablissementById,
  createEtablissement,
  updateEtablissement,
  deleteEtablissement,
  getUniversites,
} from '../services';
import type { Etablissement, CreateEtablissement, UpdateEtablissement, Universite } from '../types/reference';

const EtablissementsPage: React.FC = () => {
  const [etablissements, setEtablissements] = useState<Etablissement[]>([]);
  const [universites, setUniversites] = useState<Universite[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEtablissement, setSelectedEtablissement] = useState<Etablissement | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [filterUniversiteId, setFilterUniversiteId] = useState<number | null>(null);

  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [etabData, uniData] = await Promise.all([
        getEtablissements(filterUniversiteId ? { universite_id: filterUniversiteId } : undefined),
        getUniversites(),
      ]);
      setEtablissements(etabData);
      setUniversites(uniData);
    } catch (error) {
      showError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  }, [showError, filterUniversiteId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = () => {
    setSelectedEtablissement(null);
    setDialogOpen(true);
  };

  const handleEdit = (etablissement: Etablissement) => {
    setSelectedEtablissement(etablissement);
    setDialogOpen(true);
  };

  const handleView = async (id: number) => {
    try {
      const etablissement = await getEtablissementById(id);
      setSelectedEtablissement(etablissement);
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
      await deleteEtablissement(deleteId);
      showSuccess('Établissement supprimé avec succès');
      loadData();
    } catch (error) {
      showError(handleApiError(error));
    } finally {
      setSubmitting(false);
      setDeleteDialogOpen(false);
      setDeleteId(null);
    }
  };

  const handleSubmit = async (data: CreateEtablissement | UpdateEtablissement) => {
    try {
      setSubmitting(true);
      if (selectedEtablissement) {
        await updateEtablissement(selectedEtablissement.id, data as UpdateEtablissement);
        showSuccess('Établissement modifié avec succès');
      } else {
        await createEtablissement(data as CreateEtablissement);
        showSuccess('Établissement créé avec succès');
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
    setSelectedEtablissement(null);
  };

  const handleUniversiteFilter = (universiteId: number | null) => {
    setFilterUniversiteId(universiteId);
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
              Gestion des Établissements
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreate}
            >
              Nouvel Établissement
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <EtablissementsList
              etablissements={etablissements}
              universites={universites}
              loading={loading}
              selectedUniversiteId={filterUniversiteId}
              onUniversiteFilter={handleUniversiteFilter}
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
          {selectedEtablissement ? "Modifier l'établissement" : 'Nouvel établissement'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <EtablissementForm
              initialData={selectedEtablissement}
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
        message="Êtes-vous sûr de vouloir supprimer cet établissement ? Cette action est irréversible."
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

export default EtablissementsPage;
