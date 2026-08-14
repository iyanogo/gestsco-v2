/**
 * Liste des inscriptions d'un étudiant
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  CheckCircle as ValidateIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import type { Inscription } from '../../types/etudiant';
import { STATUT_COLORS } from '../../types/etudiant';
import {
  getInscriptionsByEtudiant,
  validerInscription,
  annulerInscription,
} from '../../services/inscriptionService';

interface InscriptionsListProps {
  etudiantId: number;
  onAddInscription?: () => void;
  onViewDetails?: (id: number) => void;
  onRefresh?: () => void;
}

const InscriptionsList: React.FC<InscriptionsListProps> = ({
  etudiantId,
  onAddInscription,
  onViewDetails,
  onRefresh,
}) => {
  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchInscriptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getInscriptionsByEtudiant(etudiantId);
      setInscriptions(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors du chargement des inscriptions');
    } finally {
      setLoading(false);
    }
  }, [etudiantId]);

  useEffect(() => {
    fetchInscriptions();
  }, [fetchInscriptions]);

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
      await fetchInscriptions();
      onRefresh?.();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de la validation');
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
      await fetchInscriptions();
      onRefresh?.();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'annulation');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">Inscriptions ({inscriptions.length})</Typography>
        {onAddInscription && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAddInscription}
            size="small"
          >
            Nouvelle inscription
          </Button>
        )}
      </Stack>

      {inscriptions.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">Aucune inscription</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Année académique</TableCell>
                <TableCell>Filière</TableCell>
                <TableCell>Niveau</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Frais</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {inscriptions.map((insc) => (
                <TableRow key={insc.id}>
                  <TableCell>
                    <strong>{insc.annee_academique}</strong>
                  </TableCell>
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
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      {onViewDetails && (
                        <Tooltip title="Voir détails">
                          <IconButton
                            size="small"
                            onClick={() => onViewDetails(insc.id)}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
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
    </Box>
  );
};

export default InscriptionsList;
