/**
 * Page de détails d'un étudiant
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import EtudiantDetails from '../components/etudiants/EtudiantDetails';
import DocumentsList from '../components/etudiants/DocumentsList';
import DocumentForm from '../components/etudiants/DocumentForm';
import InscriptionsList from '../components/etudiants/InscriptionsList';
import InscriptionForm from '../components/etudiants/InscriptionForm';
import StatutDialog from '../components/etudiants/StatutDialog';
import PhotoUploadDialog from '../components/etudiants/PhotoUploadDialog';
import EtudiantForm from '../components/etudiants/EtudiantForm';
import type { Etudiant, CreateEtudiant, CreateDocumentEtudiant, CreateInscription } from '../types/etudiant';
import {
  getEtudiantById,
  updateEtudiant,
  deleteEtudiant,
  changeStatut,
  updatePhoto,
} from '../services/etudiantService';
import { createDocument } from '../services/documentEtudiantService';
import { createInscription } from '../services/inscriptionService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`etudiant-detail-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const EtudiantDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const etudiantId = parseInt(id || '0');

  const [etudiant, setEtudiant] = useState<Etudiant | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Dialogs
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [statutDialogOpen, setStatutDialogOpen] = useState(false);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [inscriptionDialogOpen, setInscriptionDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const loadEtudiant = useCallback(async () => {
    if (!etudiantId) return;
    setLoading(true);
    try {
      const data = await getEtudiantById(etudiantId);
      setEtudiant(data);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Erreur lors du chargement',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [etudiantId]);

  useEffect(() => {
    loadEtudiant();
  }, [loadEtudiant, refreshTrigger]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleBack = () => {
    navigate('/etudiants');
  };

  const handleEditSubmit = async (data: CreateEtudiant) => {
    setActionLoading(true);
    try {
      await updateEtudiant(etudiantId, data);
      setSnackbar({
        open: true,
        message: 'Étudiant modifié avec succès',
        severity: 'success',
      });
      setEditDialogOpen(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Erreur lors de la modification',
        severity: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatutChange = async (statut: string) => {
    setActionLoading(true);
    try {
      await changeStatut(etudiantId, statut);
      setSnackbar({
        open: true,
        message: 'Statut modifié avec succès',
        severity: 'success',
      });
      setStatutDialogOpen(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Erreur lors du changement de statut',
        severity: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePhotoUpdate = async (photoUrl: string) => {
    setActionLoading(true);
    try {
      await updatePhoto(etudiantId, photoUrl);
      setSnackbar({
        open: true,
        message: 'Photo mise à jour avec succès',
        severity: 'success',
      });
      setPhotoDialogOpen(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Erreur lors de la mise à jour de la photo',
        severity: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDocumentSubmit = async (data: CreateDocumentEtudiant) => {
    setActionLoading(true);
    try {
      await createDocument(data);
      setSnackbar({
        open: true,
        message: 'Document ajouté avec succès',
        severity: 'success',
      });
      setDocumentDialogOpen(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Erreur lors de l\'ajout du document',
        severity: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleInscriptionSubmit = async (data: CreateInscription) => {
    setActionLoading(true);
    try {
      await createInscription(data);
      setSnackbar({
        open: true,
        message: 'Inscription créée avec succès',
        severity: 'success',
      });
      setInscriptionDialogOpen(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Erreur lors de la création de l\'inscription',
        severity: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await deleteEtudiant(etudiantId);
      setSnackbar({
        open: true,
        message: 'Étudiant supprimé avec succès',
        severity: 'success',
      });
      navigate('/etudiants');
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Erreur lors de la suppression',
        severity: 'error',
      });
    } finally {
      setActionLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  if (!etudiant) {
    return (
      <Box>
        <Button startIcon={<BackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
          Retour à la liste
        </Button>
        <Alert severity="error">Étudiant non trouvé</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* En-tête */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<BackIcon />} onClick={handleBack}>
          Retour à la liste
        </Button>
        <Box>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => setEditDialogOpen(true)}
            sx={{ mr: 1 }}
          >
            Modifier
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteDialogOpen(true)}
          >
            Supprimer
          </Button>
        </Box>
      </Box>

      {/* Onglets */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Informations" />
          <Tab label="Documents" />
          <Tab label="Inscriptions" />
        </Tabs>
      </Paper>

      {/* Contenu des onglets */}
      <TabPanel value={tabValue} index={0}>
        <EtudiantDetails
          etudiantId={etudiantId}
          onEdit={() => setEditDialogOpen(true)}
          onChangePhoto={() => setPhotoDialogOpen(true)}
          onChangeStatut={() => setStatutDialogOpen(true)}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <DocumentsList
          etudiantId={etudiantId}
          onAddDocument={() => setDocumentDialogOpen(true)}
          onRefresh={() => setRefreshTrigger((prev) => prev + 1)}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <InscriptionsList
          etudiantId={etudiantId}
          onAddInscription={() => setInscriptionDialogOpen(true)}
          onRefresh={() => setRefreshTrigger((prev) => prev + 1)}
        />
      </TabPanel>

      {/* Dialog d'édition */}
      <StatutDialog
        open={statutDialogOpen}
        etudiant={etudiant}
        onClose={() => setStatutDialogOpen(false)}
        onConfirm={handleStatutChange}
        loading={actionLoading}
      />

      <PhotoUploadDialog
        open={photoDialogOpen}
        etudiantId={etudiantId}
        currentPhotoUrl={etudiant.photo_url}
        onClose={() => setPhotoDialogOpen(false)}
        onSuccess={handlePhotoUpdate}
        loading={actionLoading}
      />

      {/* Dialog d'édition de l'étudiant */}
      {editDialogOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0,0,0,0.5)',
            zIndex: 1300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Paper sx={{ p: 3, maxWidth: 800, width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Modifier l'étudiant
            </Typography>
            <EtudiantForm
              initialData={etudiant}
              onSubmit={handleEditSubmit}
              onCancel={() => setEditDialogOpen(false)}
              loading={actionLoading}
            />
          </Paper>
        </Box>
      )}

      {/* Dialog d'ajout de document */}
      {documentDialogOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0,0,0,0.5)',
            zIndex: 1300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Paper sx={{ p: 3, maxWidth: 600, width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Ajouter un document
            </Typography>
            <DocumentForm
              etudiantId={etudiantId}
              onSubmit={handleDocumentSubmit}
              onCancel={() => setDocumentDialogOpen(false)}
              loading={actionLoading}
            />
          </Paper>
        </Box>
      )}

      {/* Dialog d'ajout d'inscription */}
      {inscriptionDialogOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0,0,0,0.5)',
            zIndex: 1300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Paper sx={{ p: 3, maxWidth: 600, width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Nouvelle inscription
            </Typography>
            <InscriptionForm
              etudiantId={etudiantId}
              onSubmit={handleInscriptionSubmit}
              onCancel={() => setInscriptionDialogOpen(false)}
              loading={actionLoading}
            />
          </Paper>
        </Box>
      )}

      {/* Dialog de confirmation de suppression */}
      {deleteDialogOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0,0,0,0.5)',
            zIndex: 1300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Paper sx={{ p: 3, maxWidth: 400, width: '90%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Confirmer la suppression
            </Typography>
            <Typography sx={{ mb: 3 }}>
              Êtes-vous sûr de vouloir supprimer cet étudiant ? Cette action est irréversible.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button onClick={() => setDeleteDialogOpen(false)} disabled={actionLoading}>
                Annuler
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleDelete}
                disabled={actionLoading}
              >
                {actionLoading ? <CircularProgress size={24} /> : 'Supprimer'}
              </Button>
            </Box>
          </Paper>
        </Box>
      )}

      {/* Snackbar */}
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

export default EtudiantDetailsPage;
