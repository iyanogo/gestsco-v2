import React, { useState, useEffect, useCallback } from 'react';
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
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import { format } from 'date-fns';
import { ReservationSalle, STATUTS_RESERVATION, getStatutReservationColor } from '../../types/emploiTemps';
import { reservationSalleService } from '../../services/reservationSalleService';
import { salleService } from '../../services/salleService';
import { Salle } from '../../types/emploiTemps';

interface ReservationsListProps {
  onEdit?: (reservation: ReservationSalle) => void;
  onDelete?: (reservation: ReservationSalle) => void;
  onApprove?: (reservation: ReservationSalle) => void;
  onReject?: (reservation: ReservationSalle) => void;
  onView?: (reservation: ReservationSalle) => void;
  showActions?: boolean;
  showApprovalActions?: boolean;
  fetchMode?: 'all' | 'mes' | 'en-attente';
  refresh?: number;
}

const ReservationsList: React.FC<ReservationsListProps> = ({
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onView,
  showActions = true,
  showApprovalActions = false,
  fetchMode = 'all',
  refresh,
}) => {
  const [reservations, setReservations] = useState<ReservationSalle[]>([]);
  const [salles, setSalles] = useState<Salle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    salle_id: '',
    date: null as Date | null,
    statut: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let reservationsData: ReservationSalle[];
      if (fetchMode === 'mes') {
        reservationsData = await reservationSalleService.getMesReservations(
          filters.statut || undefined
        );
      } else if (fetchMode === 'en-attente') {
        reservationsData = await reservationSalleService.getReservationsEnAttente();
      } else {
        reservationsData = await reservationSalleService.getReservations({
          salle_id: filters.salle_id ? Number(filters.salle_id) : undefined,
          date: filters.date ? format(filters.date, 'yyyy-MM-dd') : undefined,
          statut: filters.statut || undefined,
        });
      }
      const sallesData = await salleService.getSalles();
      setReservations(reservationsData);
      setSalles(sallesData);
    } catch (error) {
      console.error('Erreur lors du chargement des réservations:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchMode, filters]);

  useEffect(() => {
    loadData();
  }, [loadData, refresh]);

  const getSalleLibelle = (salle_id: number) => {
    const salle = salles.find((s) => s.id === salle_id);
    return salle?.libelle || '-';
  };

  const getStatutLabel = (statut: string) => {
    const found = STATUTS_RESERVATION.find((s) => s.value === statut);
    return found?.label || statut;
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  const columns: GridColDef[] = [
    { field: 'numero_reservation', headerName: 'Numéro', width: 130 },
    {
      field: 'salle_id',
      headerName: 'Salle',
      width: 150,
      valueGetter: (value) => getSalleLibelle(value),
    },
    {
      field: 'date_reservation',
      headerName: 'Date',
      width: 120,
      valueFormatter: (value) => {
        if (!value) return '-';
        return new Date(value).toLocaleDateString('fr-FR');
      },
    },
    {
      field: 'horaires',
      headerName: 'Horaires',
      width: 120,
      valueGetter: (_, row) => `${formatTime(row.heure_debut)} - ${formatTime(row.heure_fin)}`,
    },
    { field: 'motif', headerName: 'Motif', width: 200, flex: 1 },
    {
      field: 'statut',
      headerName: 'Statut',
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={getStatutLabel(params.value)}
          color={getStatutReservationColor(params.value) as any}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: showApprovalActions ? 200 : 150,
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
          {showApprovalActions && params.row.statut === 'en_attente' && (
            <>
              {onApprove && (
                <Tooltip title="Approuver">
                  <IconButton
                    size="small"
                    color="success"
                    onClick={() => onApprove(params.row)}
                  >
                    <CheckIcon />
                  </IconButton>
                </Tooltip>
              )}
              {onReject && (
                <Tooltip title="Refuser">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => onReject(params.row)}
                  >
                    <CloseIcon />
                  </IconButton>
                </Tooltip>
              )}
            </>
          )}
          {showActions && params.row.statut === 'en_attente' && onEdit && (
            <Tooltip title="Modifier">
              <IconButton size="small" onClick={() => onEdit(params.row)}>
                <EditIcon />
              </IconButton>
            </Tooltip>
          )}
          {showActions && onDelete && (
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
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
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
                label="Salle"
                value={filters.salle_id}
                onChange={(e) => setFilters({ ...filters, salle_id: e.target.value })}
              >
                <MenuItem value="">Toutes</MenuItem>
                {salles.map((salle) => (
                  <MenuItem key={salle.id} value={salle.id}>
                    {salle.libelle}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <DatePicker
                label="Date"
                value={filters.date}
                onChange={(date) => setFilters({ ...filters, date })}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                size="small"
                label="Statut"
                value={filters.statut}
                onChange={(e) => setFilters({ ...filters, statut: e.target.value })}
              >
                <MenuItem value="">Tous</MenuItem>
                {STATUTS_RESERVATION.map((statut) => (
                  <MenuItem key={statut.value} value={statut.value}>
                    {statut.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ height: 500 }}>
          <DataGrid
            rows={reservations}
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
    </LocalizationProvider>
  );
};

export default ReservationsList;
