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
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  FormGroup,
  CircularProgress,
  Alert,
} from '@mui/material';

import { SessionExamen } from '../../types/evaluation';
import sessionExamenService from '../../services/sessionExamenService';
import { getNiveaux } from '../../services/niveauService';
import { getFilieres } from '../../services/filiereService';

interface ExportResultatsDialogProps {
  open: boolean;
  onClose: () => void;
}

type FormatExport = 'excel' | 'pdf' | 'csv';

const ExportResultatsDialog: React.FC<ExportResultatsDialogProps> = ({
  open,
  onClose,
}) => {
  const [format, setFormat] = useState<FormatExport>('excel');
  const [sessions, setSessions] = useState<SessionExamen[]>([]);
  const [niveaux, setNiveaux] = useState<any[]>([]);
  const [filieres, setFilieres] = useState<any[]>([]);

  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [selectedNiveauId, setSelectedNiveauId] = useState<number | null>(null);
  const [selectedFiliereId, setSelectedFiliereId] = useState<number | null>(null);

  const [inclureClassement, setInclureClassement] = useState(true);
  const [inclureStatistiques, setInclureStatistiques] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadData();
      setError(null);
    }
  }, [open]);

  const loadData = async () => {
    try {
      const [sessionsData, niveauxData, filieresData] = await Promise.all([
        sessionExamenService.getSessions(),
        getNiveaux(),
        getFilieres(),
      ]);
      setSessions(sessionsData);
      setNiveaux(niveauxData);
      setFilieres(filieresData);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    }
  };

  const handleExport = async () => {
    if (!selectedSessionId) {
      setError('Veuillez sélectionner une session');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Construire les données pour l'export
      // Note: L'export réel nécessiterait une API backend dédiée
      // Ici on simule l'export côté client

      const exportData = {
        session_id: selectedSessionId,
        niveau_id: selectedNiveauId,
        filiere_id: selectedFiliereId,
        format,
        options: {
          inclure_classement: inclureClassement,
          inclure_statistiques: inclureStatistiques,
        },
      };

      // Simulation d'export
      console.log('Export data:', exportData);

      // Pour un vrai export, on appellerait une API qui retourne un blob
      // const blob = await api.post('/resultats/export', exportData, { responseType: 'blob' });
      
      // Simulation: créer un fichier CSV simple
      if (format === 'csv') {
        const csvContent = 'Matricule;Nom;Prénom;Moyenne;Crédits;Décision\n';
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `resultats_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        // Pour Excel et PDF, on aurait besoin d'une API backend
        alert(`Export ${format.toUpperCase()} - Fonctionnalité à implémenter côté serveur`);
      }

      onClose();
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'export");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Exporter les Résultats</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {/* Format d'export */}
          <FormControl component="fieldset" sx={{ mb: 3 }}>
            <FormLabel component="legend">Format d'export</FormLabel>
            <RadioGroup
              row
              value={format}
              onChange={(e) => setFormat(e.target.value as FormatExport)}
            >
              <FormControlLabel value="excel" control={<Radio />} label="Excel" />
              <FormControlLabel value="pdf" control={<Radio />} label="PDF" />
              <FormControlLabel value="csv" control={<Radio />} label="CSV" />
            </RadioGroup>
          </FormControl>

          {/* Filtres */}
          <TextField
            select
            fullWidth
            label="Session"
            value={selectedSessionId || ''}
            onChange={(e) => setSelectedSessionId(Number(e.target.value))}
            sx={{ mb: 2 }}
            required
          >
            <MenuItem value="">Sélectionner une session</MenuItem>
            {sessions.map((session) => (
              <MenuItem key={session.id} value={session.id}>
                {session.code} - {session.libelle}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            label="Niveau (optionnel)"
            value={selectedNiveauId || ''}
            onChange={(e) => setSelectedNiveauId(e.target.value ? Number(e.target.value) : null)}
            sx={{ mb: 2 }}
          >
            <MenuItem value="">Tous les niveaux</MenuItem>
            {niveaux.map((niveau) => (
              <MenuItem key={niveau.id} value={niveau.id}>
                {niveau.libelle}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            label="Filière (optionnel)"
            value={selectedFiliereId || ''}
            onChange={(e) => setSelectedFiliereId(e.target.value ? Number(e.target.value) : null)}
            sx={{ mb: 2 }}
          >
            <MenuItem value="">Toutes les filières</MenuItem>
            {filieres.map((filiere) => (
              <MenuItem key={filiere.id} value={filiere.id}>
                {filiere.libelle}
              </MenuItem>
            ))}
          </TextField>

          {/* Options */}
          <FormControl component="fieldset" sx={{ mt: 2 }}>
            <FormLabel component="legend">Options</FormLabel>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={inclureClassement}
                    onChange={(e) => setInclureClassement(e.target.checked)}
                  />
                }
                label="Inclure le classement"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={inclureStatistiques}
                    onChange={(e) => setInclureStatistiques(e.target.checked)}
                  />
                }
                label="Inclure les statistiques"
              />
            </FormGroup>
          </FormControl>

          {/* Erreur */}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Annuler
        </Button>
        <Button
          variant="contained"
          onClick={handleExport}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Export en cours...' : 'Exporter'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportResultatsDialog;
