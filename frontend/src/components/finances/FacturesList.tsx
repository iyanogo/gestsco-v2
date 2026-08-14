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
  Grid,
  Alert,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  PictureAsPdf as PdfIcon,
  Payment as PayIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { Facture, STATUTS_FACTURE, TYPES_FACTURE } from '../../types/finance';
import { formatMontant, formatDate, formatStatutFacture, isFactureExpiree } from '../../utils/formatters';
import factureService from '../../services/factureService';
import { downloadBlob } from '../../utils/formatters';

interface FacturesListProps {
  onEdit?: (facture: Facture) => void;
  onDelete?: (facture: Facture) => void;
  onView?: (facture: Facture) => void;
  onPay?: (facture: Facture) => void;
  onCancel?: (facture: Facture) => void;
  refreshTrigger?: number;
  etudiantId?: number;
  showFilters?: boolean;
}

const FacturesList: React.FC<FacturesListProps> = ({
  onEdit,
  onDelete,
  onView,
  onPay,
  onCancel,
  refreshTrigger,
  etudiantId,
  showFilters = true,
}) => {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(false);
  const [statutFilter, setStatutFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {};
      if (statutFilter) params.statut = statutFilter;
      if (typeFilter) params.type_facture = typeFilter;
      if (etudiantId) params.etudiant_id = etudiantId;
      
      const data = await factureService.getFactures(params);
      setFactures(data);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statutFilter, typeFilter, refreshTrigger, etudiantId]);

  const handleDownloadPDF = async (facture: Facture) => {
    try {
      const blob = await factureService.downloadFacturePDF(facture.id);
      downloadBlob(blob, `facture_${facture.numero_facture}.pdf`);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
    }
  };

  const columns: GridColDef[] = [
    { field: 'numero_facture', headerName: 'Numéro', width: 150 },
    {
      field: 'date_emission',
      headerName: 'Date émission',
      width: 120,
      renderCell: (params: GridRenderCellParams) => formatDate(params.value),
    },
    {
      field: 'date_echeance',
      headerName: 'Échéance',
      width: 120,
      renderCell: (params: GridRenderCellParams) => {
        const isExpiree = isFactureExpiree(params.row);
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {formatDate(params.value)}
            {isExpiree && (
              <Tooltip title="Échéance dépassée">
                <WarningIcon color="error" fontSize="small" />
              </Tooltip>
            )}
          </Box>
        );
      },
    },
    {
      field: 'montant_total',
      headerName: 'Total',
      width: 130,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams) => formatMontant(params.value, params.row.devise),
    },
    {
      field: 'montant_paye',
      headerName: 'Payé',
      width: 130,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ color: 'success.main' }}>
          {formatMontant(params.value, params.row.devise)}
        </Box>
      ),
    },
    {
      field: 'montant_restant',
      headerName: 'Restant',
      width: 130,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ color: params.value > 0 ? 'error.main' : 'success.main', fontWeight: 'bold' }}>
          {formatMontant(params.value, params.row.devise)}
        </Box>
      ),
    },
    {
      field: 'statut',
      headerName: 'Statut',
      width: 150,
      renderCell: (params: GridRenderCellParams) => {
        const { label, color } = formatStatutFacture(params.value);
        return <Chip label={label} color={color} size="small" />;
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => {
        const facture = params.row as Facture;
        const canEdit = facture.statut !== 'payee' && facture.statut !== 'annulee';
        const canPay = facture.statut !== 'payee' && facture.statut !== 'annulee' && facture.montant_restant > 0;
        const canCancel = facture.statut !== 'annulee';

        return (
          <Box>
            {onView && (
              <Tooltip title="Voir">
                <IconButton size="small" onClick={() => onView(facture)}>
                  <ViewIcon />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Télécharger PDF">
              <IconButton size="small" onClick={() => handleDownloadPDF(facture)}>
                <PdfIcon />
              </IconButton>
            </Tooltip>
            {onPay && canPay && (
              <Tooltip title="Enregistrer paiement">
                <IconButton size="small" color="success" onClick={() => onPay(facture)}>
                  <PayIcon />
                </IconButton>
              </Tooltip>
            )}
            {onEdit && canEdit && (
              <Tooltip title="Modifier">
                <IconButton size="small" onClick={() => onEdit(facture)}>
                  <EditIcon />
                </IconButton>
              </Tooltip>
            )}
            {onCancel && canCancel && (
              <Tooltip title="Annuler">
                <IconButton size="small" color="warning" onClick={() => onCancel(facture)}>
                  <CancelIcon />
                </IconButton>
              </Tooltip>
            )}
            {onDelete && (
              <Tooltip title="Supprimer">
                <IconButton size="small" color="error" onClick={() => onDelete(facture)}>
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );
      },
    },
  ];

  const facturesExpirees = factures.filter((f) => isFactureExpiree(f));

  return (
    <Paper sx={{ p: 2 }}>
      {facturesExpirees.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {facturesExpirees.length} facture(s) avec échéance dépassée
        </Alert>
      )}
      
      {showFilters && (
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Statut</InputLabel>
              <Select
                value={statutFilter}
                label="Statut"
                onChange={(e: SelectChangeEvent) => setStatutFilter(e.target.value)}
              >
                <MenuItem value="">Tous</MenuItem>
                {STATUTS_FACTURE.map((s) => (
                  <MenuItem key={s.value} value={s.value}>
                    {s.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                label="Type"
                onChange={(e: SelectChangeEvent) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="">Tous</MenuItem>
                {TYPES_FACTURE.map((t) => (
                  <MenuItem key={t.value} value={t.value}>
                    {t.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      )}

      <DataGrid
        rows={factures}
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

export default FacturesList;
