/**
 * Page principale de gestion des étudiants
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  People as PeopleIcon,
  CheckCircle as ActiveIcon,
  Pause as SuspendedIcon,
  School as GraduatedIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import EtudiantsList from '../components/etudiants/EtudiantsList';
import EtudiantForm from '../components/etudiants/EtudiantForm';
import type { Etudiant, CreateEtudiant, EtudiantStatistiques } from '../types/etudiant';
import {
  createEtudiant,
  updateEtudiant,
  deleteEtudiant,
  getStatistiques,
} from '../services/etudiantService';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          <Typography variant="h4" sx={{ color }}>
            {value.toLocaleString('fr-FR')}
          </Typography>
        </Box>
        <Box
          sx={{
            backgroundColor: `${color}20`,
            borderRadius: '50%',
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const EtudiantsPage: React.FC = () => {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEtudiant, setSelectedEtudiant] = useState<Etudiant | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [etudiantToDelete, setEtudiantToDelete] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [stats, setStats] = useState<EtudiantStatistiques | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const loadStats = useCallback(async () => {
    try {
      const data = await getStatistiques();
      setStats(data);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats, refreshTrigger]);

  const handleOpenDialog = (etudiant?: Etudiant) => {
    setSelectedEtudiant(etudiant || null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedEtudiant(null);
  };

  const handleSubmit = async (data: CreateEtudiant) => {
    setLoading(true);
    try {
      if (selectedEtudiant) {
        await updateEtudiant(selectedEtudiant.id, data);
        setSnackbar({
          open: true,
          message: 'Étudiant modifié avec succès',
          severity: 'success',
        });
      } else {
        await createEtudiant(data);
        setSnackbar({
          open: true,
          message: 'Étudiant créé avec succès',
          severity: 'success',
        });
      }
      handleCloseDialog();
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Une erreur est survenue',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleView = (id: number) => {
    navigate(`/etudiants/${id}`);
  };

  const handleEdit = (etudiant: Etudiant) => {
    handleOpenDialog(etudiant);
  };

  const handleDeleteClick = (id: number) => {
    setEtudiantToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!etudiantToDelete) return;

    setLoading(true);
    try {
      await deleteEtudiant(etudiantToDelete);
      setSnackbar({
        open: true,
        message: 'Étudiant supprimé avec succès',
        severity: 'success',
      });
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Erreur lors de la suppression',
        severity: 'error',
      });
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setEtudiantToDelete(null);
    }
  };

  const getStatValue = (key: string): number => {
    if (!stats?.par_statut) return 0;
    return stats.par_statut[key] || 0;
  };

  return (
    <Box>
      {/* En-tête */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Gestion des Étudiants
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nouvel Étudiant
        </Button>
      </Box>

      {/* Statistiques */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Étudiants"
            value={stats?.total || 0}
            icon={<PeopleIcon sx={{ color: '#1976d2', fontSize: 32 }} />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Actifs"
            value={getStatValue('actif')}
            icon={<ActiveIcon sx={{ color: '#2e7d32', fontSize: 32 }} />}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Suspendus"
            value={getStatValue('suspendu')}
            icon={<SuspendedIcon sx={{ color: '#ed6c02', fontSize: 32 }} />}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Diplômés"
            value={getStatValue('diplômé') + getStatValue('diplome')}
            icon={<GraduatedIcon sx={{ color: '#0288d1', fontSize: 32 }} />}
            color="#0288d1"
          />
        </Grid>
      </Grid>

      {/* Liste des étudiants */}
      <Card>
        <CardContent>
          <EtudiantsList
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            onView={handleView}
            refreshTrigger={refreshTrigger}
          />
        </CardContent>
      </Card>

      {/* Dialog de création/édition */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedEtudiant ? 'Modifier l\'étudiant' : 'Nouvel étudiant'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <EtudiantForm
              initialData={selectedEtudiant}
              onSubmit={handleSubmit}
              onCancel={handleCloseDialog}
              loading={loading}
            />
          </Box>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer cet étudiant ? Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={loading}>
            Annuler
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>

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

export default EtudiantsPage;
