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
  CheckCircle as ValidateIcon,
  Publish as PublishIcon,
  Done as DoneIcon,
  Description as PVIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import {
  Deliberation,
  STATUT_DELIBERATION_LABELS,
  STATUT_DELIBERATION_COLORS,
} from '../../types/evaluation';
import deliberationService from '../../services/deliberationService';
import sessionExamenService from '../../services/sessionExamenService';
import { getNiveaux } from '../../services/niveauService';
import { getFilieres } from '../../services/filiereService';

interface DeliberationsListProps {
  onEdit?: (deliberation: Deliberation) => void;
  onDelete?: (id: number) => void;
  onView?: (id: number) => void;
  refreshTrigger?: number;
}

const DeliberationsList: React.FC<DeliberationsListProps> = ({
  onEdit,
  onDelete,
  onView,
  refreshTrigger,
}) => {
  const [deliberations, setDeliberations] = useState<Deliberation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [niveaux, setNiveaux] = useState<any[]>([]);
  const [filieres, setFilieres] = useState<any[]>([]);

  // Filtres
  const [filtreSession, setFiltreSession] = useState<number | ''>('');
  const [filtreNiveau, setFiltreNiveau] = useState<number | ''>('');
  const [filtreFiliere, setFiltreFiliere] = useState<number | ''>('');
  const [filtreStatut, setFiltreStatut] = useState<string>('');

  useEffect(() => {
    loadReferenceData();
  }, []);

  useEffect(() => {
    loadDeliberations();
  }, [filtreSession, filtreNiveau, filtreFiliere, filtreStatut, refreshTrigger]);

  const loadReferenceData = async () => {
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
      console.error('Erreur chargement données référence:', error);
    }
  };

  const loadDeliberations = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filtreSession) params.session_id = filtreSession;
      if (filtreNiveau) params.niveau_id = filtreNiveau;
      if (filtreFiliere) params.filiere_id = filtreFiliere;
      if (filtreStatut) params.statut = filtreStatut;

      const data = await deliberationService.getDeliberations(params);
      setDeliberations(data);
    } catch (error) {
      console.error('Erreur chargement délibérations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTerminer = async (id: number) => {
    try {
      await deliberationService.terminerDeliberation(id);
      loadDeliberations();
    } catch (error) {
      console.error('Erreur terminer délibération:', error);
    }
  };

  const handleValider = async (id: number) => {
    try {
      await deliberationService.validerDeliberation(id);
      loadDeliberations();
    } catch (error) {
      console.error('Erreur validation délibération:', error);
    }
  };

  const handlePublier = async (id: number) => {
    try {
      await deliberationService.publierDeliberation(id);
      loadDeliberations();
    } catch (error) {
      console.error('Erreur publication délibération:', error);
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

  const getSessionLabel = (sessionId: number) => {
    const session = sessions.find((s) => s.id === sessionId);
    return session ? session.code : `Session #${sessionId}`;
  };

  const getNiveauLabel = (niveauId: number) => {
    const niveau = niveaux.find((n) => n.id === niveauId);
    return niveau ? niveau.libelle : `Niveau #${niveauId}`;
  };

  const getFiliereLabel = (filiereId: number) => {
    const filiere = filieres.find((f) => f.id === filiereId);
    return filiere ? filiere.libelle : `Filière #${filiereId}`;
  };

  const columns: GridColDef[] = [
    {
      field: 'session_id',
      headerName: 'Session',
      width: 130,
      valueGetter: (_value: any, row: any) => getSessionLabel(row.session_id),
    },
    {
      field: 'niveau_id',
      headerName: 'Niveau',
      width: 120,
      valueGetter: (_value: any, row: any) => getNiveauLabel(row.niveau_id),
    },
    {
      field: 'filiere_id',
      headerName: 'Filière',
      width: 150,
      valueGetter: (_value: any, row: any) => getFiliereLabel(row.filiere_id),
    },
    {
      field: 'type_deliberation',
      headerName: 'Type',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value === 'semestrielle' ? 'Semestrielle' : 'Annuelle'}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'semestre',
      headerName: 'Sem.',
      width: 70,
      align: 'center',
      renderCell: (params: GridRenderCellParams) =>
        params.value ? `S${params.value}` : '-',
    },
    {
      field: 'date_deliberation',
      headerName: 'Date',
      width: 110,
      valueFormatter: (value: any) => formatDate(value),
    },
    {
      field: 'nombre_etudiants',
      headerName: 'Effectif',
      width: 80,
      align: 'center',
    },
    {
      field: 'nombre_admis',
      headerName: 'Admis',
      width: 80,
      align: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Typography color="success.main" fontWeight="medium">
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'taux_reussite',
      headerName: 'Taux',
      width: 90,
      align: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          color={params.value >= 50 ? 'success.main' : 'error.main'}
          fontWeight="medium"
        >
          {params.value?.toFixed(1) || '-'}%
        </Typography>
      ),
    },
    {
      field: 'statut',
      headerName: 'Statut',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={STATUT_DELIBERATION_LABELS[params.value as keyof typeof STATUT_DELIBERATION_LABELS] || params.value}
          size="small"
          color={STATUT_DELIBERATION_COLORS[params.value as keyof typeof STATUT_DELIBERATION_COLORS] || 'default'}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 250,
      sortable: false,
      renderCell: (params: GridRenderCellParams<Deliberation>) => {
        const delib = params.row;
        return (
          <Stack direction="row" spacing={0.5}>
            {delib.statut === 'en_cours' && (
              <Tooltip title="Terminer">
                <IconButton
                  size="small"
                  color="info"
                  onClick={() => handleTerminer(delib.id)}
                >
                  <DoneIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {delib.statut === 'terminee' && (
              <Tooltip title="Valider">
                <IconButton
                  size="small"
                  color="success"
                  onClick={() => handleValider(delib.id)}
                >
                  <ValidateIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {delib.statut === 'validee' && !delib.publiee && (
              <Tooltip title="Publier">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => handlePublier(delib.id)}
                >
                  <PublishIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="PV">
              <IconButton size="small">
                <PVIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Voir">
              <IconButton
                size="small"
                onClick={() => onView?.(delib.id)}
              >
                <ViewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Modifier">
              <IconButton
                size="small"
                color="primary"
                onClick={() => onEdit?.(delib)}
                disabled={delib.publiee}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Supprimer">
              <IconButton
                size="small"
                color="error"
                onClick={() => onDelete?.(delib.id)}
                disabled={delib.publiee}
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
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap">
          <TextField
            select
            label="Session"
            value={filtreSession}
            onChange={(e) => setFiltreSession(e.target.value as number | '')}
            size="small"
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">Toutes</MenuItem>
            {sessions.map((session) => (
              <MenuItem key={session.id} value={session.id}>
                {session.code}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Niveau"
            value={filtreNiveau}
            onChange={(e) => setFiltreNiveau(e.target.value as number | '')}
            size="small"
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">Tous</MenuItem>
            {niveaux.map((niveau) => (
              <MenuItem key={niveau.id} value={niveau.id}>
                {niveau.libelle}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Filière"
            value={filtreFiliere}
            onChange={(e) => setFiltreFiliere(e.target.value as number | '')}
            size="small"
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">Toutes</MenuItem>
            {filieres.map((filiere) => (
              <MenuItem key={filiere.id} value={filiere.id}>
                {filiere.libelle}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Statut"
            value={filtreStatut}
            onChange={(e) => setFiltreStatut(e.target.value)}
            size="small"
            sx={{ minWidth: 130 }}
          >
            <MenuItem value="">Tous</MenuItem>
            <MenuItem value="en_cours">En cours</MenuItem>
            <MenuItem value="terminee">Terminée</MenuItem>
            <MenuItem value="validee">Validée</MenuItem>
            <MenuItem value="publiee">Publiée</MenuItem>
          </TextField>

          <Button variant="outlined" onClick={loadDeliberations}>
            Actualiser
          </Button>
        </Stack>
      </Paper>

      {/* Tableau */}
      <Paper sx={{ height: 500 }}>
        <DataGrid
          rows={deliberations}
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
            noRowsLabel: 'Aucune délibération',
          }}
        />
      </Paper>
    </Box>
  );
};

export default DeliberationsList;
