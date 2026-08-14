import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  TextField,
  MenuItem,
  Grid,
  Typography,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  CalendarMonth as CalendarIcon,
  Accessible as AccessibleIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Salle, TYPES_SALLE } from '../../types/emploiTemps';
import { salleService } from '../../services/salleService';
import { batimentService } from '../../services/batimentService';
import { Batiment } from '../../types/emploiTemps';

interface SallesListProps {
  onEdit: (salle: Salle) => void;
  onDelete: (salle: Salle) => void;
  onView: (salle: Salle) => void;
  onPlanning?: (salle: Salle) => void;
  refresh?: number;
}

const SallesList: React.FC<SallesListProps> = ({
  onEdit,
  onDelete,
  onView,
  onPlanning,
  refresh,
}) => {
  const [salles, setSalles] = useState<Salle[]>([]);
  const [batiments, setBatiments] = useState<Batiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    batiment_id: '',
    type_salle: '',
    capacite_min: '',
  });

  useEffect(() => {
    loadData();
  }, [refresh]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sallesData, batimentsData] = await Promise.all([
        salleService.getSalles({
          batiment_id: filters.batiment_id ? Number(filters.batiment_id) : undefined,
          type_salle: filters.type_salle || undefined,
          capacite_min: filters.capacite_min ? Number(filters.capacite_min) : undefined,
        }),
        batimentService.getBatiments(),
      ]);
      setSalles(sallesData);
      setBatiments(batimentsData);
    } catch (error) {
      console.error('Erreur lors du chargement des salles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const getBatimentLibelle = (batiment_id: number) => {
    const batiment = batiments.find((b) => b.id === batiment_id);
    return batiment?.libelle || '-';
  };

  const getTypeSalleLabel = (type: string) => {
    const found = TYPES_SALLE.find((t) => t.value === type);
    return found?.label || type;
  };

  const getTypeSalleColor = (type: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    const colors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
      cours: 'primary',
      tp: 'success',
      amphi: 'secondary',
      labo: 'warning',
      salle_info: 'info',
      salle_reunion: 'default',
    };
    return colors[type] || 'default';
  };

  const columns: GridColDef[] = [
    { field: 'code', headerName: 'Code', width: 100 },
    { field: 'libelle', headerName: 'Libellé', width: 180, flex: 1 },
    {
      field: 'batiment_id',
      headerName: 'Bâtiment',
      width: 150,
      valueGetter: (value) => getBatimentLibelle(value),
    },
    {
      field: 'type_salle',
      headerName: 'Type',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={getTypeSalleLabel(params.value)}
          color={getTypeSalleColor(params.value)}
          size="small"
        />
      ),
    },
    { field: 'etage', headerName: 'Étage', width: 80, align: 'center' },
    { field: 'capacite', headerName: 'Capacité', width: 90, align: 'center' },
    {
      field: 'equipements',
      headerName: 'Équipements',
      width: 200,
      renderCell: (params: GridRenderCellParams) => {
        if (!params.value) return '-';
        const equipements = params.value.split(',').slice(0, 3);
        return (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {equipements.map((eq: string, index: number) => (
              <Chip key={index} label={eq.trim()} size="small" variant="outlined" />
            ))}
            {params.value.split(',').length > 3 && (
              <Chip label={`+${params.value.split(',').length - 3}`} size="small" />
            )}
          </Box>
        );
      },
    },
    {
      field: 'is_accessible_pmr',
      headerName: 'PMR',
      width: 70,
      align: 'center',
      renderCell: (params: GridRenderCellParams) =>
        params.value ? (
          <Tooltip title="Accessible PMR">
            <AccessibleIcon color="primary" />
          </Tooltip>
        ) : null,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Tooltip title="Voir">
            <IconButton size="small" onClick={() => onView(params.row)}>
              <ViewIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Modifier">
            <IconButton size="small" onClick={() => onEdit(params.row)}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          {onPlanning && (
            <Tooltip title="Planning">
              <IconButton size="small" onClick={() => onPlanning(params.row)}>
                <CalendarIcon />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Supprimer">
            <IconButton size="small" color="error" onClick={() => onDelete(params.row)}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Filtres
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              size="small"
              label="Bâtiment"
              value={filters.batiment_id}
              onChange={(e) => setFilters({ ...filters, batiment_id: e.target.value })}
            >
              <MenuItem value="">Tous</MenuItem>
              {batiments.map((batiment) => (
                <MenuItem key={batiment.id} value={batiment.id}>
                  {batiment.libelle}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              size="small"
              label="Type de salle"
              value={filters.type_salle}
              onChange={(e) => setFilters({ ...filters, type_salle: e.target.value })}
            >
              <MenuItem value="">Tous</MenuItem>
              {TYPES_SALLE.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Capacité minimale"
              value={filters.capacite_min}
              onChange={(e) => setFilters({ ...filters, capacite_min: e.target.value })}
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ height: 500 }}>
        <DataGrid
          rows={salles}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          disableRowSelectionOnClick
        />
      </Paper>
    </Box>
  );
};

export default SallesList;
