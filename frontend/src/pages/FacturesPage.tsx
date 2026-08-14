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
import { FacturesList, PaiementForm, StatistiquesFinancesCard } from '../components/finances';
import { Facture, CreatePaiement } from '../types/finance';
import factureService from '../services/factureService';
import paiementFactureService from '../services/paiementFactureService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>{value === index && <Box sx={{ pt: 2 }}>{children}</Box>}</div>
);

const FacturesPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [paiementDialogOpen, setPaiementDialogOpen] = useState(false);
  const [annulerDialogOpen, setAnnulerDialogOpen] = useState(false);
  const [selectedFacture, setSelectedFacture] = useState<Facture | null>(null);
  const [motifAnnulation, setMotifAnnulation] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenPaiementDialog = (facture: Facture) => {
    setSelectedFacture(facture);
    setPaiementDialogOpen(true);
  };

  const handleClosePaiementDialog = () => {
    setPaiementDialogOpen(false);
    setSelectedFacture(null);
  };

  const handleOpenAnnulerDialog = (facture: Facture) => {
    setSelectedFacture(facture);
    setMotifAnnulation('');
    setAnnulerDialogOpen(true);
  };

  const handleCloseAnnulerDialog = () => {
    setAnnulerDialogOpen(false);
    setSelectedFacture(null);
    setMotifAnnulation('');
  };

  const handleSubmitPaiement = async (data: CreatePaiement) => {
    setLoading(true);
    try {
      await paiementFactureService.enregistrerPaiement(data);
      setSnackbar({ open: true, message: 'Paiement enregistré avec succès', severity: 'success' });
      handleClosePaiementDialog();
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      setSnackbar({ open: true, message: 'Erreur lors de l\'enregistrement du paiement', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAnnulerFacture = async () => {
    if (!selectedFacture || !motifAnnulation) return;
    setLoading(true);
    try {
      await factureService.annulerFacture(selectedFacture.id, motifAnnulation);
      setSnackbar({ open: true, message: 'Facture annulée', severity: 'success' });
      handleCloseAnnulerDialog();
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      setSnackbar({ open: true, message: 'Erreur lors de l\'annulation', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleViewFacture = (facture: Facture) => {
    window.open(`/finances/factures/${facture.id}`, '_blank');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Gestion des Factures</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => setRefreshTrigger((prev) => prev + 1)}
          >
            Actualiser
          </Button>
          <Button variant="contained" startIcon={<AddIcon />}>
            Nouvelle Facture
          </Button>
        </Box>
      </Box>

      <StatistiquesFinancesCard anneeId={null} />

      <Box sx={{ mt: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Toutes les factures" />
          <Tab label="Impayées" />
          <Tab label="Expirées" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <FacturesList
            onView={handleViewFacture}
            onPay={handleOpenPaiementDialog}
            onCancel={handleOpenAnnulerDialog}
            refreshTrigger={refreshTrigger}
          />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <FacturesList
            onView={handleViewFacture}
            onPay={handleOpenPaiementDialog}
            onCancel={handleOpenAnnulerDialog}
            refreshTrigger={refreshTrigger}
          />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <FacturesList
            onView={handleViewFacture}
            onPay={handleOpenPaiementDialog}
            onCancel={handleOpenAnnulerDialog}
            refreshTrigger={refreshTrigger}
          />
        </TabPanel>
      </Box>

      <Dialog open={paiementDialogOpen} onClose={handleClosePaiementDialog} maxWidth="md" fullWidth>
        <DialogTitle>Enregistrer un paiement</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <PaiementForm
              facture={selectedFacture}
              onSubmit={handleSubmitPaiement}
              onCancel={handleClosePaiementDialog}
              loading={loading}
            />
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={annulerDialogOpen} onClose={handleCloseAnnulerDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Annuler la facture</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography gutterBottom>
              Êtes-vous sûr de vouloir annuler la facture {selectedFacture?.numero_facture} ?
            </Typography>
            <TextField
              fullWidth
              required
              multiline
              rows={3}
              label="Motif d'annulation"
              value={motifAnnulation}
              onChange={(e) => setMotifAnnulation(e.target.value)}
              sx={{ mt: 2 }}
            />
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
              <Button variant="outlined" onClick={handleCloseAnnulerDialog}>
                Annuler
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleAnnulerFacture}
                disabled={!motifAnnulation || loading}
              >
                Confirmer l'annulation
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

export default FacturesPage;
