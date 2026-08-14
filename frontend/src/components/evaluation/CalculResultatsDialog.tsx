import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Typography,
  LinearProgress,
  Alert,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';

import { SessionExamen } from '../../types/evaluation';
import sessionExamenService from '../../services/sessionExamenService';
import anneeAcademiqueService from '../../services/anneeAcademiqueService';
import { getNiveaux } from '../../services/niveauService';
import resultatService from '../../services/resultatService';

interface CalculResultatsDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type TypeCalcul = 'session' | 'semestre' | 'annuel';

const CalculResultatsDialog: React.FC<CalculResultatsDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [typeCalcul, setTypeCalcul] = useState<TypeCalcul>('session');
  const [sessions, setSessions] = useState<SessionExamen[]>([]);
  const [anneesAcademiques, setAnneesAcademiques] = useState<any[]>([]);
  const [niveaux, setNiveaux] = useState<any[]>([]);

  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [selectedSemestre, setSelectedSemestre] = useState<number>(1);
  const [selectedAnneeId, setSelectedAnneeId] = useState<number | null>(null);
  const [selectedNiveauId, setSelectedNiveauId] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);

  useEffect(() => {
    if (open) {
      loadData();
      setResult(null);
      setProgress(0);
    }
  }, [open]);

  const loadData = async () => {
    try {
      const [sessionsData, anneesData, niveauxData] = await Promise.all([
        sessionExamenService.getSessions(),
        anneeAcademiqueService.getAll(),
        getNiveaux(),
      ]);
      setSessions(sessionsData);
      setAnneesAcademiques(anneesData);
      setNiveaux(niveauxData);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    }
  };

  const handleCalculer = async () => {
    setLoading(true);
    setProgress(10);
    setResult(null);

    try {
      let response;

      switch (typeCalcul) {
        case 'session':
          if (!selectedSessionId) {
            setResult({ success: false, message: 'Veuillez sélectionner une session' });
            setLoading(false);
            return;
          }
          setProgress(30);
          response = await resultatService.calculerResultatsSession(selectedSessionId);
          break;

        case 'semestre':
          if (!selectedSessionId) {
            setResult({ success: false, message: 'Veuillez sélectionner une session' });
            setLoading(false);
            return;
          }
          setProgress(30);
          response = await resultatService.calculerResultatsSemestre(selectedSessionId, selectedSemestre);
          break;

        case 'annuel':
          if (!selectedNiveauId || !selectedAnneeId) {
            setResult({ success: false, message: 'Veuillez sélectionner un niveau et une année' });
            setLoading(false);
            return;
          }
          setProgress(30);
          response = await resultatService.calculerResultatsNiveau(selectedNiveauId, selectedAnneeId);
          break;
      }

      setProgress(100);
      setResult({
        success: true,
        message: response.message || 'Calcul terminé avec succès',
        count: response.count,
      });
      onSuccess?.();
    } catch (error: any) {
      setResult({
        success: false,
        message: error.response?.data?.detail || 'Erreur lors du calcul',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Calculer les Résultats</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {/* Type de calcul */}
          <FormControl component="fieldset" sx={{ mb: 3 }}>
            <FormLabel component="legend">Type de calcul</FormLabel>
            <RadioGroup
              row
              value={typeCalcul}
              onChange={(e) => setTypeCalcul(e.target.value as TypeCalcul)}
            >
              <FormControlLabel
                value="session"
                control={<Radio />}
                label="Résultats matières (session)"
                disabled={loading}
              />
              <FormControlLabel
                value="semestre"
                control={<Radio />}
                label="Résultats semestriels"
                disabled={loading}
              />
              <FormControlLabel
                value="annuel"
                control={<Radio />}
                label="Résultats annuels"
                disabled={loading}
              />
            </RadioGroup>
          </FormControl>

          {/* Paramètres selon le type */}
          {(typeCalcul === 'session' || typeCalcul === 'semestre') && (
            <TextField
              select
              fullWidth
              label="Session"
              value={selectedSessionId || ''}
              onChange={(e) => setSelectedSessionId(Number(e.target.value))}
              sx={{ mb: 2 }}
              disabled={loading}
            >
              {sessions.map((session) => (
                <MenuItem key={session.id} value={session.id}>
                  {session.code} - {session.libelle}
                </MenuItem>
              ))}
            </TextField>
          )}

          {typeCalcul === 'semestre' && (
            <TextField
              select
              fullWidth
              label="Semestre"
              value={selectedSemestre}
              onChange={(e) => setSelectedSemestre(Number(e.target.value))}
              sx={{ mb: 2 }}
              disabled={loading}
            >
              <MenuItem value={1}>Semestre 1</MenuItem>
              <MenuItem value={2}>Semestre 2</MenuItem>
            </TextField>
          )}

          {typeCalcul === 'annuel' && (
            <>
              <TextField
                select
                fullWidth
                label="Année Académique"
                value={selectedAnneeId || ''}
                onChange={(e) => setSelectedAnneeId(Number(e.target.value))}
                sx={{ mb: 2 }}
                disabled={loading}
              >
                {anneesAcademiques.map((annee) => (
                  <MenuItem key={annee.id} value={annee.id}>
                    {annee.libelle}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                fullWidth
                label="Niveau"
                value={selectedNiveauId || ''}
                onChange={(e) => setSelectedNiveauId(Number(e.target.value))}
                sx={{ mb: 2 }}
                disabled={loading}
              >
                {niveaux.map((niveau) => (
                  <MenuItem key={niveau.id} value={niveau.id}>
                    {niveau.libelle}
                  </MenuItem>
                ))}
              </TextField>
            </>
          )}

          {/* Barre de progression */}
          {loading && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Calcul en cours...
              </Typography>
              <LinearProgress variant="determinate" value={progress} />
            </Box>
          )}

          {/* Résultat */}
          {result && (
            <Alert severity={result.success ? 'success' : 'error'} sx={{ mt: 2 }}>
              {result.message}
              {result.count !== undefined && (
                <Typography variant="body2">
                  {result.count} résultat(s) calculé(s)
                </Typography>
              )}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Fermer
        </Button>
        <Button
          variant="contained"
          onClick={handleCalculer}
          disabled={loading}
        >
          {loading ? 'Calcul en cours...' : 'Calculer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CalculResultatsDialog;
