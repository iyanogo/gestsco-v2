/**
 * Liste des dossiers de candidature pour l'administration
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
  TextField,
  InputAdornment,
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
  School as AdmitIcon,
  Search as SearchIcon,
} from '@mui/icons-material';

import { DossierCandidature, CampagneInscription } from '../../types/inscription';
import { dossierCandidatureService, campagneInscriptionService } from '../../services';

interface DossiersListAdminProps {
  campagneId?: number | null;
  onView: (id: number) => void;
  onValidate?: (id: number) => void;
  onRefuse?: (id: number) => void;
  onAdmit?: (id: number) => void;
  refreshTrigger?: number;
}

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('fr-FR');
};

const getStatutColor = (statut: string): 'default' | 'info' | 'warning' | 'success' | 'error' => {
  switch (statut) {
    case 'en_cours':
      return 'default';
    case 'complet':
      return 'info';
    case 'valide':
      return 'warning';
    case 'admis':
      return 'success';
    case 'refuse':
      return 'error';
    default:
      return 'default';
  }
};

const getStatutLabel = (statut: string): string => {
  switch (statut) {
    case 'en_cours':
      return 'En cours';
    case 'complet':
      return 'Complet';
    case 'valide':
      return 'Validé';
    case 'admis':
      return 'Admis';
    case 'refuse':
      return 'Refusé';
    default:
      return statut;
  }
};

const DossiersListAdmin: React.FC<DossiersListAdminProps> = ({
  campagneId,
  onView,
  onValidate,
  onRefuse,
  onAdmit,
  refreshTrigger,
}) => {
  const [dossiers, setDossiers] = useState<DossierCandidature[]>([]);
  const [loading, setLoading] = useState(true);
  const [campagnes, setCampagnes] = useState<CampagneInscription[]>([]);

  // Filtres
  const [selectedCampagne, setSelectedCampagne] = useState<string>(campagneId?.toString() || '');
  const [selectedStatut, setSelectedStatut] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const fetchDossiers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {};
      if (selectedCampagne) params.campagne_id = parseInt(selectedCampagne);
      if (selectedStatut) params.statut = selectedStatut;
      if (searchTerm) params.nom = searchTerm;

      const data = await dossierCandidatureService.getDossiers(params);
      setDossiers(data);
    } catch (error) {
      console.error('Erreur lors du chargement des dossiers:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCampagne, selectedStatut, searchTerm]);

  const fetchCampagnes = useCallback(async () => {
    try {
      const data = await campagneInscriptionService.getCampagnes();
      setCampagnes(data);
    } catch (error) {
      console.error('Erreur lors du chargement des campagnes:', error);
    }
  }, []);

  useEffect(() => {
    fetchCampagnes();
  }, [fetchCampagnes]);

  useEffect(() => {
    fetchDossiers();
  }, [fetchDossiers, refreshTrigger]);

  useEffect(() => {
    if (campagneId) {
      setSelectedCampagne(campagneId.toString());
    }
  }, [campagneId]);

  const columns: GridColDef<DossierCandidature>[] = [
    {
      field: 'numero_dossier',
      headerName: 'N° Dossier',
      width: 140,
    },
    {
      field: 'candidat_nom',
      headerName: 'Nom',
      width: 150,
    },
    {
      field: 'candidat_prenom',
      headerName: 'Prénom',
      width: 150,
    },
    {
      field: 'candidat_email',
      headerName: 'Email',
      width: 200,
    },
    {
      field: 'filiere_1',
      headerName: 'Filière souhaitée',
      width: 150,
      valueGetter: (_value, row) => row.filiere_1?.libelle || '-',
    },
    {
      field: 'statut_dossier',
      headerName: 'Statut',
      width: 120,
      renderCell: (params: GridRenderCellParams<DossierCandidature>) => (
        <Chip
          label={getStatutLabel(params.value as string)}
          color={getStatutColor(params.value as string)}
          size="small"
        />
      ),
    },
    {
      field: 'date_soumission',
      headerName: 'Date soumission',
      width: 130,
      valueGetter: (value) => formatDate(value as string),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      sortable: false,
      renderCell: (params: GridRenderCellParams<DossierCandidature>) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Voir détails">
            <IconButton size="small" onClick={() => onView(params.row.id)}>
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {onValidate && params.row.statut_dossier === 'complet' && (
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
          {onRefuse && ['complet', 'valide'].includes(params.row.statut_dossier) && (
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
          {onAdmit && params.row.statut_dossier === 'valide' && (
            <Tooltip title="Admettre">
              <IconButton
                size="small"
                color="primary"
                onClick={() => onAdmit(params.row.id)}
              >
                <AdmitIcon fontSize="small" />
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
        <TextField
          size="small"
          placeholder="Rechercher par nom ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 250 }}
        />

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Campagne</InputLabel>
          <Select
            value={selectedCampagne}
            label="Campagne"
            onChange={(e: SelectChangeEvent) => setSelectedCampagne(e.target.value)}
          >
            <MenuItem value="">Toutes</MenuItem>
            {campagnes.map((campagne) => (
              <MenuItem key={campagne.id} value={campagne.id.toString()}>
                {campagne.libelle}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Statut</InputLabel>
          <Select
            value={selectedStatut}
            label="Statut"
            onChange={(e: SelectChangeEvent) => setSelectedStatut(e.target.value)}
          >
            <MenuItem value="">Tous</MenuItem>
            <MenuItem value="en_cours">En cours</MenuItem>
            <MenuItem value="complet">Complet</MenuItem>
            <MenuItem value="valide">Validé</MenuItem>
            <MenuItem value="admis">Admis</MenuItem>
            <MenuItem value="refuse">Refusé</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {/* DataGrid */}
      <DataGrid
        rows={dossiers}
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

export default DossiersListAdmin;
