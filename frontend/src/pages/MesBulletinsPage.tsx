import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Paper,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';

import BulletinSemestre from '../components/evaluation/BulletinSemestre';
import BulletinAnnuel from '../components/evaluation/BulletinAnnuel';
import { SessionExamen } from '../types/evaluation';
import sessionExamenService from '../services/sessionExamenService';
import anneeAcademiqueService from '../services/anneeAcademiqueService';

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

const MesBulletinsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [sessions, setSessions] = useState<SessionExamen[]>([]);
  const [anneesAcademiques, setAnneesAcademiques] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [selectedSemestre, setSelectedSemestre] = useState<number>(1);
  const [selectedAnneeId, setSelectedAnneeId] = useState<number | null>(null);

  // TODO: Récupérer l'ID de l'étudiant connecté depuis le contexte d'authentification
  const etudiantId = 1; // À remplacer par l'ID réel de l'étudiant connecté

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [sessionsData, anneesData] = await Promise.all([
        sessionExamenService.getSessions({ statut: 'validee' }),
        anneeAcademiqueService.getAll(),
      ]);
      setSessions(sessionsData);
      setAnneesAcademiques(anneesData);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      {/* En-tête */}
      <Typography variant="h4" gutterBottom>
        Mes Bulletins
      </Typography>

      {/* Onglets */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Bulletin Semestriel" />
          <Tab label="Bulletin Annuel" />
        </Tabs>
      </Paper>

      {/* Bulletin Semestriel */}
      <TabPanel value={tabValue} index={0}>
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              select
              label="Session"
              value={selectedSessionId || ''}
              onChange={(e) => setSelectedSessionId(e.target.value ? Number(e.target.value) : null)}
              size="small"
              sx={{ minWidth: 300 }}
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
              label="Semestre"
              value={selectedSemestre}
              onChange={(e) => setSelectedSemestre(Number(e.target.value))}
              size="small"
              sx={{ minWidth: 150 }}
            >
              <MenuItem value={1}>Semestre 1</MenuItem>
              <MenuItem value={2}>Semestre 2</MenuItem>
            </TextField>
          </Box>
        </Paper>

        {selectedSessionId ? (
          <BulletinSemestre
            etudiantId={etudiantId}
            sessionId={selectedSessionId}
            semestre={selectedSemestre}
          />
        ) : (
          <Alert severity="info">
            Veuillez sélectionner une session pour afficher votre bulletin semestriel.
          </Alert>
        )}
      </TabPanel>

      {/* Bulletin Annuel */}
      <TabPanel value={tabValue} index={1}>
        <Paper sx={{ p: 2, mb: 3 }}>
          <TextField
            select
            label="Année Académique"
            value={selectedAnneeId || ''}
            onChange={(e) => setSelectedAnneeId(e.target.value ? Number(e.target.value) : null)}
            size="small"
            sx={{ minWidth: 250 }}
          >
            <MenuItem value="">Sélectionner une année</MenuItem>
            {anneesAcademiques.map((annee) => (
              <MenuItem key={annee.id} value={annee.id}>
                {annee.libelle}
              </MenuItem>
            ))}
          </TextField>
        </Paper>

        {selectedAnneeId ? (
          <BulletinAnnuel
            etudiantId={etudiantId}
            anneeId={selectedAnneeId}
          />
        ) : (
          <Alert severity="info">
            Veuillez sélectionner une année académique pour afficher votre bulletin annuel.
          </Alert>
        )}
      </TabPanel>
    </Box>
  );
};

export default MesBulletinsPage;
