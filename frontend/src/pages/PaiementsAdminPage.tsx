/**
 * Page de validation des paiements
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  TextField,
  Button,
  Alert,
  Snackbar,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

import PaiementsListAdmin from '../components/inscription/PaiementsListAdmin';
import { paiementService } from '../services';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const PaiementsAdminPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Validation dialog
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);
  const [validationPaiementId, setValidationPaiementId] = useState<number | null>(null);
  const [numeroRecu, setNumeroRecu] = useState('');

  // Refus dialog
  const [refusDialogOpen, setRefusDialogOpen] = useState(false);
  const [refusPaiementId, setRefusPaiementId] = useState<number | null>(null);
  const [refusCommentaire, setRefusCommentaire] = useState('');

  const handleRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handleOpenValidation = (id: number) => {
    setValidationPaiementId(id);
    setNumeroRecu('');
    setValidationDialogOpen(true);
  };

  const handleValidate = async () => {
    if (!validationPaiementId) return;

    try {
      await paiementService.validerPaiement(validationPaiementId, numeroRecu || undefined);
      setSnackbar({ open: true, message: 'Paiement validé avec succès', severity: 'success' });
      setValidationDialogOpen(false);
      handleRefresh();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Erreur lors de la validation',
        severity: 'error',
      });
    }
  };

  const handleOpenRefus = (id: number) => {
    setRefusPaiementId(id);
    setRefusCommentaire('');
    setRefusDialogOpen(true);
  };

  const handleRefuse = async () => {
    if (!refusPaiementId || !refusCommentaire.trim()) {
      setSnackbar({ open: true, message: 'Le commentaire est obligatoire', severity: 'error' });
      return;
    }

    try {
      await paiementService.refuserPaiement(refusPaiementId, refusCommentaire);
      setSnackbar({ open: true, message: 'Paiement refusé', severity: 'success' });
      setRefusDialogOpen(false);
      handleRefresh();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Erreur lors du refus',
        severity: 'error',
      });
    }
  };


  return (
    <Box>
      {/* En-tête */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Validation des paiements
        </Typography>
      </Box>

      {/* Onglets */}
      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 2 }}>
        <Tab label="En attente" />
        <Tab label="Validés" />
        <Tab label="Refusés" />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        <PaiementsListAdmin
          filterStatut="en_attente"
          onValidate={handleOpenValidation}
          onRefuse={handleOpenRefus}
          refreshTrigger={refreshTrigger}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <PaiementsListAdmin
          filterStatut="valide"
          refreshTrigger={refreshTrigger}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <PaiementsListAdmin
          filterStatut="refuse"
          refreshTrigger={refreshTrigger}
        />
      </TabPanel>

      {/* Dialog validation */}
      <Dialog
        open={validationDialogOpen}
        onClose={() => setValidationDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            Valider le paiement
            <IconButton onClick={() => setValidationDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Numéro de reçu (optionnel)"
            value={numeroRecu}
            onChange={(e) => setNumeroRecu(e.target.value)}
            placeholder="Entrez le numéro de reçu..."
            sx={{ mt: 2 }}
          />
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button onClick={() => setValidationDialogOpen(false)}>Annuler</Button>
            <Button variant="contained" color="success" onClick={handleValidate}>
              Valider
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Dialog refus */}
      <Dialog
        open={refusDialogOpen}
        onClose={() => setRefusDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            Refuser le paiement
            <IconButton onClick={() => setRefusDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Motif du refus"
            value={refusCommentaire}
            onChange={(e) => setRefusCommentaire(e.target.value)}
            placeholder="Indiquez le motif du refus..."
            sx={{ mt: 2 }}
          />
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button onClick={() => setRefusDialogOpen(false)}>Annuler</Button>
            <Button variant="contained" color="error" onClick={handleRefuse}>
              Refuser
            </Button>
          </Box>
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

export default PaiementsAdminPage;
