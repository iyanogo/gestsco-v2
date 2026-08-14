import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  Button,
  Stack,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridToolbar,
} from '@mui/x-data-grid';
import {
  EmojiEvents as TrophyIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';

import {
  ClassementItem,
  MENTION_LABELS,
  MENTION_COLORS,
  DECISION_LABELS,
  DECISION_COLORS,
} from '../../types/evaluation';
import resultatService from '../../services/resultatService';

interface ClassementTableProps {
  niveauId: number;
  filiereId: number;
  sessionId?: number;
  anneeId?: number;
  semestre?: number;
  type?: 'semestre' | 'annuel';
}

const ClassementTable: React.FC<ClassementTableProps> = ({
  niveauId,
  filiereId,
  sessionId,
  anneeId,
  semestre,
  type = 'semestre',
}) => {
  const [classement, setClassement] = useState<ClassementItem[]>([]);
  const [effectif, setEffectif] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClassement();
  }, [niveauId, filiereId, sessionId, anneeId, semestre, type]);

  const loadClassement = async () => {
    if (!niveauId || !filiereId) return;

    setLoading(true);
    try {
      let data;
      if (type === 'semestre' && sessionId && semestre) {
        data = await resultatService.getClassementSemestre(
          niveauId,
          filiereId,
          sessionId,
          semestre
        );
      } else if (type === 'annuel' && anneeId) {
        data = await resultatService.getClassementAnnuel(niveauId, filiereId, anneeId);
      } else {
        setClassement([]);
        setEffectif(0);
        setLoading(false);
        return;
      }

      setClassement(data.classement || []);
      setEffectif(data.effectif || 0);
    } catch (error) {
      console.error('Erreur chargement classement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    // Export simple en CSV
    const headers = ['Rang', 'Matricule', 'Nom', 'Prénom', 'Moyenne', 'Crédits', 'Mention', 'Décision'];
    const rows = classement.map((item) => [
      item.rang,
      item.etudiant?.matricule || '',
      item.etudiant?.nom || '',
      item.etudiant?.prenom || '',
      type === 'semestre' ? item.moyenne_generale?.toFixed(2) : item.moyenne_annuelle?.toFixed(2),
      `${item.total_credits_obtenus}/${item.total_credits_inscrits}`,
      item.mention ? MENTION_LABELS[item.mention] : '',
      DECISION_LABELS[item.decision] || item.decision,
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `classement_${type}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getRangStyle = (rang: number) => {
    if (rang === 1) return { bgcolor: '#ffd700', color: '#000' }; // Or
    if (rang === 2) return { bgcolor: '#c0c0c0', color: '#000' }; // Argent
    if (rang === 3) return { bgcolor: '#cd7f32', color: '#fff' }; // Bronze
    return {};
  };

  const columns: GridColDef[] = [
    {
      field: 'rang',
      headerName: 'Rang',
      width: 80,
      align: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const rang = params.value;
        const style = getRangStyle(rang);
        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: '50%',
              fontWeight: 'bold',
              ...style,
            }}
          >
            {rang <= 3 && <TrophyIcon sx={{ fontSize: 16, mr: 0.5 }} />}
            {rang}
          </Box>
        );
      },
    },
    {
      field: 'matricule',
      headerName: 'Matricule',
      width: 120,
      valueGetter: (_value: any, row: any) => row.etudiant?.matricule || '-',
    },
    {
      field: 'nom',
      headerName: 'Nom',
      width: 150,
      valueGetter: (_value: any, row: any) => row.etudiant?.nom || '-',
    },
    {
      field: 'prenom',
      headerName: 'Prénom',
      width: 150,
      valueGetter: (_value: any, row: any) => row.etudiant?.prenom || '-',
    },
    {
      field: 'moyenne',
      headerName: 'Moyenne',
      width: 100,
      align: 'center',
      valueGetter: (_value: any, row: any) =>
        type === 'semestre'
          ? row.moyenne_generale
          : row.moyenne_annuelle,
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          variant="body2"
          fontWeight="bold"
          color={params.value >= 10 ? 'success.main' : 'error.main'}
        >
          {params.value?.toFixed(2) || '-'}
        </Typography>
      ),
    },
    {
      field: 'credits',
      headerName: 'Crédits',
      width: 100,
      align: 'center',
      valueGetter: (_value: any, row: any) =>
        `${row.total_credits_obtenus}/${row.total_credits_inscrits}`,
    },
    {
      field: 'mention',
      headerName: 'Mention',
      width: 120,
      renderCell: (params: GridRenderCellParams) => {
        if (!params.value) return '-';
        return (
          <Chip
            label={MENTION_LABELS[params.value as keyof typeof MENTION_LABELS] || params.value}
            size="small"
            sx={{
              bgcolor: MENTION_COLORS[params.value as keyof typeof MENTION_COLORS] || '#9e9e9e',
              color: 'white',
            }}
          />
        );
      },
    },
    {
      field: 'decision',
      headerName: 'Décision',
      width: 140,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={DECISION_LABELS[params.value as keyof typeof DECISION_LABELS] || params.value}
          size="small"
          color={DECISION_COLORS[params.value as keyof typeof DECISION_COLORS] || 'default'}
        />
      ),
    },
  ];

  // Ajouter colonne passage pour classement annuel
  if (type === 'annuel') {
    columns.push({
      field: 'passage_niveau_superieur',
      headerName: 'Passage',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value ? 'Oui' : 'Non'}
          size="small"
          color={params.value ? 'success' : 'error'}
        />
      ),
    });
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* En-tête */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">
          Classement {type === 'semestre' ? `Semestre ${semestre}` : 'Annuel'} - Effectif: {effectif}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExportExcel}
          disabled={classement.length === 0}
        >
          Exporter Excel
        </Button>
      </Stack>

      {/* Tableau */}
      <Paper sx={{ height: 500 }}>
        <DataGrid
          rows={classement}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.etudiant_id || row.inscription_id}
          pageSizeOptions={[25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 50 } },
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
            noRowsLabel: 'Aucun classement disponible',
          }}
          sx={{
            '& .MuiDataGrid-row': {
              '&:nth-of-type(1)': { bgcolor: 'rgba(255, 215, 0, 0.1)' },
              '&:nth-of-type(2)': { bgcolor: 'rgba(192, 192, 192, 0.1)' },
              '&:nth-of-type(3)': { bgcolor: 'rgba(205, 127, 50, 0.1)' },
            },
          }}
        />
      </Paper>
    </Box>
  );
};

export default ClassementTable;
