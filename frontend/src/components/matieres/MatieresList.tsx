/**
 * Composant liste des matières
 */

import React from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, Stack } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import DataTable from '../common/DataTable';
import type { Matiere, Module } from '../../types/reference';

interface MatieresListProps {
  matieres: Matiere[];
  modules: Module[];
  loading?: boolean;
  selectedModuleId?: number | null;
  onModuleFilter: (moduleId: number | null) => void;
  onEdit: (matiere: Matiere) => void;
  onDelete: (id: number) => void;
  onView: (id: number) => void;
}

const MatieresList: React.FC<MatieresListProps> = ({
  matieres,
  modules,
  loading = false,
  selectedModuleId,
  onModuleFilter,
  onEdit,
  onDelete,
  onView,
}) => {
  const moduleMap = React.useMemo(() => {
    const map = new Map<number, string>();
    modules.forEach((m) => map.set(m.id, m.code || ''));
    return map;
  }, [modules]);

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
    {
      field: 'annee',
      headerName: 'Année',
      width: 100,
    },
    {
      field: 'module_id',
      headerName: 'Module',
      width: 120,
      valueGetter: (_value, row) => moduleMap.get(row.module_id) || '-',
    },
  ];

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Filtrer par module</InputLabel>
          <Select
            value={selectedModuleId || ''}
            label="Filtrer par module"
            onChange={(e) => onModuleFilter(e.target.value ? Number(e.target.value) : null)}
          >
            <MenuItem value="">Tous les modules</MenuItem>
            {modules.map((m) => (
              <MenuItem key={m.id} value={m.id}>
                {m.code} - {m.libelle}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
      <DataTable
        columns={columns}
        rows={matieres}
        loading={loading}
        searchPlaceholder="Rechercher une matière..."
        onEdit={onEdit}
        onDelete={onDelete}
        onView={onView}
      />
    </Box>
  );
};

export default MatieresList;
