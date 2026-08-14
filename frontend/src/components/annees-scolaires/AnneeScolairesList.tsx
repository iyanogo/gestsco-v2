/**
 * Composant liste des années scolaires
 */

import React from 'react';
import { Box, Chip } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import DataTable from '../common/DataTable';
import type { Annee } from '../../types/reference';

interface AnneeScolairesListProps {
  annees: Annee[];
  loading?: boolean;
  onEdit: (annee: Annee) => void;
  onDelete: (id: number) => void;
  onView: (id: number) => void;
  onActivate?: (id: number) => void;
}

const AnneeScolairesList: React.FC<AnneeScolairesListProps> = ({
  annees,
  loading = false,
  onEdit,
  onDelete,
  onView,
}) => {
  const columns: GridColDef[] = [
    {
      field: 'code',
      headerName: 'Code',
      width: 150,
    },
    {
      field: 'libelle',
      headerName: 'Libellé',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'statut',
      headerName: 'Statut',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Active' : 'Inactive'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      ),
    },
  ];

  return (
    <Box>
      <DataTable
        columns={columns}
        rows={annees}
        loading={loading}
        searchPlaceholder="Rechercher une année scolaire..."
        onEdit={onEdit}
        onDelete={onDelete}
        onView={onView}
      />
    </Box>
  );
};

export default AnneeScolairesList;
