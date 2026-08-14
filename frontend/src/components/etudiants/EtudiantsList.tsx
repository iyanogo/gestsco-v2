/**
 * Composant liste des étudiants avec DataGrid
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Chip,
  Avatar,
  InputAdornment,
  Stack,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridToolbar,
} from '@mui/x-data-grid';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import type { Etudiant } from '../../types/etudiant';
import { STATUT_COLORS, STATUTS_ETUDIANT } from '../../types/etudiant';
import { getEtudiants } from '../../services/etudiantService';

interface EtudiantsListProps {
  onEdit: (etudiant: Etudiant) => void;
  onDelete: (id: number) => void;
  onView: (id: number) => void;
  refreshTrigger?: number;
}

const EtudiantsList: React.FC<EtudiantsListProps> = ({
  onEdit,
  onDelete,
  onView,
  refreshTrigger = 0,
}) => {
  const [etudiants, setEtudiants] = useState<Etudiant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState<string>('');
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 25,
  });

  const fetchEtudiants = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        skip: paginationModel.page * paginationModel.pageSize,
        limit: paginationModel.pageSize,
      };
      if (search) params.search = search;
      if (statutFilter) params.statut = statutFilter;
      // Ne pas filtrer par année académique pour afficher tous les étudiants
      // Le filtre par année sera utilisé uniquement pour les inscriptions

      const data = await getEtudiants(params);
      setEtudiants(data);
    } catch (error) {
      console.error('Erreur lors du chargement des étudiants:', error);
    } finally {
      setLoading(false);
    }
  }, [search, statutFilter, paginationModel, refreshTrigger]);

  useEffect(() => {
    fetchEtudiants();
  }, [fetchEtudiants]);

  const columns: GridColDef[] = [
    {
      field: 'photo',
      headerName: '',
      width: 60,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<Etudiant>) => (
        <Avatar
          src={params.row.photo_url}
          sx={{ width: 40, height: 40 }}
        >
          <PersonIcon />
        </Avatar>
      ),
    },
    {
      field: 'matricule',
      headerName: 'Matricule',
      width: 140,
      renderCell: (params: GridRenderCellParams<Etudiant>) => (
        <strong>{params.row.matricule || '-'}</strong>
      ),
    },
    {
      field: 'nom',
      headerName: 'Nom',
      width: 150,
      valueGetter: (_value, row) => row.nom?.toUpperCase() || '',
    },
    {
      field: 'prenom',
      headerName: 'Prénom',
      width: 150,
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 200,
    },
    {
      field: 'telephone',
      headerName: 'Téléphone',
      width: 130,
    },
    {
      field: 'sexe',
      headerName: 'Sexe',
      width: 90,
      renderCell: (params: GridRenderCellParams<Etudiant>) => {
        const sexe = params.row.sexe;
        if (!sexe) return '-';
        return sexe === 'M' || sexe === 'MASCULIN' ? 'M' : 'F';
      },
    },
    {
      field: 'statut',
      headerName: 'Statut',
      width: 120,
      renderCell: (params: GridRenderCellParams<Etudiant>) => {
        const statut = params.row.statut || 'actif';
        return (
          <Chip
            label={statut}
            size="small"
            color={STATUT_COLORS[statut] || 'default'}
          />
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<Etudiant>) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Voir détails">
            <IconButton
              size="small"
              color="info"
              onClick={() => onView(params.row.id)}
            >
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Modifier">
            <IconButton
              size="small"
              color="primary"
              onClick={() => onEdit(params.row)}
            >
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

  return (
    <Box sx={{ width: '100%' }}>
      {/* Filtres */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          size="small"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 300 }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Statut</InputLabel>
          <Select
            value={statutFilter}
            label="Statut"
            onChange={(e) => setStatutFilter(e.target.value)}
          >
            <MenuItem value="">Tous</MenuItem>
            {STATUTS_ETUDIANT.map((statut) => (
              <MenuItem key={statut} value={statut}>
                {statut.charAt(0).toUpperCase() + statut.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {/* DataGrid */}
      <DataGrid
        rows={etudiants}
        columns={columns}
        loading={loading}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[10, 25, 50, 100]}
        disableRowSelectionOnClick
        autoHeight
        slots={{
          toolbar: GridToolbar,
        }}
        slotProps={{
          toolbar: {
            showQuickFilter: true,
            quickFilterProps: { debounceMs: 500 },
          },
        }}
        sx={{
          '& .MuiDataGrid-cell:focus': {
            outline: 'none',
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: 'action.hover',
          },
        }}
        localeText={{
          noRowsLabel: 'Aucun étudiant trouvé',
        }}
      />
    </Box>
  );
};

export default EtudiantsList;
