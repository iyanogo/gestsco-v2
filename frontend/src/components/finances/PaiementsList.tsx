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
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import {
  Visibility as ViewIcon,
  CheckCircle as ValidateIcon,
  Cancel as RejectIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { Paiement, STATUTS_PAIEMENT, MODES_PAIEMENT } from '../../types/finance';
import { formatMontant, formatDateTime, formatStatutPaiement, formatModePaiement } from '../../utils/formatters';
import paiementFactureService from '../../services/paiementFactureService';
import { downloadBlob } from '../../utils/formatters';

interface PaiementsListProps {
  onView?: (paiement: Paiement) => void;
  onValidate?: (paiement: Paiement) => void;
  onReject?: (paiement: Paiement) => void;
  refreshTrigger?: number;
  etudiantId?: number;
  factureId?: number;
  showFilters?: boolean;
}

const PaiementsList: React.FC<PaiementsListProps> = ({
  onView,
  onValidate,
  onReject,
  refreshTrigger,
  etudiantId,
  factureId,
  showFilters = true,
}) => {
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [loading, setLoading] = useState(false);
  const [statutFilter, setStatutFilter] = useState<string>('');
  const [modeFilter, setModeFilter] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {};
      if (statutFilter) params.statut = statutFilter;
      if (modeFilter) params.mode_paiement = modeFilter;
      if (etudiantId) params.etudiant_id = etudiantId;
      if (factureId) params.facture_id = factureId;
      
      const data = await paiementFactureService.getPaiements(params);
      setPaiements(data);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statutFilter, modeFilter, refreshTrigger, etudiantId, factureId]);

  const handleDownloadRecu = async (paiement: Paiement) => {
    if (!paiement.numero_recu) return;
    try {
      const blob = await paiementFactureService.downloadRecuPDF(paiement.id);
      downloadBlob(blob, `recu_${paiement.numero_recu}.pdf`);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
    }
  };

  const columns: GridColDef[] = [
    { field: 'numero_paiement', headerName: 'N° Paiement', width: 150 },
    { field: 'numero_recu', headerName: 'N° Reçu', width: 150, renderCell: (params) => params.value || '-' },
    {
      field: 'date_paiement',
      headerName: 'Date',
      width: 150,
      renderCell: (params: GridRenderCellParams) => formatDateTime(params.value),
    },
    {
      field: 'montant',
      headerName: 'Montant',
      width: 130,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ color: 'success.main', fontWeight: 'bold' }}>
          {formatMontant(params.value, params.row.devise)}
        </Box>
      ),
    },
    {
      field: 'mode_paiement',
      headerName: 'Mode',
      width: 140,
      renderCell: (params: GridRenderCellParams) => formatModePaiement(params.value),
    },
    {
      field: 'statut',
      headerName: 'Statut',
      width: 130,
      renderCell: (params: GridRenderCellParams) => {
        const { label, color } = formatStatutPaiement(params.value);
        return <Chip label={label} color={color} size="small" />;
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => {
        const paiement = params.row as Paiement;
        const canValidate = paiement.statut === 'en_attente';
        const canDownloadRecu = paiement.statut === 'valide' && paiement.numero_recu;

        return (
          <Box>
            {onView && (
              <Tooltip title="Voir">
                <IconButton size="small" onClick={() => onView(paiement)}>
                  <ViewIcon />
                </IconButton>
              </Tooltip>
            )}
            {canDownloadRecu && (
              <Tooltip title="Télécharger reçu">
                <IconButton size="small" onClick={() => handleDownloadRecu(paiement)}>
                  <ReceiptIcon />
                </IconButton>
              </Tooltip>
            )}
            {onValidate && canValidate && (
              <Tooltip title="Valider">
                <IconButton size="small" color="success" onClick={() => onValidate(paiement)}>
                  <ValidateIcon />
                </IconButton>
              </Tooltip>
            )}
            {onReject && canValidate && (
              <Tooltip title="Rejeter">
                <IconButton size="small" color="error" onClick={() => onReject(paiement)}>
                  <RejectIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );
      },
    },
  ];

  return (
    <Paper sx={{ p: 2 }}>
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
                {STATUTS_PAIEMENT.map((s) => (
                  <MenuItem key={s.value} value={s.value}>
                    {s.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Mode de paiement</InputLabel>
              <Select
                value={modeFilter}
                label="Mode de paiement"
                onChange={(e: SelectChangeEvent) => setModeFilter(e.target.value)}
              >
                <MenuItem value="">Tous</MenuItem>
                {MODES_PAIEMENT.map((m) => (
                  <MenuItem key={m.value} value={m.value}>
                    {m.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      )}

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
      />
    </Paper>
  );
};

export default PaiementsList;
