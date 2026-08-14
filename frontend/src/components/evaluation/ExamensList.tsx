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
  NoteAdd as NoteIcon,
  BarChart as StatsIcon,
  CheckCircle as ValidateIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import {
  Examen,
  TYPE_EVALUATION_LABELS,
  STATUT_EXAMEN_LABELS,
} from '../../types/evaluation';
import examenService from '../../services/examenService';
import sessionExamenService from '../../services/sessionExamenService';
import { getMatieres } from '../../services/matiereService';
import { getNiveaux } from '../../services/niveauService';

interface ExamensListProps {
  sessionId?: number | null;
  onEdit?: (examen: Examen) => void;
  onDelete?: (id: number) => void;
  onView?: (id: number) => void;
  onSaisieNotes?: (examen: Examen) => void;
  onStatistiques?: (examen: Examen) => void;
  refreshTrigger?: number;
}

const ExamensList: React.FC<ExamensListProps> = ({
  sessionId,
  onEdit,
  onDelete,
  onView,
  onSaisieNotes,
  onStatistiques,
  refreshTrigger,
}) => {
  const [examens, setExamens] = useState<Examen[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [matieres, setMatieres] = useState<any[]>([]);
  const [niveaux, setNiveaux] = useState<any[]>([]);

  // Filtres
  const [filtreSession, setFiltreSession] = useState<number | ''>(sessionId || '');
  const [filtreMatiere, setFiltreMatiere] = useState<number | ''>('');
  const [filtreNiveau, setFiltreNiveau] = useState<number | ''>('');
  const [filtreType, setFiltreType] = useState<string>('');

  useEffect(() => {
    loadReferenceData();
  }, []);

  useEffect(() => {
    if (sessionId) {
      setFiltreSession(sessionId);
    }
  }, [sessionId]);

  useEffect(() => {
    loadExamens();
  }, [filtreSession, filtreMatiere, filtreNiveau, filtreType, refreshTrigger]);

  const loadReferenceData = async () => {
    try {
      const [sessionsData, matieresData, niveauxData] = await Promise.all([
        sessionExamenService.getSessions(),
        getMatieres(),
        getNiveaux(),
      ]);
      setSessions(sessionsData);
      setMatieres(matieresData);
      setNiveaux(niveauxData);
    } catch (error) {
      console.error('Erreur chargement données référence:', error);
    }
  };

  const loadExamens = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filtreSession) params.session_id = filtreSession;
      if (filtreMatiere) params.matiere_id = filtreMatiere;
      if (filtreNiveau) params.niveau_id = filtreNiveau;
      if (filtreType) params.type_evaluation = filtreType;

      const data = await examenService.getExamens(params);
      setExamens(data);
    } catch (error) {
      console.error('Erreur chargement examens:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValider = async (id: number) => {
    try {
      await examenService.validerExamen(id);
      loadExamens();
    } catch (error) {
      console.error('Erreur validation examen:', error);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: fr });
    } catch {
      return dateString;
    }
  };

  const getMatiereLabel = (matiereId: number) => {
    const matiere = matieres.find((m) => m.id === matiereId);
    return matiere ? `${matiere.code} - ${matiere.libelle}` : `Matière #${matiereId}`;
  };

  const getNiveauLabel = (niveauId: number) => {
    const niveau = niveaux.find((n) => n.id === niveauId);
    return niveau ? niveau.libelle : `Niveau #${niveauId}`;
  };

  const getStatutColor = (statut: string): 'default' | 'primary' | 'warning' | 'success' | 'info' => {
    switch (statut) {
      case 'planifie': return 'default';
      case 'en_cours': return 'primary';
      case 'termine': return 'info';
      case 'notes_saisies': return 'warning';
      case 'valide': return 'success';
      default: return 'default';
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'matiere_id',
      headerName: 'Matière',
      flex: 1,
      minWidth: 200,
      valueGetter: (_value: any, row: any) => getMatiereLabel(row.matiere_id),
    },
    {
      field: 'niveau_id',
      headerName: 'Niveau',
      width: 120,
      valueGetter: (_value: any, row: any) => getNiveauLabel(row.niveau_id),
    },
    {
      field: 'type_evaluation',
      headerName: 'Type',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={TYPE_EVALUATION_LABELS[params.value as keyof typeof TYPE_EVALUATION_LABELS] || params.value}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'date_examen',
      headerName: 'Date',
      width: 150,
      valueFormatter: (value: any) => formatDate(value),
    },
    {
      field: 'salle',
      headerName: 'Salle',
      width: 100,
    },
    {
      field: 'coefficient',
      headerName: 'Coef.',
      width: 80,
      align: 'center',
    },
    {
      field: 'note_sur',
      headerName: 'Note sur',
      width: 90,
      align: 'center',
    },
    {
      field: 'statut',
      headerName: 'Statut',
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={STATUT_EXAMEN_LABELS[params.value as keyof typeof STATUT_EXAMEN_LABELS] || params.value}
          size="small"
          color={getStatutColor(params.value)}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 220,
      sortable: false,
      renderCell: (params: GridRenderCellParams<Examen>) => {
        const examen = params.row;
        return (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Saisir les notes">
              <IconButton
                size="small"
                color="primary"
                onClick={() => onSaisieNotes?.(examen)}
                disabled={examen.statut === 'valide'}
              >
                <NoteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Statistiques">
              <IconButton
                size="small"
                color="info"
                onClick={() => onStatistiques?.(examen)}
              >
                <StatsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {examen.statut === 'notes_saisies' && (
              <Tooltip title="Valider">
                <IconButton
                  size="small"
                  color="success"
                  onClick={() => handleValider(examen.id)}
                >
                  <ValidateIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Voir">
              <IconButton
                size="small"
                onClick={() => onView?.(examen.id)}
              >
                <ViewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Modifier">
              <IconButton
                size="small"
                color="primary"
                onClick={() => onEdit?.(examen)}
                disabled={examen.statut === 'valide'}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Supprimer">
              <IconButton
                size="small"
                color="error"
                onClick={() => onDelete?.(examen.id)}
                disabled={examen.statut !== 'planifie'}
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
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">Toutes</MenuItem>
            {sessions.map((session) => (
              <MenuItem key={session.id} value={session.id}>
                {session.code} - {session.libelle}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Matière"
            value={filtreMatiere}
            onChange={(e) => setFiltreMatiere(e.target.value as number | '')}
            size="small"
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">Toutes</MenuItem>
            {matieres.map((matiere) => (
              <MenuItem key={matiere.id} value={matiere.id}>
                {matiere.code} - {matiere.libelle}
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
            label="Type"
            value={filtreType}
            onChange={(e) => setFiltreType(e.target.value)}
            size="small"
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">Tous</MenuItem>
            <MenuItem value="cc">Contrôle Continu</MenuItem>
            <MenuItem value="tp">Travaux Pratiques</MenuItem>
            <MenuItem value="examen">Examen</MenuItem>
            <MenuItem value="examen_final">Examen Final</MenuItem>
            <MenuItem value="projet">Projet</MenuItem>
          </TextField>

          <Button variant="outlined" onClick={loadExamens}>
            Actualiser
          </Button>
        </Stack>
      </Paper>

      {/* Tableau */}
      <Paper sx={{ height: 500 }}>
        <DataGrid
          rows={examens}
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
            noRowsLabel: 'Aucun examen',
          }}
        />
      </Paper>
    </Box>
  );
};

export default ExamensList;
