/**
 * Liste des campagnes d'inscription avec DataGrid
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Button,
  SelectChangeEvent,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
} from '@mui/x-data-grid';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  PlayArrow as OpenIcon,
  Stop as CloseIcon,
  BarChart as StatsIcon,
} from '@mui/icons-material';

import { CampagneInscription, AnneeAcademique } from '../../types/inscription';
import { Cycle } from '../../types/reference';
import { campagneInscriptionService, anneeAcademiqueService } from '../../services';
import { getCycles } from '../../services/cycleService';

interface CampagnesListProps {
  onEdit: (campagne: CampagneInscription) => void;
  onDelete: (id: number) => void;
  onView: (id: number) => void;
  onStats?: (id: number) => void;
  refreshTrigger?: number;
}

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR');
};

const formatMoney = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '-';
  return `${value.toLocaleString('fr-FR')} F`;
};

const getStatutColor = (statut: string): 'default' | 'success' | 'error' => {
  switch (statut) {
    case 'ouverte':
      return 'success';
    case 'cloturee':
      return 'error';
    default:
      return 'default';
  }
};

const getStatutLabel = (statut: string): string => {
  switch (statut) {
    case 'ouverte':
      return 'Ouverte';
    case 'cloturee':
      return 'Clôturée';
    default:
      return 'Brouillon';
  }
};

const CampagnesList: React.FC<CampagnesListProps> = ({
  onEdit,
  onDelete,
  onView,
  onStats,
  refreshTrigger,
}) => {
  const [campagnes, setCampagnes] = useState<CampagneInscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [annees, setAnnees] = useState<AnneeAcademique[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);

  // Filtres
  const [selectedAnnee, setSelectedAnnee] = useState<string>('');
  const [selectedCycle, setSelectedCycle] = useState<string>('');
  const [selectedStatut, setSelectedStatut] = useState<string>('');

  const fetchCampagnes = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, number | string> = {};
      if (selectedAnnee) params.annee_id = parseInt(selectedAnnee);
      if (selectedCycle) params.cycle_id = parseInt(selectedCycle);
      if (selectedStatut) params.statut = selectedStatut;

      const data = await campagneInscriptionService.getCampagnes(params);
      setCampagnes(data);
    } catch (error) {
      console.error('Erreur lors du chargement des campagnes:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedAnnee, selectedCycle, selectedStatut]);

  const fetchFilters = useCallback(async () => {
    try {
      const [anneesData, cyclesData] = await Promise.all([
        anneeAcademiqueService.getAnnees(),
        getCycles(),
      ]);
      setAnnees(anneesData);
      setCycles(cyclesData);
    } catch (error) {
      console.error('Erreur lors du chargement des filtres:', error);
    }
  }, []);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  useEffect(() => {
    fetchCampagnes();
  }, [fetchCampagnes, refreshTrigger]);

  const handleOuvrir = async (id: number) => {
    try {
      await campagneInscriptionService.ouvrirCampagne(id);
      fetchCampagnes();
    } catch (error) {
      console.error('Erreur lors de l\'ouverture de la campagne:', error);
    }
  };

  const handleCloturer = async (id: number) => {
    try {
      await campagneInscriptionService.cloturerCampagne(id);
      fetchCampagnes();
    } catch (error) {
      console.error('Erreur lors de la clôture de la campagne:', error);
    }
  };

  const columns: GridColDef<CampagneInscription>[] = [
    {
      field: 'code',
      headerName: 'Code',
      width: 120,
    },
    {
      field: 'libelle',
      headerName: 'Libellé',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'cycle',
      headerName: 'Cycle',
      width: 120,
      valueGetter: (_value, row) => row.cycle?.libelle || '-',
    },
    {
      field: 'date_ouverture',
      headerName: 'Ouverture',
      width: 120,
      valueGetter: (value) => formatDate(value as string),
    },
    {
      field: 'date_cloture',
      headerName: 'Clôture',
      width: 120,
      valueGetter: (value) => formatDate(value as string),
    },
    {
      field: 'frais_inscription',
      headerName: 'Frais',
      width: 100,
      valueGetter: (value) => formatMoney(value as number),
    },
    {
      field: 'nombre_places',
      headerName: 'Places',
      width: 80,
      valueGetter: (value) => value || 'Illimité',
    },
    {
      field: 'statut',
      headerName: 'Statut',
      width: 120,
      renderCell: (params: GridRenderCellParams<CampagneInscription>) => (
        <Chip
          label={getStatutLabel(params.value as string)}
          color={getStatutColor(params.value as string)}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 250,
      sortable: false,
      renderCell: (params: GridRenderCellParams<CampagneInscription>) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Voir détails">
            <IconButton size="small" onClick={() => onView(params.row.id)}>
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {onStats && (
            <Tooltip title="Statistiques">
              <IconButton size="small" onClick={() => onStats(params.row.id)}>
                <StatsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {params.row.statut === 'brouillon' && (
            <Tooltip title="Ouvrir">
              <IconButton
                size="small"
                color="success"
                onClick={() => handleOuvrir(params.row.id)}
              >
                <OpenIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {params.row.statut === 'ouverte' && (
            <Tooltip title="Clôturer">
              <IconButton
                size="small"
                color="error"
                onClick={() => handleCloturer(params.row.id)}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Modifier">
            <IconButton size="small" onClick={() => onEdit(params.row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Supprimer">
            <IconButton
              size="small"
              color="error"
              onClick={() => onDelete(params.row.id)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  const handleAnneeChange = (event: SelectChangeEvent) => {
    setSelectedAnnee(event.target.value);
  };

  const handleCycleChange = (event: SelectChangeEvent) => {
    setSelectedCycle(event.target.value);
  };

  const handleStatutChange = (event: SelectChangeEvent) => {
    setSelectedStatut(event.target.value);
  };

  const handleReset = () => {
    setSelectedAnnee('');
    setSelectedCycle('');
    setSelectedStatut('');
  };

  return (
    <Box>
      {/* Filtres */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Année académique</InputLabel>
          <Select
            value={selectedAnnee}
            label="Année académique"
            onChange={handleAnneeChange}
          >
            <MenuItem value="">Toutes</MenuItem>
            {annees.map((annee) => (
              <MenuItem key={annee.id} value={annee.id.toString()}>
                {annee.libelle}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Cycle</InputLabel>
          <Select
            value={selectedCycle}
            label="Cycle"
            onChange={handleCycleChange}
          >
            <MenuItem value="">Tous</MenuItem>
            {cycles.map((cycle) => (
              <MenuItem key={cycle.id} value={cycle.id.toString()}>
                {cycle.libelle}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Statut</InputLabel>
          <Select
            value={selectedStatut}
            label="Statut"
            onChange={handleStatutChange}
          >
            <MenuItem value="">Tous</MenuItem>
            <MenuItem value="brouillon">Brouillon</MenuItem>
            <MenuItem value="ouverte">Ouverte</MenuItem>
            <MenuItem value="cloturee">Clôturée</MenuItem>
          </Select>
        </FormControl>

        <Button variant="outlined" onClick={handleReset}>
          Réinitialiser
        </Button>
      </Stack>

      {/* DataGrid */}
      <DataGrid
        rows={campagnes}
        columns={columns}
        loading={loading}
        autoHeight
        pageSizeOptions={[10, 25, 50]}
        initialState={{
          pagination: { paginationModel: { pageSize: 10 } },
        }}
        disableRowSelectionOnClick
        sx={{
          '& .MuiDataGrid-cell:focus': {
            outline: 'none',
          },
        }}
      />
    </Box>
  );
};

export default CampagnesList;
