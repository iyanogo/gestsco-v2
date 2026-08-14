import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  TextField,
  MenuItem,
  Stack,
  Typography,
  Button,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridToolbar,
} from '@mui/x-data-grid';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  CheckCircle as ValidateIcon,
  Assignment as ExamIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import {
  SessionExamen,
  STATUT_SESSION_LABELS,
  STATUT_SESSION_COLORS,
} from '../../types/evaluation';
import sessionExamenService from '../../services/sessionExamenService';
import anneeAcademiqueService from '../../services/anneeAcademiqueService';

interface SessionsListProps {
  onEdit?: (session: SessionExamen) => void;
  onDelete?: (id: number) => void;
  onView?: (id: number) => void;
  onExamens?: (session: SessionExamen) => void;
  refreshTrigger?: number;
}

const SessionsList: React.FC<SessionsListProps> = ({
  onEdit,
  onDelete,
  onView,
  onExamens,
  refreshTrigger,
}) => {
  const [sessions, setSessions] = useState<SessionExamen[]>([]);
  const [loading, setLoading] = useState(true);
  const [anneesAcademiques, setAnneesAcademiques] = useState<any[]>([]);

  // Filtres
  const [filtreAnnee, setFiltreAnnee] = useState<number | ''>('');
  const [filtreSemestre, setFiltreSemestre] = useState<number | ''>('');
  const [filtreStatut, setFiltreStatut] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  useEffect(() => {
    loadSessions();
  }, [filtreAnnee, filtreSemestre, filtreStatut]);

  const loadData = async () => {
    try {
      const annees = await anneeAcademiqueService.getAll();
      setAnneesAcademiques(annees);
      await loadSessions();
    } catch (error) {
      console.error('Erreur chargement données:', error);
    }
  };

  const loadSessions = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filtreAnnee) params.annee_id = filtreAnnee;
      if (filtreSemestre) params.semestre = filtreSemestre;
      if (filtreStatut) params.statut = filtreStatut;

      const data = await sessionExamenService.getSessions(params);
      setSessions(data);
    } catch (error) {
      console.error('Erreur chargement sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOuvrir = async (id: number) => {
    try {
      await sessionExamenService.ouvrirSession(id);
      loadSessions();
    } catch (error) {
      console.error('Erreur ouverture session:', error);
    }
  };

  const handleCloturer = async (id: number) => {
    try {
      await sessionExamenService.cloturerSession(id);
      loadSessions();
    } catch (error) {
      console.error('Erreur clôture session:', error);
    }
  };

  const handleValider = async (id: number) => {
    try {
      await sessionExamenService.validerSession(id);
      loadSessions();
    } catch (error) {
      console.error('Erreur validation session:', error);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: fr });
    } catch {
      return dateString;
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'code',
      headerName: 'Code',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" fontWeight="medium">
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'libelle',
      headerName: 'Libellé',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'type_session',
      headerName: 'Type',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value === 'normale' ? 'Normale' : 'Rattrapage'}
          size="small"
          color={params.value === 'normale' ? 'primary' : 'secondary'}
          variant="outlined"
        />
      ),
    },
    {
      field: 'semestre',
      headerName: 'Semestre',
      width: 100,
      align: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Chip label={`S${params.value}`} size="small" />
      ),
    },
    {
      field: 'date_debut',
      headerName: 'Date début',
      width: 120,
      valueFormatter: (value: any) => formatDate(value),
    },
    {
      field: 'date_fin',
      headerName: 'Date fin',
      width: 120,
      valueFormatter: (value: any) => formatDate(value),
    },
    {
      field: 'statut',
      headerName: 'Statut',
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={STATUT_SESSION_LABELS[params.value] || params.value}
          size="small"
          color={STATUT_SESSION_COLORS[params.value] || 'default'}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 280,
      sortable: false,
      renderCell: (params: GridRenderCellParams<SessionExamen>) => {
        const session = params.row;
        return (
          <Stack direction="row" spacing={0.5}>
            {session.statut === 'planifiee' && (
              <Tooltip title="Ouvrir la session">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => handleOuvrir(session.id)}
                >
                  <PlayIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {session.statut === 'en_cours' && (
              <Tooltip title="Clôturer la session">
                <IconButton
                  size="small"
                  color="warning"
                  onClick={() => handleCloturer(session.id)}
                >
                  <StopIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {session.statut === 'cloturee' && (
              <Tooltip title="Valider la session">
                <IconButton
                  size="small"
                  color="success"
                  onClick={() => handleValider(session.id)}
                >
                  <ValidateIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Examens">
              <IconButton
                size="small"
                color="info"
                onClick={() => onExamens?.(session)}
              >
                <ExamIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Voir">
              <IconButton
                size="small"
                onClick={() => onView?.(session.id)}
              >
                <ViewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Modifier">
              <IconButton
                size="small"
                color="primary"
                onClick={() => onEdit?.(session)}
                disabled={session.statut === 'validee'}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Supprimer">
              <IconButton
                size="small"
                color="error"
                onClick={() => onDelete?.(session.id)}
                disabled={session.statut !== 'planifiee'}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        );
      },
    },
  ];

  return (
    <Box>
      {/* Filtres */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            select
            label="Année académique"
            value={filtreAnnee}
            onChange={(e) => setFiltreAnnee(e.target.value as number | '')}
            size="small"
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">Toutes</MenuItem>
            {anneesAcademiques.map((annee) => (
              <MenuItem key={annee.id} value={annee.id}>
                {annee.libelle}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Semestre"
            value={filtreSemestre}
            onChange={(e) => setFiltreSemestre(e.target.value as number | '')}
            size="small"
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="">Tous</MenuItem>
            <MenuItem value={1}>Semestre 1</MenuItem>
            <MenuItem value={2}>Semestre 2</MenuItem>
          </TextField>

          <TextField
            select
            label="Statut"
            value={filtreStatut}
            onChange={(e) => setFiltreStatut(e.target.value)}
            size="small"
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">Tous</MenuItem>
            <MenuItem value="planifiee">Planifiée</MenuItem>
            <MenuItem value="en_cours">En cours</MenuItem>
            <MenuItem value="cloturee">Clôturée</MenuItem>
            <MenuItem value="validee">Validée</MenuItem>
          </TextField>

          <Button variant="outlined" onClick={loadSessions}>
            Actualiser
          </Button>
        </Stack>
      </Paper>

      {/* Tableau */}
      <Paper sx={{ height: 500 }}>
        <DataGrid
          rows={sessions}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          slots={{ toolbar: GridToolbar }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: { debounceMs: 500 },
            },
          }}
          disableRowSelectionOnClick
          localeText={{
            noRowsLabel: 'Aucune session',
          }}
        />
      </Paper>
    </Box>
  );
};

export default SessionsList;
