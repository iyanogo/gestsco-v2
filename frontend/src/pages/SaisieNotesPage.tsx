import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Paper,
  Alert,
} from '@mui/material';

import SaisieNotesTable from '../components/evaluation/SaisieNotesTable';
import { SessionExamen, Examen } from '../types/evaluation';
import sessionExamenService from '../services/sessionExamenService';
import examenService from '../services/examenService';

const SaisieNotesPage: React.FC = () => {
  const [sessions, setSessions] = useState<SessionExamen[]>([]);
  const [examens, setExamens] = useState<Examen[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [selectedExamenId, setSelectedExamenId] = useState<number | null>(null);
  const [selectedExamen, setSelectedExamen] = useState<Examen | null>(null);

  useEffect(() => {
    loadSessions();
    // Vérifier si un examen_id est passé en paramètre URL
    const params = new URLSearchParams(window.location.search);
    const examenId = params.get('examen_id');
    if (examenId) {
      loadExamenById(Number(examenId));
    }
  }, []);

  useEffect(() => {
    if (selectedSessionId) {
      loadExamens(selectedSessionId);
    } else {
      setExamens([]);
    }
  }, [selectedSessionId]);

  useEffect(() => {
    if (selectedExamenId) {
      const examen = examens.find((e) => e.id === selectedExamenId);
      setSelectedExamen(examen || null);
    } else {
      setSelectedExamen(null);
    }
  }, [selectedExamenId, examens]);

  const loadSessions = async () => {
    try {
      const data = await sessionExamenService.getSessions();
      setSessions(data);
    } catch (error) {
      console.error('Erreur chargement sessions:', error);
    }
  };

  const loadExamens = async (sessionId: number) => {
    try {
      const data = await examenService.getExamens({ session_id: sessionId });
      setExamens(data);
    } catch (error) {
      console.error('Erreur chargement examens:', error);
    }
  };

  const loadExamenById = async (examenId: number) => {
    try {
      const examen = await examenService.getExamenById(examenId);
      setSelectedExamenId(examenId);
      setSelectedSessionId(examen.session_id);
      setSelectedExamen(examen);
      // Charger les examens de la session
      await loadExamens(examen.session_id);
    } catch (error) {
      console.error('Erreur chargement examen:', error);
    }
  };

  const handleSaved = () => {
    // Rafraîchir si nécessaire
    console.log('Notes enregistrées');
  };

  return (
    <Box>
      {/* En-tête */}
      <Typography variant="h4" gutterBottom>
        Saisie des Notes
      </Typography>

      {/* Sélection */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            select
            label="Session"
            value={selectedSessionId || ''}
            onChange={(e) => {
              setSelectedSessionId(e.target.value ? Number(e.target.value) : null);
              setSelectedExamenId(null);
            }}
            size="small"
            sx={{ minWidth: 250 }}
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
            label="Examen"
            value={selectedExamenId || ''}
            onChange={(e) => setSelectedExamenId(e.target.value ? Number(e.target.value) : null)}
            size="small"
            sx={{ minWidth: 350 }}
            disabled={!selectedSessionId}
          >
            <MenuItem value="">Sélectionner un examen</MenuItem>
            {examens.map((examen) => (
              <MenuItem key={examen.id} value={examen.id}>
                {examen.matiere?.code || `Matière #${examen.matiere_id}`} - {examen.type_evaluation}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {selectedExamen && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Matière:</strong> {selectedExamen.matiere?.libelle || `#${selectedExamen.matiere_id}`} |{' '}
              <strong>Type:</strong> {selectedExamen.type_evaluation} |{' '}
              <strong>Note sur:</strong> {selectedExamen.note_sur} |{' '}
              <strong>Coefficient:</strong> {selectedExamen.coefficient}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Tableau de saisie */}
      {selectedExamenId ? (
        <SaisieNotesTable
          examenId={selectedExamenId}
          noteSur={selectedExamen?.note_sur || 20}
          onSaved={handleSaved}
        />
      ) : (
        <Alert severity="info">
          Veuillez sélectionner une session et un examen pour saisir les notes.
        </Alert>
      )}
    </Box>
  );
};

export default SaisieNotesPage;
