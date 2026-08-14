/**
 * Composant liste des universités
 */

import React from 'react';
import { Box } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import DataTable from '../common/DataTable';
import type { Universite } from '../../types/reference';

interface UniversitesListProps {
  universites: Universite[];
  loading?: boolean;
  onEdit: (universite: Universite) => void;
  onDelete: (id: number) => void;
  onView: (id: number) => void;
}

const UniversitesList: React.FC<UniversitesListProps> = ({
  universites,
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
      field: 'nom',
      headerName: 'Nom',
      flex: 1,
      minWidth: 200,
      valueGetter: (_value, row) => row.nom || row.libelle || '',
    },
    {
      field: 'sigle',
      headerName: 'Sigle',
      width: 100,
    },
    {
      field: 'ville',
      headerName: 'Ville',
      width: 150,
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 200,
    },
  ];

  return (
    <Box>
      <DataTable
        columns={columns}
        rows={universites}
        loading={loading}
        searchPlaceholder="Rechercher une université..."
        onEdit={onEdit}
        onDelete={onDelete}
        onView={onView}
      />
    </Box>
  );
};

export default UniversitesList;
