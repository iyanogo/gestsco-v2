import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Card,
  CardContent,
  Grid,
  Snackbar,
  Alert,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import SallesList from '../components/emploiTemps/SallesList';
import SalleForm from '../components/emploiTemps/SalleForm';
import OccupationSalle from '../components/emploiTemps/OccupationSalle';
import { Salle, CreateSalle, UpdateSalle } from '../types/emploiTemps';
import { salleService } from '../services/salleService';
import { format } from 'date-fns';

const SallesPage: React.FC = () => {
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [planningDialogOpen, setPlanningDialogOpen] = useState(false);
  const [selectedSalle, setSelectedSalle] = useState<Salle | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleCreate = () => {
    setSelectedSalle(null);
    setFormDialogOpen(true);
  };

  const handleEdit = (salle: Salle) => {
    setSelectedSalle(salle);
    setFormDialogOpen(true);
  };

  const handleView = (salle: Salle) => {
    setSelectedSalle(salle);
    // TODO: Ouvrir un dialog de détails
  };

  const handlePlanning = (salle: Salle) => {
    setSelectedSalle(salle);
    setPlanningDialogOpen(true);
  };

  const handleDelete = async (salle: Salle) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la salle "${salle.libelle}" ?`)) {
      try {
        await salleService.deleteSalle(salle.id);
        setSnackbar({ open: true, message: 'Salle supprimée avec succès', severity: 'success' });
        setRefresh((r) => r + 1);
      } catch (error) {
        setSnackbar({ open: true, message: 'Erreur lors de la suppression', severity: 'error' });
      }
    }
  };

  const handleFormSubmit = async (data: CreateSalle | UpdateSalle) => {
    try {
      if (selectedSalle) {
        await salleService.updateSalle(selectedSalle.id, data as UpdateSalle);
        setSnackbar({ open: true, message: 'Salle modifiée avec succès', severity: 'success' });
      } else {
        await salleService.createSalle(data as CreateSalle);
        setSnackbar({ open: true, message: 'Salle créée avec succès', severity: 'success' });
      }
      setFormDialogOpen(false);
      setRefresh((r) => r + 1);
    } catch (error) {
      setSnackbar({ open: true, message: 'Erreur lors de l\'enregistrement', severity: 'error' });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Gestion des Salles</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
          Nouvelle Salle
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="primary">
                --
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total des salles
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="success.main">
                --
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Salles disponibles
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="info.main">
                --%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Taux d'occupation moyen
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <SallesList
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        onPlanning={handlePlanning}
        refresh={refresh}
      />

      <Dialog open={formDialogOpen} onClose={() => setFormDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedSalle ? 'Modifier la salle' : 'Nouvelle salle'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <SalleForm
              initialData={selectedSalle}
              onSubmit={handleFormSubmit}
              onCancel={() => setFormDialogOpen(false)}
            />
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={planningDialogOpen} onClose={() => setPlanningDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Planning d'occupation - {selectedSalle?.libelle}</DialogTitle>
        <DialogContent>
          {selectedSalle && (
            <OccupationSalle
              salleId={selectedSalle.id}
              date={format(new Date(), 'yyyy-MM-dd')}
            />
          )}
        </DialogContent>
      </Dialog>

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

export default SallesPage;
