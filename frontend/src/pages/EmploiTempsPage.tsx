import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Paper,
  Grid,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
  Drawer,
} from '@mui/material';
import {
  Add as AddIcon,
  Repeat as RepeatIcon,
} from '@mui/icons-material';
import EmploiTempsGrid from '../components/emploiTemps/EmploiTempsGrid';
import SeanceForm from '../components/emploiTemps/SeanceForm';
import SeanceDetails from '../components/emploiTemps/SeanceDetails';
import { SeanceWithDetails, CreateSeance, UpdateSeance, CreateSeanceRecurrente, JourSemaine } from '../types/emploiTemps';
import { seanceService } from '../services/seanceService';
// import { emploiTempsService } from '../services/emploiTempsService';
import { format, startOfWeek } from 'date-fns';

const EmploiTempsPage: React.FC = () => {
  const [seances, setSeances] = useState<SeanceWithDetails[]>([]);
  const [, setLoading] = useState(true);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [selectedSeance, setSelectedSeance] = useState<SeanceWithDetails | null>(null);
  const [isRecurrent, setIsRecurrent] = useState(false);
  const [refresh, setRefresh] = useState(0);

  const [filters, setFilters] = useState({
    niveau_id: '',
    filiere_id: '',
    semestre: '1',
    annee_academique_id: '',
  });

  const [currentWeekStart] = useState<Date>(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // TODO: Charger depuis les services
  const [niveaux] = useState<any[]>([]);
  const [filieres] = useState<any[]>([]);
  const [anneesAcademiques] = useState<any[]>([]);

  useEffect(() => {
    if (filters.niveau_id) {
      loadSeances();
    }
  }, [filters, currentWeekStart, refresh]);

  const loadSeances = async () => {
    setLoading(true);
    try {
      const dateDebutStr = format(currentWeekStart, 'yyyy-MM-dd');
      const joursData = await seanceService.getSeancesSemaine(
        dateDebutStr,
        Number(filters.niveau_id),
        filters.filiere_id ? Number(filters.filiere_id) : undefined
      );
      const allSeances = joursData.flatMap((jour: JourSemaine) => jour.seances);
      setSeances(allSeances);
    } catch (error) {
      console.error('Erreur lors du chargement des séances:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSeance = () => {
    setSelectedSeance(null);
    setIsRecurrent(false);
    setFormDialogOpen(true);
  };

  const handleCreateRecurrent = () => {
    setSelectedSeance(null);
    setIsRecurrent(true);
    setFormDialogOpen(true);
  };

  const handleSeanceClick = (seance: SeanceWithDetails) => {
    setSelectedSeance(seance);
    setDetailsDrawerOpen(true);
  };

  const handleCellClick = (_jour: number, _creneauId: number) => {
    // Pré-remplir le formulaire avec le jour et créneau sélectionnés
    setSelectedSeance(null);
    setIsRecurrent(false);
    setFormDialogOpen(true);
  };

  const handleFormSubmit = async (data: CreateSeance | UpdateSeance | CreateSeanceRecurrente) => {
    try {
      if (selectedSeance) {
        await seanceService.updateSeance(selectedSeance.id, data as UpdateSeance);
        setSnackbar({ open: true, message: 'Séance modifiée avec succès', severity: 'success' });
      } else if ('seance_base' in data) {
        await seanceService.createSeanceRecurrente(data as CreateSeanceRecurrente);
        setSnackbar({ open: true, message: 'Séances récurrentes créées avec succès', severity: 'success' });
      } else {
        await seanceService.createSeance(data as CreateSeance);
        setSnackbar({ open: true, message: 'Séance créée avec succès', severity: 'success' });
      }
      setFormDialogOpen(false);
      setRefresh((r) => r + 1);
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Erreur lors de l\'enregistrement';
      setSnackbar({ open: true, message, severity: 'error' });
    }
  };

  const handleConfirmer = async () => {
    if (!selectedSeance) return;
    try {
      await seanceService.confirmerSeance(selectedSeance.id);
      setSnackbar({ open: true, message: 'Séance confirmée', severity: 'success' });
      setDetailsDrawerOpen(false);
      setRefresh((r) => r + 1);
    } catch (error) {
      setSnackbar({ open: true, message: 'Erreur lors de la confirmation', severity: 'error' });
    }
  };

  const handleAnnuler = async () => {
    if (!selectedSeance) return;
    const motif = window.prompt('Motif d\'annulation:');
    if (motif) {
      try {
        await seanceService.annulerSeance(selectedSeance.id, motif);
        setSnackbar({ open: true, message: 'Séance annulée', severity: 'success' });
        setDetailsDrawerOpen(false);
        setRefresh((r) => r + 1);
      } catch (error) {
        setSnackbar({ open: true, message: 'Erreur lors de l\'annulation', severity: 'error' });
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Emploi du Temps</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<RepeatIcon />} onClick={handleCreateRecurrent}>
            Séance récurrente
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateSeance}>
            Nouvelle séance
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Niveau"
              value={filters.niveau_id}
              onChange={(e) => setFilters({ ...filters, niveau_id: e.target.value })}
            >
              <MenuItem value="">Sélectionner un niveau</MenuItem>
              {niveaux.map((niveau) => (
                <MenuItem key={niveau.id} value={niveau.id}>
                  {niveau.libelle}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Filière"
              value={filters.filiere_id}
              onChange={(e) => setFilters({ ...filters, filiere_id: e.target.value })}
            >
              <MenuItem value="">Toutes les filières</MenuItem>
              {filieres.map((filiere) => (
                <MenuItem key={filiere.id} value={filiere.id}>
                  {filiere.libelle}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Semestre"
              value={filters.semestre}
              onChange={(e) => setFilters({ ...filters, semestre: e.target.value })}
            >
              <MenuItem value="1">Semestre 1</MenuItem>
              <MenuItem value="2">Semestre 2</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Année académique"
              value={filters.annee_academique_id}
              onChange={(e) => setFilters({ ...filters, annee_academique_id: e.target.value })}
            >
              <MenuItem value="">Sélectionner</MenuItem>
              {anneesAcademiques.map((annee) => (
                <MenuItem key={annee.id} value={annee.id}>
                  {annee.libelle}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {filters.niveau_id ? (
        <EmploiTempsGrid
          seances={seances}
          editable={true}
          onSeanceClick={handleSeanceClick}
          onCellClick={handleCellClick}
        />
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Sélectionnez un niveau pour afficher l'emploi du temps
          </Typography>
        </Paper>
      )}

      <Dialog open={formDialogOpen} onClose={() => setFormDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedSeance ? 'Modifier la séance' : isRecurrent ? 'Nouvelle séance récurrente' : 'Nouvelle séance'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <SeanceForm
              initialData={selectedSeance}
              niveauId={filters.niveau_id ? Number(filters.niveau_id) : undefined}
              filiereId={filters.filiere_id ? Number(filters.filiere_id) : undefined}
              semestre={Number(filters.semestre)}
              anneeAcademiqueId={filters.annee_academique_id ? Number(filters.annee_academique_id) : undefined}
              onSubmit={handleFormSubmit}
              onCancel={() => setFormDialogOpen(false)}
            />
          </Box>
        </DialogContent>
      </Dialog>

      <Drawer
        anchor="right"
        open={detailsDrawerOpen}
        onClose={() => setDetailsDrawerOpen(false)}
        PaperProps={{ sx: { width: 400 } }}
      >
        <Box sx={{ p: 2 }}>
          {selectedSeance && (
            <SeanceDetails
              seanceId={selectedSeance.id}
              onEdit={() => {
                setDetailsDrawerOpen(false);
                setFormDialogOpen(true);
              }}
              onConfirmer={handleConfirmer}
              onAnnuler={handleAnnuler}
            />
          )}
        </Box>
      </Drawer>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EmploiTempsPage;
