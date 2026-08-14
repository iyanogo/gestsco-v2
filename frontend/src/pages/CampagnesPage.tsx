/**
 * Page de gestion des campagnes d'inscription
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Card,
  CardContent,
  Grid,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
  Campaign as CampaignIcon,
  PlayArrow as OpenIcon,
  Description as DossierIcon,
} from '@mui/icons-material';

import CampagnesList from '../components/inscription/CampagnesList';
import CampagneForm from '../components/inscription/CampagneForm';
import StatistiquesInscription from '../components/inscription/StatistiquesInscription';
import { CampagneInscription, CreateCampagneInscription, UpdateCampagneInscription } from '../types/inscription';
import { campagneInscriptionService } from '../services';

const CampagnesPage: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCampagne, setSelectedCampagne] = useState<CampagneInscription | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Stats dialog
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [statsCampagneId, setStatsCampagneId] = useState<number | null>(null);

  const handleRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handleOpenCreate = () => {
    setSelectedCampagne(null);
    setOpenDialog(true);
  };

  const handleEdit = (campagne: CampagneInscription) => {
    setSelectedCampagne(campagne);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCampagne(null);
  };

  const handleSubmit = async (data: CreateCampagneInscription | UpdateCampagneInscription) => {
    try {
      if (selectedCampagne) {
        await campagneInscriptionService.updateCampagne(selectedCampagne.id, data);
        setSnackbar({ open: true, message: 'Campagne modifiée avec succès', severity: 'success' });
      } else {
        await campagneInscriptionService.createCampagne(data as CreateCampagneInscription);
        setSnackbar({ open: true, message: 'Campagne créée avec succès', severity: 'success' });
      }
      handleCloseDialog();
      handleRefresh();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Une erreur est survenue',
        severity: 'error',
      });
      throw error;
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette campagne ?')) return;
    
    try {
      await campagneInscriptionService.deleteCampagne(id);
      setSnackbar({ open: true, message: 'Campagne supprimée avec succès', severity: 'success' });
      handleRefresh();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Erreur lors de la suppression',
        severity: 'error',
      });
    }
  };

  const handleView = (id: number) => {
    // Navigate to details or open dialog
    setStatsCampagneId(id);
    setStatsDialogOpen(true);
  };

  const handleStats = (id: number) => {
    setStatsCampagneId(id);
    setStatsDialogOpen(true);
  };

  return (
    <Box>
      {/* En-tête */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" fontWeight="bold">
          Campagnes d'inscription
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
        >
          Nouvelle Campagne
        </Button>
      </Box>

      {/* Statistiques rapides */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ backgroundColor: '#e3f2fd', borderRadius: 2, p: 1.5 }}>
                <CampaignIcon sx={{ color: '#1976d2', fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total campagnes
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  -
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ backgroundColor: '#e8f5e9', borderRadius: 2, p: 1.5 }}>
                <OpenIcon sx={{ color: '#4caf50', fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Campagnes ouvertes
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  -
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ backgroundColor: '#fff3e0', borderRadius: 2, p: 1.5 }}>
                <DossierIcon sx={{ color: '#ff9800', fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Dossiers reçus
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  -
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Liste des campagnes */}
      <CampagnesList
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        onStats={handleStats}
        refreshTrigger={refreshTrigger}
      />

      {/* Dialog création/modification */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            {selectedCampagne ? 'Modifier la campagne' : 'Nouvelle campagne'}
            <IconButton onClick={handleCloseDialog}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <CampagneForm
            initialData={selectedCampagne}
            onSubmit={handleSubmit}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog statistiques */}
      <Dialog
        open={statsDialogOpen}
        onClose={() => setStatsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            Statistiques de la campagne
            <IconButton onClick={() => setStatsDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <StatistiquesInscription campagneId={statsCampagneId} />
        </DialogContent>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CampagnesPage;
