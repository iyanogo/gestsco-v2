/**
 * Page de gestion des modules
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
import ModulesList from '../components/modules/ModulesList';
import ModuleForm from '../components/modules/ModuleForm';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useSnackbar } from '../hooks/useSnackbar';
import { handleApiError } from '../utils/errorHandler';
import { useAnneeStore } from '../store/anneeStore';
import {
  getModules,
  getModuleById,
  createModule,
  updateModule,
  deleteModule,
  getFilieres,
} from '../services';
import type { Module, CreateModule, UpdateModule, Filiere } from '../types/reference';

const ModulesPage: React.FC = () => {
  const { selectedAnnee } = useAnneeStore();
  const [modules, setModules] = useState<Module[]>([]);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [filterFiliereId, setFilterFiliereId] = useState<number | null>(null);

  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [modData, filData] = await Promise.all([
        getModules(),
        getFilieres(),
      ]);
      // Filtrer par année scolaire et filière
      let filteredModules = modData.filter(m => !m.annee || m.annee === selectedAnnee);
      if (filterFiliereId) {
        filteredModules = filteredModules.filter(m => m.filiere_id === filterFiliereId);
      }
      setModules(filteredModules);
      setFilieres(filData);
    } catch (error) {
      showError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  }, [showError, selectedAnnee, filterFiliereId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = () => {
    setSelectedModule(null);
    setDialogOpen(true);
  };

  const handleEdit = (module: Module) => {
    setSelectedModule(module);
    setDialogOpen(true);
  };

  const handleView = async (id: number) => {
    try {
      const module = await getModuleById(id);
      setSelectedModule(module);
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
      await deleteModule(deleteId);
      showSuccess('Module supprimé avec succès');
      loadData();
    } catch (error) {
      showError(handleApiError(error));
    } finally {
      setSubmitting(false);
      setDeleteDialogOpen(false);
      setDeleteId(null);
    }
  };

  const handleSubmit = async (data: CreateModule | UpdateModule) => {
    try {
      setSubmitting(true);
      if (selectedModule) {
        await updateModule(selectedModule.id, data as UpdateModule);
        showSuccess('Module modifié avec succès');
      } else {
        await createModule(data as CreateModule);
        showSuccess('Module créé avec succès');
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
    setSelectedModule(null);
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
              Gestion des Modules
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreate}
            >
              Nouveau Module
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <ModulesList
              modules={modules}
              filieres={filieres}
              loading={loading}
              selectedFiliereId={filterFiliereId}
              onFiliereFilter={setFilterFiliereId}
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
          {selectedModule ? 'Modifier le module' : 'Nouveau module'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <ModuleForm
              initialData={selectedModule}
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
        message="Êtes-vous sûr de vouloir supprimer ce module ? Cette action est irréversible."
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

export default ModulesPage;
