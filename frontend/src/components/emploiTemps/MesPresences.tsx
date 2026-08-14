import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Grid,
  Chip,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Presence, STATUTS_PRESENCE, getStatutPresenceColor } from '../../types/emploiTemps';
import { presenceService } from '../../services/presenceService';
import StatistiquesPresenceCard from './StatistiquesPresenceCard';

interface MesPresencesProps {
  etudiantId: number;
}

const MesPresences: React.FC<MesPresencesProps> = ({ etudiantId }) => {
  const [presences, setPresences] = useState<Presence[]>([]);
  const [loading, setLoading] = useState(true);
  const [matiereId, setMatiereId] = useState<number | ''>('');
  const [periode, setPeriode] = useState<'semaine' | 'mois' | 'semestre'>('mois');
  const [matieres, ] = useState<any[]>([]);

  useEffect(() => {
    loadPresences();
  }, [etudiantId, matiereId, periode]);

  const loadPresences = async () => {
    setLoading(true);
    try {
      const { dateDebut, dateFin } = getDateRange();
      const data = await presenceService.getPresencesEtudiant(
        etudiantId,
        dateDebut,
        dateFin,
        matiereId || undefined
      );
      setPresences(data);
    } catch (error) {
      console.error('Erreur lors du chargement des présences:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    const now = new Date();
    let dateDebut: string;
    const dateFin = now.toISOString().split('T')[0];

    switch (periode) {
      case 'semaine':
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        dateDebut = weekAgo.toISOString().split('T')[0];
        break;
      case 'mois':
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        dateDebut = monthAgo.toISOString().split('T')[0];
        break;
      case 'semestre':
        const semesterAgo = new Date(now);
        semesterAgo.setMonth(semesterAgo.getMonth() - 6);
        dateDebut = semesterAgo.toISOString().split('T')[0];
        break;
      default:
        dateDebut = dateFin;
    }

    return { dateDebut, dateFin };
  };

  const getStatutLabel = (statut: string) => {
    const found = STATUTS_PRESENCE.find((s) => s.value === statut);
    return found?.label || statut;
  };

  const columns: GridColDef[] = [
    {
      field: 'date_saisie',
      headerName: 'Date',
      width: 120,
      valueFormatter: (value) => {
        if (!value) return '-';
        return new Date(value).toLocaleDateString('fr-FR');
      },
    },
    {
      field: 'seance_id',
      headerName: 'Séance',
      width: 150,
      valueGetter: (value) => `Séance #${value}`,
    },
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
      field: 'heure_arrivee',
      headerName: 'Heure d\'arrivée',
      width: 130,
      valueFormatter: (value: string | null) => value ? value.substring(0, 5) : '-',
    },
    {
      field: 'observation',
      headerName: 'Observation',
      flex: 1,
      minWidth: 200,
    },
  ];

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <StatistiquesPresenceCard
            etudiantId={etudiantId}
            matiereId={matiereId || null}
          />
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Historique des présences
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Matière"
                  value={matiereId}
                  onChange={(e) => setMatiereId(e.target.value as number | '')}
                >
                  <MenuItem value="">Toutes les matières</MenuItem>
                  {matieres.map((matiere) => (
                    <MenuItem key={matiere.id} value={matiere.id}>
                      {matiere.libelle}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Période"
                  value={periode}
                  onChange={(e) => setPeriode(e.target.value as 'semaine' | 'mois' | 'semestre')}
                >
                  <MenuItem value="semaine">Cette semaine</MenuItem>
                  <MenuItem value="mois">Ce mois</MenuItem>
                  <MenuItem value="semestre">Ce semestre</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ height: 400 }}>
            <DataGrid
              rows={presences}
              columns={columns}
              loading={loading}
              pageSizeOptions={[10, 25]}
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
              }}
              disableRowSelectionOnClick
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MesPresences;
