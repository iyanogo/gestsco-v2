import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
} from '@mui/x-data-grid';

import {
  ResultatMatiere,
  DECISION_LABELS,
  DECISION_COLORS,
} from '../../types/evaluation';
import resultatService from '../../services/resultatService';

interface ResultatsTableProps {
  etudiantId: number;
  sessionId?: number | null;
}

const ResultatsTable: React.FC<ResultatsTableProps> = ({
  etudiantId,
  sessionId,
}) => {
  const [resultats, setResultats] = useState<ResultatMatiere[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResultats();
  }, [etudiantId, sessionId]);

  const loadResultats = async () => {
    setLoading(true);
    try {
      const data = await resultatService.getResultatsMatieres(
        etudiantId,
        sessionId || undefined
      );
      setResultats(data);
    } catch (error) {
      console.error('Erreur chargement résultats:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalCreditsInscrits = resultats.reduce(
    (sum, r) => sum + (r.credit_matiere || 0),
    0
  );
  const totalCreditsObtenus = resultats.reduce(
    (sum, r) => sum + (r.credit_obtenu || 0),
    0
  );
  const moyenneGenerale =
    resultats.length > 0
      ? resultats.reduce((sum, r) => sum + (r.moyenne_matiere || 0), 0) /
        resultats.length
      : null;

  const columns: GridColDef[] = [
    {
      field: 'matiere',
      headerName: 'Matière',
      flex: 1,
      minWidth: 200,
      valueGetter: (_value: any, row: any) =>
        row.matiere
          ? `${row.matiere.code} - ${row.matiere.libelle}`
          : `Matière #${row.matiere_id}`,
    },
    {
      field: 'note_cc',
      headerName: 'CC',
      width: 80,
      align: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          variant="body2"
          color={params.value >= 10 ? 'success.main' : params.value ? 'error.main' : 'text.secondary'}
        >
          {params.value?.toFixed(2) || '-'}
        </Typography>
      ),
    },
    {
      field: 'note_tp',
      headerName: 'TP',
      width: 80,
      align: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          variant="body2"
          color={params.value >= 10 ? 'success.main' : params.value ? 'error.main' : 'text.secondary'}
        >
          {params.value?.toFixed(2) || '-'}
        </Typography>
      ),
    },
    {
      field: 'note_examen',
      headerName: 'Examen',
      width: 90,
      align: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          variant="body2"
          color={params.value >= 10 ? 'success.main' : params.value ? 'error.main' : 'text.secondary'}
        >
          {params.value?.toFixed(2) || '-'}
        </Typography>
      ),
    },
    {
      field: 'moyenne_matiere',
      headerName: 'Moyenne',
      width: 100,
      align: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          variant="body2"
          fontWeight="bold"
          color={params.value >= 10 ? 'success.main' : params.value ? 'error.main' : 'text.secondary'}
        >
          {params.value?.toFixed(2) || '-'}
        </Typography>
      ),
    },
    {
      field: 'credit_matiere',
      headerName: 'Crédit',
      width: 80,
      align: 'center',
    },
    {
      field: 'credit_obtenu',
      headerName: 'Obtenu',
      width: 80,
      align: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          variant="body2"
          fontWeight="bold"
          color={params.value > 0 ? 'success.main' : 'error.main'}
        >
          {params.value || 0}
        </Typography>
      ),
    },
    {
      field: 'statut',
      headerName: 'Statut',
      width: 120,
      renderCell: (params: GridRenderCellParams) => {
        const isValide = params.value === 'valide';
        return (
          <Chip
            label={isValide ? 'Validé' : 'Non validé'}
            size="small"
            color={isValide ? 'success' : 'error'}
          />
        );
      },
    },
    {
      field: 'decision',
      headerName: 'Décision',
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={DECISION_LABELS[params.value as keyof typeof DECISION_LABELS] || params.value}
          size="small"
          color={DECISION_COLORS[params.value as keyof typeof DECISION_COLORS] || 'default'}
        />
      ),
    },
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Récapitulatif */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">
                Moyenne générale
              </Typography>
              <Typography
                variant="h5"
                color={moyenneGenerale && moyenneGenerale >= 10 ? 'success.main' : 'error.main'}
              >
                {moyenneGenerale?.toFixed(2) || '-'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">
                Crédits obtenus
              </Typography>
              <Typography variant="h5" color="primary">
                {totalCreditsObtenus} / {totalCreditsInscrits}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">
                Matières validées
              </Typography>
              <Typography variant="h5">
                {resultats.filter((r) => r.statut === 'valide').length} / {resultats.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">
                Taux de validation
              </Typography>
              <Typography
                variant="h5"
                color={
                  resultats.filter((r) => r.statut === 'valide').length / resultats.length >= 0.5
                    ? 'success.main'
                    : 'error.main'
                }
              >
                {resultats.length > 0
                  ? ((resultats.filter((r) => r.statut === 'valide').length / resultats.length) * 100).toFixed(0)
                  : 0}
                %
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tableau */}
      <Paper sx={{ height: 400 }}>
        <DataGrid
          rows={resultats}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
          }}
          disableRowSelectionOnClick
          localeText={{
            noRowsLabel: 'Aucun résultat',
          }}
        />
      </Paper>
    </Box>
  );
};

export default ResultatsTable;
