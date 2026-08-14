import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  TextField,
} from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { PaiementsList } from '../components/finances';
import { Paiement } from '../types/finance';
import paiementFactureService from '../services/paiementFactureService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>{value === index && <Box sx={{ pt: 2 }}>{children}</Box>}</div>
);

const PaiementsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedPaiement, setSelectedPaiement] = useState<Paiement | null>(null);
  const [motifRejet, setMotifRejet] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleValidate = async (paiement: Paiement) => {
    if (!window.confirm('Valider ce paiement ?')) return;
    setLoading(true);
    try {
      await paiementFactureService.validerPaiement(paiement.id);
      setSnackbar({ open: true, message: 'Paiement validé avec succès', severity: 'success' });
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      setSnackbar({ open: true, message: 'Erreur lors de la validation', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRejectDialog = (paiement: Paiement) => {
    setSelectedPaiement(paiement);
    setMotifRejet('');
    setRejectDialogOpen(true);
  };

  const handleCloseRejectDialog = () => {
    setRejectDialogOpen(false);
    setSelectedPaiement(null);
    setMotifRejet('');
  };

  const handleReject = async () => {
    if (!selectedPaiement || !motifRejet) return;
    setLoading(true);
    try {
      await paiementFactureService.rejeterPaiement(selectedPaiement.id, motifRejet);
      setSnackbar({ open: true, message: 'Paiement rejeté', severity: 'warning' });
      handleCloseRejectDialog();
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      setSnackbar({ open: true, message: 'Erreur lors du rejet', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleViewPaiement = (paiement: Paiement) => {
    console.log('View paiement:', paiement);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Gestion des Paiements</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => setRefreshTrigger((prev) => prev + 1)}
          >
            Actualiser
          </Button>
          <Button variant="contained" startIcon={<AddIcon />}>
            Enregistrer un paiement
          </Button>
        </Box>
      </Box>

      <Box sx={{ mt: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Tous les paiements" />
          <Tab label="En attente de validation" />
          <Tab label="Validés" />
          <Tab label="Rejetés" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <PaiementsList
            onView={handleViewPaiement}
            onValidate={handleValidate}
            onReject={handleOpenRejectDialog}
            refreshTrigger={refreshTrigger}
          />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <PaiementsList
            onView={handleViewPaiement}
            onValidate={handleValidate}
            onReject={handleOpenRejectDialog}
            refreshTrigger={refreshTrigger}
          />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <PaiementsList
            onView={handleViewPaiement}
            refreshTrigger={refreshTrigger}
          />
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <PaiementsList
            onView={handleViewPaiement}
            refreshTrigger={refreshTrigger}
          />
        </TabPanel>
      </Box>

      <Dialog open={rejectDialogOpen} onClose={handleCloseRejectDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Rejeter le paiement</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography gutterBottom>
              Êtes-vous sûr de vouloir rejeter le paiement {selectedPaiement?.numero_paiement} ?
            </Typography>
            <TextField
              fullWidth
              required
              multiline
              rows={3}
              label="Motif du rejet"
              value={motifRejet}
              onChange={(e) => setMotifRejet(e.target.value)}
              sx={{ mt: 2 }}
            />
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
              <Button variant="outlined" onClick={handleCloseRejectDialog}>
                Annuler
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleReject}
                disabled={!motifRejet || loading}
              >
                Confirmer le rejet
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PaiementsPage;
