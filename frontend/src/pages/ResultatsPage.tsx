import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Paper,
  Tabs,
  Tab,
  Button,
  Alert,
} from '@mui/material';
import {
  Calculate as CalculateIcon,
} from '@mui/icons-material';

import ResultatsTable from '../components/evaluation/ResultatsTable';
import ClassementTable from '../components/evaluation/ClassementTable';
import { SessionExamen } from '../types/evaluation';
import sessionExamenService from '../services/sessionExamenService';
import anneeAcademiqueService from '../services/anneeAcademiqueService';
import { getNiveaux } from '../services/niveauService';
import { getFilieres } from '../services/filiereService';

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

const ResultatsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [sessions, setSessions] = useState<SessionExamen[]>([]);
  const [anneesAcademiques, setAnneesAcademiques] = useState<any[]>([]);
  const [niveaux, setNiveaux] = useState<any[]>([]);
  const [filieres, setFilieres] = useState<any[]>([]);

  // Filtres pour résultats par étudiant
  const [etudiantId, setEtudiantId] = useState<string>('');
  const [sessionIdEtudiant, setSessionIdEtudiant] = useState<number | null>(null);

  // Filtres pour classement semestriel
  const [sessionIdClassement, setSessionIdClassement] = useState<number | null>(null);
  const [semestreClassement, setSemestreClassement] = useState<number>(1);
  const [niveauIdClassement, setNiveauIdClassement] = useState<number | null>(null);
  const [filiereIdClassement, setFiliereIdClassement] = useState<number | null>(null);

  // Filtres pour classement annuel
  const [anneeIdClassement, setAnneeIdClassement] = useState<number | null>(null);
  const [niveauIdAnnuel, setNiveauIdAnnuel] = useState<number | null>(null);
  const [filiereIdAnnuel, setFiliereIdAnnuel] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [sessionsData, anneesData, niveauxData, filieresData] = await Promise.all([
        sessionExamenService.getSessions(),
        anneeAcademiqueService.getAll(),
        getNiveaux(),
        getFilieres(),
      ]);
      setSessions(sessionsData);
      setAnneesAcademiques(anneesData);
      setNiveaux(niveauxData);
      setFilieres(filieresData);
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
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Résultats</Typography>
        <Button
          variant="outlined"
          startIcon={<CalculateIcon />}
          onClick={() => {/* TODO: Ouvrir dialog calcul */}}
        >
          Calculer Résultats
        </Button>
      </Box>

      {/* Onglets */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Par Étudiant" />
          <Tab label="Classement Semestriel" />
          <Tab label="Classement Annuel" />
        </Tabs>
      </Paper>

      {/* Résultats par étudiant */}
      <TabPanel value={tabValue} index={0}>
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="ID Étudiant"
              value={etudiantId}
              onChange={(e) => setEtudiantId(e.target.value)}
              size="small"
              sx={{ minWidth: 150 }}
              type="number"
              placeholder="Ex: 123"
            />
            <TextField
              select
              label="Session (optionnel)"
              value={sessionIdEtudiant || ''}
              onChange={(e) => setSessionIdEtudiant(e.target.value ? Number(e.target.value) : null)}
              size="small"
              sx={{ minWidth: 250 }}
            >
              <MenuItem value="">Toutes les sessions</MenuItem>
              {sessions.map((session) => (
                <MenuItem key={session.id} value={session.id}>
                  {session.code} - {session.libelle}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Paper>

        {etudiantId ? (
          <ResultatsTable
            etudiantId={Number(etudiantId)}
            sessionId={sessionIdEtudiant}
          />
        ) : (
          <Alert severity="info">
            Entrez l'ID d'un étudiant pour afficher ses résultats.
          </Alert>
        )}
      </TabPanel>

      {/* Classement semestriel */}
      <TabPanel value={tabValue} index={1}>
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              select
              label="Session"
              value={sessionIdClassement || ''}
              onChange={(e) => setSessionIdClassement(e.target.value ? Number(e.target.value) : null)}
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
              label="Semestre"
              value={semestreClassement}
              onChange={(e) => setSemestreClassement(Number(e.target.value))}
              size="small"
              sx={{ minWidth: 130 }}
            >
              <MenuItem value={1}>Semestre 1</MenuItem>
              <MenuItem value={2}>Semestre 2</MenuItem>
            </TextField>
            <TextField
              select
              label="Niveau"
              value={niveauIdClassement || ''}
              onChange={(e) => setNiveauIdClassement(e.target.value ? Number(e.target.value) : null)}
              size="small"
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">Sélectionner</MenuItem>
              {niveaux.map((niveau) => (
                <MenuItem key={niveau.id} value={niveau.id}>
                  {niveau.libelle}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Filière"
              value={filiereIdClassement || ''}
              onChange={(e) => setFiliereIdClassement(e.target.value ? Number(e.target.value) : null)}
              size="small"
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="">Sélectionner</MenuItem>
              {filieres.map((filiere) => (
                <MenuItem key={filiere.id} value={filiere.id}>
                  {filiere.libelle}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Paper>

        {sessionIdClassement && niveauIdClassement && filiereIdClassement ? (
          <ClassementTable
            niveauId={niveauIdClassement}
            filiereId={filiereIdClassement}
            sessionId={sessionIdClassement}
            semestre={semestreClassement}
            type="semestre"
          />
        ) : (
          <Alert severity="info">
            Sélectionnez une session, un niveau et une filière pour afficher le classement.
          </Alert>
        )}
      </TabPanel>

      {/* Classement annuel */}
      <TabPanel value={tabValue} index={2}>
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              select
              label="Année Académique"
              value={anneeIdClassement || ''}
              onChange={(e) => setAnneeIdClassement(e.target.value ? Number(e.target.value) : null)}
              size="small"
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">Sélectionner</MenuItem>
              {anneesAcademiques.map((annee) => (
                <MenuItem key={annee.id} value={annee.id}>
                  {annee.libelle}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Niveau"
              value={niveauIdAnnuel || ''}
              onChange={(e) => setNiveauIdAnnuel(e.target.value ? Number(e.target.value) : null)}
              size="small"
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">Sélectionner</MenuItem>
              {niveaux.map((niveau) => (
                <MenuItem key={niveau.id} value={niveau.id}>
                  {niveau.libelle}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Filière"
              value={filiereIdAnnuel || ''}
              onChange={(e) => setFiliereIdAnnuel(e.target.value ? Number(e.target.value) : null)}
              size="small"
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="">Sélectionner</MenuItem>
              {filieres.map((filiere) => (
                <MenuItem key={filiere.id} value={filiere.id}>
                  {filiere.libelle}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Paper>

        {anneeIdClassement && niveauIdAnnuel && filiereIdAnnuel ? (
          <ClassementTable
            niveauId={niveauIdAnnuel}
            filiereId={filiereIdAnnuel}
            anneeId={anneeIdClassement}
            type="annuel"
          />
        ) : (
          <Alert severity="info">
            Sélectionnez une année, un niveau et une filière pour afficher le classement annuel.
          </Alert>
        )}
      </TabPanel>
    </Box>
  );
};

export default ResultatsPage;
