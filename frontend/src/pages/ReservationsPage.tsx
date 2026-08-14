import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Tabs,
  Tab,
  Paper,
  Snackbar,
  Alert,
  TextField,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import ReservationsList from '../components/emploiTemps/ReservationsList';
import ReservationForm from '../components/emploiTemps/ReservationForm';
import { ReservationSalle, CreateReservationSalle, UpdateReservationSalle } from '../types/emploiTemps';
import { reservationSalleService } from '../services/reservationSalleService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

const ReservationsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [refuserDialogOpen, setRefuserDialogOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<ReservationSalle | null>(null);
  const [motifRefus, setMotifRefus] = useState('');
  const [refresh, setRefresh] = useState(0);

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleCreate = () => {
    setSelectedReservation(null);
    setFormDialogOpen(true);
  };

  const handleEdit = (reservation: ReservationSalle) => {
    setSelectedReservation(reservation);
    setFormDialogOpen(true);
  };

  const handleView = (reservation: ReservationSalle) => {
    setSelectedReservation(reservation);
    // TODO: Ouvrir un dialog de détails
  };

  const handleDelete = async (reservation: ReservationSalle) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette réservation ?')) {
      try {
        await reservationSalleService.deleteReservation(reservation.id);
        setSnackbar({ open: true, message: 'Réservation supprimée', severity: 'success' });
        setRefresh((r) => r + 1);
      } catch (error) {
        setSnackbar({ open: true, message: 'Erreur lors de la suppression', severity: 'error' });
      }
    }
  };

  const handleApprove = async (reservation: ReservationSalle) => {
    try {
      await reservationSalleService.approuverReservation(reservation.id);
      setSnackbar({ open: true, message: 'Réservation approuvée', severity: 'success' });
      setRefresh((r) => r + 1);
    } catch (error) {
      setSnackbar({ open: true, message: 'Erreur lors de l\'approbation', severity: 'error' });
    }
  };

  const handleRejectClick = (reservation: ReservationSalle) => {
    setSelectedReservation(reservation);
    setMotifRefus('');
    setRefuserDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedReservation || !motifRefus) return;
    try {
      await reservationSalleService.refuserReservation(selectedReservation.id, motifRefus);
      setSnackbar({ open: true, message: 'Réservation refusée', severity: 'success' });
      setRefuserDialogOpen(false);
      setRefresh((r) => r + 1);
    } catch (error) {
      setSnackbar({ open: true, message: 'Erreur lors du refus', severity: 'error' });
    }
  };

  const handleFormSubmit = async (data: CreateReservationSalle | UpdateReservationSalle) => {
    try {
      if (selectedReservation) {
        await reservationSalleService.updateReservation(selectedReservation.id, data as UpdateReservationSalle);
        setSnackbar({ open: true, message: 'Réservation modifiée', severity: 'success' });
      } else {
        await reservationSalleService.createReservation(data as CreateReservationSalle);
        setSnackbar({ open: true, message: 'Réservation créée', severity: 'success' });
      }
      setFormDialogOpen(false);
      setRefresh((r) => r + 1);
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Erreur lors de l\'enregistrement';
      setSnackbar({ open: true, message, severity: 'error' });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Réservations de Salles</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
          Nouvelle Réservation
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="Mes réservations" />
          <Tab label="Toutes les réservations" />
          <Tab label="En attente d'approbation" />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        <ReservationsList
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          showActions={true}
          refresh={refresh}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <ReservationsList
          onView={handleView}
          showActions={false}
          refresh={refresh}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <ReservationsList
          onApprove={handleApprove}
          onReject={handleRejectClick}
          onView={handleView}
          showActions={false}
          showApprovalActions={true}
          refresh={refresh}
        />
      </TabPanel>

      <Dialog open={formDialogOpen} onClose={() => setFormDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedReservation ? 'Modifier la réservation' : 'Nouvelle réservation'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <ReservationForm
              initialData={selectedReservation}
              onSubmit={handleFormSubmit}
              onCancel={() => setFormDialogOpen(false)}
            />
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={refuserDialogOpen} onClose={() => setRefuserDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Refuser la réservation</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Motif du refus"
            value={motifRefus}
            onChange={(e) => setMotifRefus(e.target.value)}
            sx={{ mt: 2 }}
            required
          />
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
            <Button variant="outlined" onClick={() => setRefuserDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleRejectConfirm}
              disabled={!motifRefus}
            >
              Refuser
            </Button>
          </Box>
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

export default ReservationsPage;
