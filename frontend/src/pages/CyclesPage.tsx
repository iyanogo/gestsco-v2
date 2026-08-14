/**
 * Page de gestion des cycles
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
import CyclesList from '../components/cycles/CyclesList';
import CycleForm from '../components/cycles/CycleForm';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useSnackbar } from '../hooks/useSnackbar';
import { handleApiError } from '../utils/errorHandler';
import {
  getCycles,
  getCycleById,
  createCycle,
  updateCycle,
  deleteCycle,
} from '../services';
import type { Cycle, CreateCycle, UpdateCycle } from '../types/reference';

const CyclesPage: React.FC = () => {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<Cycle | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();

  const loadCycles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCycles();
      setCycles(data);
    } catch (error) {
      showError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadCycles();
  }, [loadCycles]);

  const handleCreate = () => {
    setSelectedCycle(null);
    setDialogOpen(true);
  };

  const handleEdit = (cycle: Cycle) => {
    setSelectedCycle(cycle);
    setDialogOpen(true);
  };

  const handleView = async (id: number) => {
    try {
      const cycle = await getCycleById(id);
      setSelectedCycle(cycle);
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
      await deleteCycle(deleteId);
      showSuccess('Cycle supprimé avec succès');
      loadCycles();
    } catch (error) {
      showError(handleApiError(error));
    } finally {
      setSubmitting(false);
      setDeleteDialogOpen(false);
      setDeleteId(null);
    }
  };

  const handleSubmit = async (data: CreateCycle | UpdateCycle) => {
    try {
      setSubmitting(true);
      if (selectedCycle) {
        await updateCycle(selectedCycle.id, data as UpdateCycle);
        showSuccess('Cycle modifié avec succès');
      } else {
        await createCycle(data as CreateCycle);
        showSuccess('Cycle créé avec succès');
      }
      setDialogOpen(false);
      loadCycles();
    } catch (error) {
      showError(handleApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setDialogOpen(false);
    setSelectedCycle(null);
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
              Gestion des Cycles
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreate}
            >
              Nouveau Cycle
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <CyclesList
              cycles={cycles}
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
          {selectedCycle ? 'Modifier le cycle' : 'Nouveau cycle'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <CycleForm
              initialData={selectedCycle}
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
        message="Êtes-vous sûr de vouloir supprimer ce cycle ? Cette action est irréversible."
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

export default CyclesPage;
