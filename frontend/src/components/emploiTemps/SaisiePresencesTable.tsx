import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  Button,
  Typography,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import { format, parse } from 'date-fns';
import {
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { PresenceWithEtudiant, PresenceItem, STATUTS_PRESENCE } from '../../types/emploiTemps';
import { presenceService } from '../../services/presenceService';

interface SaisiePresencesTableProps {
  seanceId: number;
  onSaved?: () => void;
}

interface PresenceRow extends PresenceWithEtudiant {
  modified?: boolean;
}

const SaisiePresencesTable: React.FC<SaisiePresencesTableProps> = ({ seanceId, onSaved }) => {
  const [presences, setPresences] = useState<PresenceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadPresences();
  }, [seanceId]);

  const loadPresences = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await presenceService.getPresencesSeance(seanceId);
      setPresences(data.map((p) => ({ ...p, modified: false })));
    } catch (err) {
      console.error('Erreur lors du chargement des présences:', err);
      setError('Erreur lors du chargement des présences');
    } finally {
      setLoading(false);
    }
  };

  const handleStatutChange = (index: number, statut: string) => {
    setPresences((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, statut, modified: true } : p
      )
    );
  };

  const handleHeureArriveeChange = (index: number, heure: Date | null) => {
    setPresences((prev) =>
      prev.map((p, i) =>
        i === index
          ? { ...p, heure_arrivee: heure ? format(heure, 'HH:mm:ss') : undefined, modified: true }
          : p
      )
    );
  };

  const handleObservationChange = (index: number, observation: string) => {
    setPresences((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, observation, modified: true } : p
      )
    );
  };

  const setAllStatus = (statut: string) => {
    setPresences((prev) =>
      prev.map((p) => ({ ...p, statut, modified: true }))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const presencesData: PresenceItem[] = presences.map((p) => ({
        etudiant_id: p.etudiant_id,
        statut: p.statut,
        heure_arrivee: p.heure_arrivee,
        observation: p.observation,
      }));

      await presenceService.createPresencesBulk({
        seance_id: seanceId,
        presences: presencesData,
      });

      setSuccess(true);
      setPresences((prev) => prev.map((p) => ({ ...p, modified: false })));
      onSaved?.();
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      setError('Erreur lors de la sauvegarde des présences');
    } finally {
      setSaving(false);
    }
  };

  const stats = {
    total: presences.length,
    presents: presences.filter((p) => p.statut === 'present').length,
    absents: presences.filter((p) => p.statut === 'absent').length,
    retards: presences.filter((p) => p.statut === 'retard').length,
    justifies: presences.filter((p) => p.statut === 'absent_justifie').length,
  };

  const hasModifications = presences.some((p) => p.modified);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Box>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(false)}>
            Présences enregistrées avec succès
          </Alert>
        )}

        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                color="success"
                startIcon={<CheckIcon />}
                onClick={() => setAllStatus('present')}
              >
                Tous présents
              </Button>
              <Button
                variant="outlined"
                size="small"
                color="error"
                startIcon={<CancelIcon />}
                onClick={() => setAllStatus('absent')}
              >
                Tous absents
              </Button>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Chip label={`Total: ${stats.total}`} variant="outlined" />
              <Chip label={`Présents: ${stats.presents}`} color="success" size="small" />
              <Chip label={`Absents: ${stats.absents}`} color="error" size="small" />
              <Chip label={`Retards: ${stats.retards}`} color="warning" size="small" />
            </Box>
          </Box>
        </Paper>

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Matricule</TableCell>
                <TableCell>Nom</TableCell>
                <TableCell>Prénom</TableCell>
                <TableCell width={150}>Statut</TableCell>
                <TableCell width={140}>Heure d'arrivée</TableCell>
                <TableCell>Observation</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {presences.map((presence, index) => (
                <TableRow
                  key={presence.id || presence.etudiant_id}
                  sx={{
                    backgroundColor: presence.modified ? 'action.hover' : 'inherit',
                  }}
                >
                  <TableCell>{presence.etudiant_matricule}</TableCell>
                  <TableCell>{presence.etudiant_nom}</TableCell>
                  <TableCell>{presence.etudiant_prenom}</TableCell>
                  <TableCell>
                    <TextField
                      select
                      size="small"
                      fullWidth
                      value={presence.statut}
                      onChange={(e) => handleStatutChange(index, e.target.value)}
                    >
                      {STATUTS_PRESENCE.map((statut) => (
                        <MenuItem key={statut.value} value={statut.value}>
                          {statut.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </TableCell>
                  <TableCell>
                    {presence.statut === 'retard' ? (
                      <TimePicker
                        value={
                          presence.heure_arrivee
                            ? parse(presence.heure_arrivee, 'HH:mm:ss', new Date())
                            : null
                        }
                        onChange={(date) => handleHeureArriveeChange(index, date)}
                        slotProps={{
                          textField: { size: 'small', fullWidth: true },
                        }}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      fullWidth
                      value={presence.observation || ''}
                      onChange={(e) => handleObservationChange(index, e.target.value)}
                      placeholder="Observation..."
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            onClick={handleSave}
            disabled={saving || !hasModifications}
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default SaisiePresencesTable;
