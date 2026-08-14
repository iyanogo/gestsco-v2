/**
 * Composant liste des cycles
 */

import React from 'react';
import { Box } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import DataTable from '../common/DataTable';
import type { Cycle } from '../../types/reference';

interface CyclesListProps {
  cycles: Cycle[];
  loading?: boolean;
  onEdit: (cycle: Cycle) => void;
  onDelete: (id: number) => void;
  onView: (id: number) => void;
}

const CyclesList: React.FC<CyclesListProps> = ({
  cycles,
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
      minWidth: 200,
    },
    {
      field: 'sigle',
      headerName: 'Sigle',
      width: 100,
    },
  ];

  return (
    <Box>
      <DataTable
        columns={columns}
        rows={cycles}
        loading={loading}
        searchPlaceholder="Rechercher un cycle..."
        onEdit={onEdit}
        onDelete={onDelete}
        onView={onView}
      />
    </Box>
  );
};

export default CyclesList;
