/**
 * Page de gestion des dossiers de candidature
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Card,
  CardContent,
  Grid,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  SelectChangeEvent,
} from '@mui/material';
import {
  Close as CloseIcon,
  Description as DossierIcon,
  CheckCircle as ValidIcon,
  School as AdmisIcon,
  HourglassEmpty as EnCoursIcon,
} from '@mui/icons-material';

import DossiersListAdmin from '../components/inscription/DossiersListAdmin';
import DossierDetailsAdmin from '../components/inscription/DossierDetailsAdmin';
import { CampagneInscription } from '../types/inscription';
import { dossierCandidatureService, campagneInscriptionService } from '../services';
import { getFilieres } from '../services/filiereService';
import { Filiere } from '../types/reference';

const DossiersAdminPage: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Stats
  const [stats] = useState({
    total: 0,
    en_cours: 0,
    complets: 0,
    valides: 0,
    admis: 0,
  });

  // Campagnes pour filtre
  const [, setCampagnes] = useState<CampagneInscription[]>([]);
  const [selectedCampagne] = useState<string>('');

  // Details dialog
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedDossierId, setSelectedDossierId] = useState<number | null>(null);

  // Refus dialog
  const [refusDialogOpen, setRefusDialogOpen] = useState(false);
  const [refusCommentaire, setRefusCommentaire] = useState('');
  const [refusDossierId, setRefusDossierId] = useState<number | null>(null);

  // Admission dialog
  const [admissionDialogOpen, setAdmissionDialogOpen] = useState(false);
  const [admissionDossierId, setAdmissionDossierId] = useState<number | null>(null);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [selectedFiliere, setSelectedFiliere] = useState<string>('');

  const handleRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const fetchCampagnes = async () => {
      try {
        const data = await campagneInscriptionService.getCampagnes();
        setCampagnes(data);
      } catch (error) {
        console.error('Erreur lors du chargement des campagnes:', error);
      }
    };
    fetchCampagnes();
  }, []);

  useEffect(() => {
    const fetchFilieres = async () => {
      try {
        const data = await getFilieres();
        setFilieres(data);
      } catch (error) {
        console.error('Erreur lors du chargement des filières:', error);
      }
    };
    fetchFilieres();
  }, []);

  const handleView = (id: number) => {
    setSelectedDossierId(id);
    setDetailsDialogOpen(true);
  };

  const handleValidate = async (id: number) => {
    try {
      await dossierCandidatureService.validerDossier(id);
      setSnackbar({ open: true, message: 'Dossier validé avec succès', severity: 'success' });
      handleRefresh();
      setDetailsDialogOpen(false);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Erreur lors de la validation',
        severity: 'error',
      });
    }
  };

  const handleOpenRefus = (id: number) => {
    setRefusDossierId(id);
    setRefusCommentaire('');
    setRefusDialogOpen(true);
  };

  const handleRefuse = async () => {
    if (!refusDossierId || !refusCommentaire.trim()) {
      setSnackbar({ open: true, message: 'Le commentaire est obligatoire', severity: 'error' });
      return;
    }

    try {
      await dossierCandidatureService.refuserDossier(refusDossierId, refusCommentaire);
      setSnackbar({ open: true, message: 'Dossier refusé', severity: 'success' });
      setRefusDialogOpen(false);
      setDetailsDialogOpen(false);
      handleRefresh();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Erreur lors du refus',
        severity: 'error',
      });
    }
  };

  const handleOpenAdmission = (id: number) => {
    setAdmissionDossierId(id);
    setSelectedFiliere('');
    setAdmissionDialogOpen(true);
  };

  const handleAdmit = async () => {
    if (!admissionDossierId || !selectedFiliere) {
      setSnackbar({ open: true, message: 'Veuillez sélectionner une filière', severity: 'error' });
      return;
    }

    try {
      await dossierCandidatureService.admettreCandidat(admissionDossierId, parseInt(selectedFiliere));
      setSnackbar({ open: true, message: 'Candidat admis avec succès', severity: 'success' });
      setAdmissionDialogOpen(false);
      setDetailsDialogOpen(false);
      handleRefresh();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Erreur lors de l\'admission',
        severity: 'error',
      });
    }
  };

  return (
    <Box>
      {/* En-tête */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Dossiers de candidature
        </Typography>
      </Box>

      {/* Statistiques */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <DossierIcon sx={{ color: '#1976d2', fontSize: 28, mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">{stats.total}</Typography>
              <Typography variant="body2" color="text.secondary">Total</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <EnCoursIcon sx={{ color: '#9e9e9e', fontSize: 28, mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">{stats.en_cours}</Typography>
              <Typography variant="body2" color="text.secondary">En cours</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <DossierIcon sx={{ color: '#ff9800', fontSize: 28, mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">{stats.complets}</Typography>
              <Typography variant="body2" color="text.secondary">Complets</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <ValidIcon sx={{ color: '#4caf50', fontSize: 28, mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">{stats.valides}</Typography>
              <Typography variant="body2" color="text.secondary">Validés</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <AdmisIcon sx={{ color: '#2196f3', fontSize: 28, mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">{stats.admis}</Typography>
              <Typography variant="body2" color="text.secondary">Admis</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Liste des dossiers */}
      <DossiersListAdmin
        campagneId={selectedCampagne ? parseInt(selectedCampagne) : null}
        onView={handleView}
        onValidate={handleValidate}
        onRefuse={handleOpenRefus}
        onAdmit={handleOpenAdmission}
        refreshTrigger={refreshTrigger}
      />

      {/* Dialog détails */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            Détails du dossier
            <IconButton onClick={() => setDetailsDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedDossierId && (
            <DossierDetailsAdmin
              dossierId={selectedDossierId}
              onValidate={() => handleValidate(selectedDossierId)}
              onRefuse={() => handleOpenRefus(selectedDossierId)}
              onAdmit={() => handleOpenAdmission(selectedDossierId)}
              onClose={() => setDetailsDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog refus */}
      <Dialog
        open={refusDialogOpen}
        onClose={() => setRefusDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Refuser le dossier</DialogTitle>
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
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button onClick={() => setRefusDialogOpen(false)}>Annuler</Button>
            <Button variant="contained" color="error" onClick={handleRefuse}>
              Refuser
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Dialog admission */}
      <Dialog
        open={admissionDialogOpen}
        onClose={() => setAdmissionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Admettre le candidat</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Filière d'admission</InputLabel>
            <Select
              value={selectedFiliere}
              label="Filière d'admission"
              onChange={(e: SelectChangeEvent) => setSelectedFiliere(e.target.value)}
            >
              {filieres.map((filiere) => (
                <MenuItem key={filiere.id} value={filiere.id.toString()}>
                  {filiere.libelle}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button onClick={() => setAdmissionDialogOpen(false)}>Annuler</Button>
            <Button variant="contained" color="primary" onClick={handleAdmit}>
              Admettre
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

export default DossiersAdminPage;
