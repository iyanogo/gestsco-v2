import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckIcon,
  Repeat as RepeatIcon,
} from '@mui/icons-material';
import { TypeFrais, CATEGORIES_FRAIS } from '../../types/finance';
import { formatMontant, formatCategorieFrais } from '../../utils/formatters';
import typeFraisService from '../../services/typeFraisService';

interface TypesFraisListProps {
  onEdit?: (typeFrais: TypeFrais) => void;
  onDelete?: (typeFrais: TypeFrais) => void;
  onView?: (typeFrais: TypeFrais) => void;
  refreshTrigger?: number;
}

const TypesFraisList: React.FC<TypesFraisListProps> = ({
  onEdit,
  onDelete,
  onView,
  refreshTrigger,
}) => {
  const [typesFrais, setTypesFrais] = useState<TypeFrais[]>([]);
  const [loading, setLoading] = useState(false);
  const [categorieFilter, setCategorieFilter] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const params = categorieFilter ? { categorie: categorieFilter } : undefined;
      const data = await typeFraisService.getTypesFrais(params);
      setTypesFrais(data);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [categorieFilter, refreshTrigger]);

  const handleCategorieChange = (event: SelectChangeEvent) => {
    setCategorieFilter(event.target.value);
  };

  const getCategorieColor = (categorie: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    const colors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
      inscription: 'primary',
      scolarite: 'success',
      examen: 'warning',
      bibliotheque: 'info',
      sport: 'secondary',
      autre: 'default',
    };
    return colors[categorie] || 'default';
  };

  const columns: GridColDef[] = [
    { field: 'code', headerName: 'Code', width: 120 },
    { field: 'libelle', headerName: 'Libellé', flex: 1, minWidth: 200 },
    {
      field: 'categorie',
      headerName: 'Catégorie',
      width: 140,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={formatCategorieFrais(params.value)}
          color={getCategorieColor(params.value)}
          size="small"
        />
      ),
    },
    {
      field: 'montant_defaut',
      headerName: 'Montant par défaut',
      width: 150,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams) =>
        params.value ? formatMontant(params.value) : '-',
    },
    {
      field: 'est_obligatoire',
      headerName: 'Obligatoire',
      width: 100,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) =>
        params.value ? (
          <Tooltip title="Obligatoire">
            <CheckIcon color="success" />
          </Tooltip>
        ) : null,
    },
    {
      field: 'est_recurrent',
      headerName: 'Récurrent',
      width: 100,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) =>
        params.value ? (
          <Tooltip title="Récurrent">
            <RepeatIcon color="info" />
          </Tooltip>
        ) : null,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          {onView && (
            <Tooltip title="Voir">
              <IconButton size="small" onClick={() => onView(params.row)}>
                <ViewIcon />
              </IconButton>
            </Tooltip>
          )}
          {onEdit && (
            <Tooltip title="Modifier">
              <IconButton size="small" onClick={() => onEdit(params.row)}>
                <EditIcon />
              </IconButton>
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip title="Supprimer">
              <IconButton size="small" color="error" onClick={() => onDelete(params.row)}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Filtrer par catégorie</InputLabel>
          <Select
            value={categorieFilter}
            label="Filtrer par catégorie"
            onChange={handleCategorieChange}
          >
            <MenuItem value="">Toutes</MenuItem>
            {CATEGORIES_FRAIS.map((cat) => (
              <MenuItem key={cat.value} value={cat.value}>
                {cat.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <DataGrid
        rows={typesFrais}
        columns={columns}
        loading={loading}
        autoHeight
        pageSizeOptions={[10, 25, 50]}
        initialState={{
          pagination: { paginationModel: { pageSize: 10 } },
        }}
        disableRowSelectionOnClick
      />
    </Paper>
  );
};

export default TypesFraisList;
