import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  TextField,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

import ExamensList from '../components/evaluation/ExamensList';
import ExamenForm from '../components/evaluation/ExamenForm';
import StatistiquesExamen from '../components/evaluation/StatistiquesExamen';
import { Examen, CreateExamen, UpdateExamen, SessionExamen } from '../types/evaluation';
import examenService from '../services/examenService';
import sessionExamenService from '../services/sessionExamenService';

const ExamensPage: React.FC = () => {
  const [sessions, setSessions] = useState<SessionExamen[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const [openStats, setOpenStats] = useState(false);
  const [selectedExamen, setSelectedExamen] = useState<Examen | null>(null);
  const [statsExamenId, setStatsExamenId] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadSessions();
    // Vérifier si un session_id est passé en paramètre URL
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    if (sessionId) {
      setSelectedSessionId(Number(sessionId));
    }
  }, []);

  const loadSessions = async () => {
    try {
      const data = await sessionExamenService.getSessions();
      setSessions(data);
    } catch (error) {
      console.error('Erreur chargement sessions:', error);
    }
  };

  const handleCreate = () => {
    if (!selectedSessionId) {
      alert('Veuillez sélectionner une session');
      return;
    }
    setSelectedExamen(null);
    setOpenForm(true);
  };

  const handleEdit = (examen: Examen) => {
    setSelectedExamen(examen);
    setOpenForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet examen ?')) {
      try {
        await examenService.deleteExamen(id);
        setRefreshTrigger((prev) => prev + 1);
      } catch (error) {
        console.error('Erreur suppression:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const handleView = (id: number) => {
    console.log('View examen:', id);
  };

  const handleSaisieNotes = (examen: Examen) => {
    window.location.href = `/saisie-notes?examen_id=${examen.id}`;
  };

  const handleStatistiques = (examen: Examen) => {
    setStatsExamenId(examen.id);
    setOpenStats(true);
  };

  const handleSubmit = async (data: CreateExamen | UpdateExamen) => {
    try {
      if (selectedExamen) {
        await examenService.updateExamen(selectedExamen.id, data as UpdateExamen);
      } else {
        await examenService.createExamen({ ...data, session_id: selectedSessionId! } as CreateExamen);
      }
      setOpenForm(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      throw error;
    }
  };

  return (
    <Box>
      {/* En-tête */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4">Examens</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            select
            label="Session"
            value={selectedSessionId || ''}
            onChange={(e) => setSelectedSessionId(e.target.value ? Number(e.target.value) : null)}
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
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
            disabled={!selectedSessionId}
          >
            Nouvel Examen
          </Button>
        </Box>
      </Box>

      {/* Liste des examens */}
      <ExamensList
        sessionId={selectedSessionId}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        onSaisieNotes={handleSaisieNotes}
        onStatistiques={handleStatistiques}
        refreshTrigger={refreshTrigger}
      />

      {/* Dialog formulaire */}
      <Dialog
        open={openForm}
        onClose={() => setOpenForm(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {selectedExamen ? "Modifier l'examen" : 'Nouvel examen'}
            </Typography>
            <IconButton onClick={() => setOpenForm(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <ExamenForm
              initialData={selectedExamen}
              sessionId={selectedSessionId || selectedExamen?.session_id || 0}
              onSubmit={handleSubmit}
              onCancel={() => setOpenForm(false)}
            />
          </Box>
        </DialogContent>
      </Dialog>

      {/* Dialog statistiques */}
      <Dialog
        open={openStats}
        onClose={() => setOpenStats(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Statistiques de l'examen</Typography>
            <IconButton onClick={() => setOpenStats(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {statsExamenId && <StatistiquesExamen examenId={statsExamenId} />}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ExamensPage;
