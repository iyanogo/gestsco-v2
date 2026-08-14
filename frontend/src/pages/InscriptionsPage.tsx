/**
 * Page pour gérer les inscriptions
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  Stack,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from '@mui/material';
import {
  CheckCircle as ValidateIcon,
  Cancel as CancelIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { Inscription } from '../types/etudiant';
import { STATUT_COLORS, STATUTS_INSCRIPTION } from '../types/etudiant';
import {
  getInscriptions,
  validerInscription,
  annulerInscription,
} from '../services/inscriptionService';
import { useAnneeStore } from '../store/anneeStore';

const InscriptionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedAnnee } = useAnneeStore();
  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState<string>('');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const fetchInscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (selectedAnnee) {
        params.annee_academique = selectedAnnee;
      }
      if (statutFilter) {
        params.statut = statutFilter;
      }
      const data = await getInscriptions(params);
      setInscriptions(data);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Erreur lors du chargement',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [selectedAnnee, statutFilter]);

  useEffect(() => {
    fetchInscriptions();
  }, [fetchInscriptions]);

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR');
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount?: number): string => {
    if (amount === undefined || amount === null) return '-';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleValider = async (id: number) => {
    setActionLoading(id);
    try {
      await validerInscription(id);
      setSnackbar({
        open: true,
        message: 'Inscription validée avec succès',
        severity: 'success',
      });
      await fetchInscriptions();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Erreur lors de la validation',
        severity: 'error',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleAnnuler = async (id: number) => {
    const raison = prompt('Raison de l\'annulation:');
    if (!raison) return;

    setActionLoading(id);
    try {
      await annulerInscription(id, raison);
      setSnackbar({
        open: true,
        message: 'Inscription annulée',
        severity: 'success',
      });
      await fetchInscriptions();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Erreur lors de l\'annulation',
        severity: 'error',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewEtudiant = (etudiantId: number) => {
    navigate(`/etudiants/${etudiantId}`);
  };

  const filteredInscriptions = inscriptions.filter((insc) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      insc.annee_academique?.toLowerCase().includes(searchLower) ||
      insc.type_inscription?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Inscriptions
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {selectedAnnee ? `Année académique: ${selectedAnnee}` : 'Toutes les années'} - {inscriptions.length} inscription(s)
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/etudiants')}
        >
          Nouvelle inscription
        </Button>
      </Box>

      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <TextField
          size="small"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 300 }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Statut</InputLabel>
          <Select
            value={statutFilter}
            label="Statut"
            onChange={(e) => setStatutFilter(e.target.value)}
          >
            <MenuItem value="">Tous</MenuItem>
            {STATUTS_INSCRIPTION.map((statut) => (
              <MenuItem key={statut} value={statut}>
                {statut.charAt(0).toUpperCase() + statut.slice(1).replace('_', ' ')}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {filteredInscriptions.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            {inscriptions.length === 0
              ? 'Aucune inscription trouvée'
              : 'Aucune inscription ne correspond à votre recherche'}
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Année académique</TableCell>
                <TableCell>Étudiant ID</TableCell>
                <TableCell>Filière</TableCell>
                <TableCell>Niveau</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Frais</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Date inscription</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInscriptions.map((insc) => (
                <TableRow key={insc.id} hover>
                  <TableCell>
                    <strong>{insc.annee_academique}</strong>
                  </TableCell>
                  <TableCell>{insc.etudiant_id}</TableCell>
                  <TableCell>{insc.filiere_id || '-'}</TableCell>
                  <TableCell>{insc.niveau_id || '-'}</TableCell>
                  <TableCell>{insc.type_inscription || '-'}</TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatCurrency(insc.frais_payes)} / {formatCurrency(insc.frais_inscription)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={insc.statut_inscription || 'en_cours'}
                      size="small"
                      color={STATUT_COLORS[insc.statut_inscription || 'en_cours'] || 'default'}
                    />
                  </TableCell>
                  <TableCell>{formatDate(insc.date_inscription)}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Tooltip title="Voir l'étudiant">
                        <IconButton
                          size="small"
                          onClick={() => handleViewEtudiant(insc.etudiant_id)}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {insc.statut_inscription === 'en_cours' && (
                        <>
                          <Tooltip title="Valider">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleValider(insc.id)}
                              disabled={actionLoading === insc.id}
                            >
                              <ValidateIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Annuler">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleAnnuler(insc.id)}
                              disabled={actionLoading === insc.id}
                            >
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

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

export default InscriptionsPage;
