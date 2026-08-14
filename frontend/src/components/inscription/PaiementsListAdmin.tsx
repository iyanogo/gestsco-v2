/**
 * Liste des paiements en attente de validation
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
  SelectChangeEvent,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
} from '@mui/x-data-grid';
import {
  Visibility as ViewIcon,
  CheckCircle as ValidateIcon,
  Cancel as RefuseIcon,
} from '@mui/icons-material';

import { Paiement } from '../../types/inscription';
import { paiementService } from '../../services';

interface PaiementsListAdminProps {
  onView?: (id: number) => void;
  onValidate?: (id: number) => void;
  onRefuse?: (id: number) => void;
  refreshTrigger?: number;
  filterStatut?: string;
}

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('fr-FR');
};

const formatMoney = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '-';
  return `${value.toLocaleString('fr-FR')} FCFA`;
};

const getStatutColor = (statut: string): 'default' | 'success' | 'error' | 'warning' => {
  switch (statut) {
    case 'valide':
      return 'success';
    case 'refuse':
      return 'error';
    case 'en_attente':
    default:
      return 'warning';
  }
};

const getStatutLabel = (statut: string): string => {
  switch (statut) {
    case 'valide':
      return 'Validé';
    case 'refuse':
      return 'Refusé';
    case 'en_attente':
    default:
      return 'En attente';
  }
};

const PaiementsListAdmin: React.FC<PaiementsListAdminProps> = ({
  onView,
  onValidate,
  onRefuse,
  refreshTrigger,
  filterStatut,
}) => {
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatut, setSelectedStatut] = useState<string>(filterStatut || '');
  const [selectedMode, setSelectedMode] = useState<string>('');

  const fetchPaiements = useCallback(async () => {
    setLoading(true);
    try {
      let data: Paiement[];
      if (selectedStatut === 'en_attente') {
        data = await paiementService.getPaiementsEnAttente();
      } else {
        const params: Record<string, string> = {};
        if (selectedStatut) params.statut = selectedStatut;
        data = await paiementService.getPaiements(params);
      }
      
      // Filtrer par mode si sélectionné
      if (selectedMode) {
        data = data.filter(p => p.mode_paiement === selectedMode);
      }
      
      setPaiements(data);
    } catch (error) {
      console.error('Erreur lors du chargement des paiements:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedStatut, selectedMode]);

  useEffect(() => {
    fetchPaiements();
  }, [fetchPaiements, refreshTrigger]);

  useEffect(() => {
    if (filterStatut) {
      setSelectedStatut(filterStatut);
    }
  }, [filterStatut]);

  const columns: GridColDef<Paiement>[] = [
    {
      field: 'numero_transaction',
      headerName: 'N° Transaction',
      width: 160,
    },
    {
      field: 'dossier_id',
      headerName: 'Dossier',
      width: 100,
      valueGetter: (value) => value ? `#${value}` : '-',
    },
    {
      field: 'montant',
      headerName: 'Montant',
      width: 130,
      valueGetter: (value) => formatMoney(value as number),
    },
    {
      field: 'mode_paiement',
      headerName: 'Mode',
      width: 130,
    },
    {
      field: 'date_paiement',
      headerName: 'Date',
      width: 120,
      valueGetter: (value) => formatDate(value as string),
    },
    {
      field: 'reference_paiement',
      headerName: 'Référence',
      width: 150,
      valueGetter: (value) => value || '-',
    },
    {
      field: 'statut_paiement',
      headerName: 'Statut',
      width: 120,
      renderCell: (params: GridRenderCellParams<Paiement>) => (
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
      width: 150,
      sortable: false,
      renderCell: (params: GridRenderCellParams<Paiement>) => (
        <Stack direction="row" spacing={0.5}>
          {onView && (
            <Tooltip title="Voir détails">
              <IconButton size="small" onClick={() => onView(params.row.id)}>
                <ViewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {onValidate && params.row.statut_paiement === 'en_attente' && (
            <Tooltip title="Valider">
              <IconButton
                size="small"
                color="success"
                onClick={() => onValidate(params.row.id)}
              >
                <ValidateIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {onRefuse && params.row.statut_paiement === 'en_attente' && (
            <Tooltip title="Refuser">
              <IconButton
                size="small"
                color="error"
                onClick={() => onRefuse(params.row.id)}
              >
                <RefuseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      {/* Filtres */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Statut</InputLabel>
          <Select
            value={selectedStatut}
            label="Statut"
            onChange={(e: SelectChangeEvent) => setSelectedStatut(e.target.value)}
          >
            <MenuItem value="">Tous</MenuItem>
            <MenuItem value="en_attente">En attente</MenuItem>
            <MenuItem value="valide">Validé</MenuItem>
            <MenuItem value="refuse">Refusé</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Mode de paiement</InputLabel>
          <Select
            value={selectedMode}
            label="Mode de paiement"
            onChange={(e: SelectChangeEvent) => setSelectedMode(e.target.value)}
          >
            <MenuItem value="">Tous</MenuItem>
            <MenuItem value="orange_money">Orange Money</MenuItem>
            <MenuItem value="moov_money">Moov Money</MenuItem>
            <MenuItem value="virement">Virement</MenuItem>
            <MenuItem value="especes">Espèces</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {/* DataGrid */}
      <DataGrid
        rows={paiements}
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

export default PaiementsListAdmin;
