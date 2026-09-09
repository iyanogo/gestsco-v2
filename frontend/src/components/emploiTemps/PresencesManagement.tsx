import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  TextField,
  MenuItem,
  Grid,
  Snackbar,
  Alert,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Chip } from '@mui/material';
import SaisiePresencesTable from './SaisiePresencesTable';
import StatistiquesPresenceCard from './StatistiquesPresenceCard';
import {
  Presence,
  Seance,
  STATUTS_PRESENCE,
  getStatutPresenceColor,
} from '../../types/emploiTemps';
import { presenceService } from '../../services/presenceService';
import { seanceService } from '../../services/seanceService';
import portalService from '../../services/portalService';
import { getNiveaux } from '../../services/niveauService';
import { getMatieres } from '../../services/matiereService';
import type { Niveau } from '../../types/reference';
import type { Matiere } from '../../types/reference';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

interface PresencesManagementProps {
  showTitle?: boolean;
  initialTab?: number;
  portalMode?: 'admin' | 'teacher';
}

const PresencesManagement: React.FC<PresencesManagementProps> = ({
  showTitle = true,
  initialTab = 0,
  portalMode = 'admin',
}) => {
  const isTeacherPortal = portalMode === 'teacher';
  const [tabValue, setTabValue] = useState(initialTab);
  const [seances, setSeances] = useState<Seance[]>([]);
  const [selectedSeanceId, setSelectedSeanceId] = useState<number | ''>('');
  const [presences, setPresences] = useState<Presence[]>([]);
  const [absentsFrequents, setAbsentsFrequents] = useState<
    Array<{
      etudiant_id: number;
      matricule: string;
      nom: string;
      prenom: string;
      nb_absences: number;
    }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [niveauId, setNiveauId] = useState<number | ''>('');
  const [seuilAbsence, setSeuilAbsence] = useState(3);
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [selectedEtudiantId, setSelectedEtudiantId] = useState<number | ''>('');
  const [selectedMatiereId, setSelectedMatiereId] = useState<number | ''>('');

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    loadSeances();
    loadReferenceData();
  }, []);

  useEffect(() => {
    if (tabValue === 1 && niveauId) {
      loadAbsentsFrequents();
    }
  }, [tabValue, niveauId, seuilAbsence]);

  useEffect(() => {
    if (tabValue === 2) {
      loadAllPresences();
    }
  }, [tabValue]);

  const loadReferenceData = async () => {
    try {
      const [niv, mat] = await Promise.all([getNiveaux(), getMatieres()]);
      setNiveaux(niv);
      setMatieres(mat);
    } catch (error) {
      console.error('Erreur chargement référentiel:', error);
    }
  };

  const loadSeances = async () => {
    try {
      const today = new Date();
      const past = new Date(today);
      past.setDate(past.getDate() - 30);
      const dateDebut = past.toISOString().split('T')[0];
      const dateFin = today.toISOString().split('T')[0];

      if (isTeacherPortal) {
        const data = await portalService.getMesSeances({ date_debut: dateDebut, date_fin: dateFin });
        const eligible = data.filter(
          (s) => s.statut === 'confirmee' || s.statut === 'en_cours' || s.statut === 'terminee',
        );
        setSeances(eligible);
        return;
      }

      const todayStr = today.toISOString().split('T')[0];
      const data = await seanceService.getSeances({
        date_debut: todayStr,
        statut: 'confirmee',
      });
      const extra = await seanceService.getSeances({
        date: todayStr,
        statut: 'terminee',
      });
      const merged = [...data];
      extra.forEach((s) => {
        if (!merged.find((m) => m.id === s.id)) merged.push(s);
      });
      setSeances(merged);
    } catch (error) {
      console.error('Erreur lors du chargement des séances:', error);
    }
  };

  const loadAbsentsFrequents = async () => {
    if (!niveauId) return;
    setLoading(true);
    try {
      const data = await presenceService.getAbsentsFrequents(
        Number(niveauId),
        seuilAbsence
      );
      setAbsentsFrequents(data);
    } catch (error) {
      console.error('Erreur lors du chargement des absents fréquents:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllPresences = async () => {
    setLoading(true);
    try {
      const data = await presenceService.getPresences({ limit: 200 });
      setPresences(data);
    } catch (error) {
      console.error('Erreur lors du chargement des présences:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatutLabel = (statut: string) => {
    const found = STATUTS_PRESENCE.find((s) => s.value === statut);
    return found?.label || statut;
  };

  const seanceLabel = (seance: Seance) => {
    const matiere = matieres.find((m) => m.id === seance.matiere_id);
    return `${matiere?.libelle || `Matière #${seance.matiere_id}`} - ${seance.date_seance}`;
  };

  const presenceColumns: GridColDef[] = [
    { field: 'seance_id', headerName: 'Séance', width: 90 },
    { field: 'etudiant_id', headerName: 'Étudiant', width: 100 },
    {
      field: 'statut',
      headerName: 'Statut',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={getStatutLabel(params.value)}
          color={getStatutPresenceColor(params.value) as 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
          size="small"
        />
      ),
    },
    {
      field: 'date_saisie',
      headerName: 'Date de saisie',
      width: 160,
      valueFormatter: (value) =>
        value ? new Date(value as string).toLocaleString('fr-FR') : '-',
    },
    { field: 'observation', headerName: 'Observation', flex: 1 },
  ];

  const absentsColumns: GridColDef[] = [
    { field: 'matricule', headerName: 'Matricule', width: 120 },
    { field: 'nom', headerName: 'Nom', width: 150 },
    { field: 'prenom', headerName: 'Prénom', width: 150 },
    {
      field: 'nb_absences',
      headerName: "Nombre d'absences",
      width: 160,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          color={(params.value as number) >= 5 ? 'error' : 'warning'}
          size="small"
        />
      ),
    },
  ];

  return (
    <Box>
      {showTitle && (
        <Typography variant="h4" sx={{ mb: 3 }}>
          Gestion des Présences
        </Typography>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="Saisie des présences" />
          {!isTeacherPortal && <Tab label="Statistiques" />}
          {!isTeacherPortal && <Tab label="Historique" />}
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Sélectionner une séance
          </Typography>
          <TextField
            select
            fullWidth
            size="small"
            label="Séance"
            value={selectedSeanceId}
            onChange={(e) =>
              setSelectedSeanceId(e.target.value ? Number(e.target.value) : '')
            }
          >
            <MenuItem value="">Sélectionner une séance</MenuItem>
            {seances.map((seance) => (
              <MenuItem key={seance.id} value={seance.id}>
                {seanceLabel(seance)}
              </MenuItem>
            ))}
          </TextField>
        </Paper>

        {selectedSeanceId ? (
          <SaisiePresencesTable
            seanceId={Number(selectedSeanceId)}
            onSaved={() => {
              setSnackbar({
                open: true,
                message: 'Présences enregistrées',
                severity: 'success',
              });
            }}
          />
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              Sélectionnez une séance pour faire l&apos;appel
            </Typography>
          </Paper>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Absents fréquents
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                label="Niveau"
                value={niveauId}
                onChange={(e) =>
                  setNiveauId(e.target.value ? Number(e.target.value) : '')
                }
                sx={{ mb: 2 }}
              >
                <MenuItem value="">Sélectionner un niveau</MenuItem>
                {niveaux.map((niveau) => (
                  <MenuItem key={niveau.id} value={niveau.id}>
                    {niveau.libelle}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Seuil d'absences"
                value={seuilAbsence}
                onChange={(e) => setSeuilAbsence(Number(e.target.value))}
                inputProps={{ min: 1 }}
              />
            </Paper>

            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Taux par étudiant / matière
              </Typography>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="ID étudiant"
                value={selectedEtudiantId}
                onChange={(e) =>
                  setSelectedEtudiantId(e.target.value ? Number(e.target.value) : '')
                }
                sx={{ mb: 2 }}
              />
              <TextField
                select
                fullWidth
                size="small"
                label="Matière (optionnel)"
                value={selectedMatiereId}
                onChange={(e) =>
                  setSelectedMatiereId(e.target.value ? Number(e.target.value) : '')
                }
              >
                <MenuItem value="">Toutes matières</MenuItem>
                {matieres.map((m) => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.libelle}
                  </MenuItem>
                ))}
              </TextField>
              {selectedEtudiantId && (
                <Box sx={{ mt: 2 }}>
                  <StatistiquesPresenceCard
                    etudiantId={Number(selectedEtudiantId)}
                    matiereId={selectedMatiereId ? Number(selectedMatiereId) : undefined}
                  />
                </Box>
              )}
            </Paper>
          </Grid>
          <Grid item xs={12} md={8}>
            <Paper sx={{ height: 400 }}>
              <DataGrid
                rows={absentsFrequents}
                columns={absentsColumns}
                loading={loading}
                getRowId={(row) => row.etudiant_id}
                pageSizeOptions={[10, 25]}
                disableRowSelectionOnClick
              />
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Paper sx={{ height: 500 }}>
          <DataGrid
            rows={presences}
            columns={presenceColumns}
            loading={loading}
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
            }}
            disableRowSelectionOnClick
          />
        </Paper>
      </TabPanel>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PresencesManagement;
