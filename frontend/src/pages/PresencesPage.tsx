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
  Button,
  Snackbar,
  Alert,
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import SaisiePresencesTable from '../components/emploiTemps/SaisiePresencesTable';
// import StatistiquesPresenceCard from '../components/emploiTemps/StatistiquesPresenceCard';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Presence, Seance, STATUTS_PRESENCE, getStatutPresenceColor } from '../types/emploiTemps';
import { presenceService } from '../services/presenceService';
import { seanceService } from '../services/seanceService';
import { Chip } from '@mui/material';

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

const PresencesPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [seances, setSeances] = useState<Seance[]>([]);
  const [selectedSeanceId, setSelectedSeanceId] = useState<number | ''>('');
  const [presences, setPresences] = useState<Presence[]>([]);
  const [absentsFrequents, setAbsentsFrequents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [niveauId, setNiveauId] = useState<number | ''>('');
  const [seuilAbsence, setSeuilAbsence] = useState(3);

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // TODO: Charger depuis les services
  const [niveaux] = useState<any[]>([]);

  useEffect(() => {
    loadSeances();
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

  const loadSeances = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = await seanceService.getSeances({ date: today });
      setSeances(data);
    } catch (error) {
      console.error('Erreur lors du chargement des séances:', error);
    }
  };

  const loadAbsentsFrequents = async () => {
    if (!niveauId) return;
    setLoading(true);
    try {
      const data = await presenceService.getAbsentsFrequents(Number(niveauId), seuilAbsence);
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
      const data = await presenceService.getPresences({ limit: 100 });
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

  const presenceColumns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'seance_id', headerName: 'Séance', width: 100 },
    { field: 'etudiant_id', headerName: 'Étudiant', width: 100 },
    {
      field: 'statut',
      headerName: 'Statut',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={getStatutLabel(params.value)}
          color={getStatutPresenceColor(params.value) as any}
          size="small"
        />
      ),
    },
    {
      field: 'date_saisie',
      headerName: 'Date de saisie',
      width: 150,
      valueFormatter: (value) => value ? new Date(value).toLocaleString('fr-FR') : '-',
    },
    { field: 'observation', headerName: 'Observation', flex: 1 },
  ];

  const absentsColumns: GridColDef[] = [
    { field: 'matricule', headerName: 'Matricule', width: 120 },
    { field: 'nom', headerName: 'Nom', width: 150 },
    { field: 'prenom', headerName: 'Prénom', width: 150 },
    {
      field: 'nb_absences',
      headerName: 'Nombre d\'absences',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          color={params.value >= 5 ? 'error' : 'warning'}
          size="small"
        />
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Gestion des Présences</Typography>
        <Button variant="outlined" startIcon={<DownloadIcon />}>
          Exporter Excel
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="Saisie des présences" />
          <Tab label="Statistiques" />
          <Tab label="Historique" />
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
            onChange={(e) => setSelectedSeanceId(e.target.value as number | '')}
          >
            <MenuItem value="">Sélectionner une séance</MenuItem>
            {seances.map((seance) => (
              <MenuItem key={seance.id} value={seance.id}>
                {seance.code} - {seance.date_seance}
              </MenuItem>
            ))}
          </TextField>
        </Paper>

        {selectedSeanceId && (
          <SaisiePresencesTable
            seanceId={Number(selectedSeanceId)}
            onSaved={() => {
              setSnackbar({ open: true, message: 'Présences enregistrées', severity: 'success' });
            }}
          />
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Absents fréquents
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Niveau"
                    value={niveauId}
                    onChange={(e) => setNiveauId(e.target.value as number | '')}
                  >
                    <MenuItem value="">Sélectionner un niveau</MenuItem>
                    {niveaux.map((niveau) => (
                      <MenuItem key={niveau.id} value={niveau.id}>
                        {niveau.libelle}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Seuil d'absences"
                    value={seuilAbsence}
                    onChange={(e) => setSeuilAbsence(Number(e.target.value))}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
              </Grid>
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
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PresencesPage;
