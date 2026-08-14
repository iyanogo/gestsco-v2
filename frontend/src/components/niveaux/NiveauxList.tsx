/**
 * Composant liste des niveaux
 */

import React from 'react';
import { Box } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import DataTable from '../common/DataTable';
import type { Niveau } from '../../types/reference';

interface NiveauxListProps {
  niveaux: Niveau[];
  loading?: boolean;
  onEdit: (niveau: Niveau) => void;
  onDelete: (id: number) => void;
  onView: (id: number) => void;
}

const NiveauxList: React.FC<NiveauxListProps> = ({
  niveaux,
  loading = false,
  onEdit,
  onDelete,
  onView,
}) => {
  const columns: GridColDef[] = [
    {
      field: 'code',
      headerName: 'Code',
      width: 120,
    },
    {
      field: 'libelle',
      headerName: 'Libellé',
      flex: 1,
      minWidth: 250,
    },
  ];

  return (
    <Box>
      <DataTable
        columns={columns}
        rows={niveaux}
        loading={loading}
        searchPlaceholder="Rechercher un niveau..."
        onEdit={onEdit}
        onDelete={onDelete}
        onView={onView}
      />
    </Box>
  );
};

export default NiveauxList;
