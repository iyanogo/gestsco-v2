/**
 * Composant liste des modules
 */

import React from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, Stack } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import DataTable from '../common/DataTable';
import type { Module, Filiere } from '../../types/reference';

interface ModulesListProps {
  modules: Module[];
  filieres: Filiere[];
  loading?: boolean;
  selectedFiliereId?: number | null;
  onFiliereFilter: (filiereId: number | null) => void;
  onEdit: (module: Module) => void;
  onDelete: (id: number) => void;
  onView: (id: number) => void;
}

const ModulesList: React.FC<ModulesListProps> = ({
  modules,
  filieres,
  loading = false,
  selectedFiliereId,
  onFiliereFilter,
  onEdit,
  onDelete,
  onView,
}) => {
  const filiereMap = React.useMemo(() => {
    const map = new Map<number, string>();
    filieres.forEach((f) => map.set(f.id, f.sigle || f.libelle || ''));
    return map;
  }, [filieres]);

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
      field: 'filiere_id',
      headerName: 'Filière',
      width: 120,
      valueGetter: (_value, row) => filiereMap.get(row.filiere_id) || '-',
    },
    {
      field: 'vol_horaire',
      headerName: 'Vol. Horaire',
      width: 100,
    },
  ];

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Filtrer par filière</InputLabel>
          <Select
            value={selectedFiliereId || ''}
            label="Filtrer par filière"
            onChange={(e) => onFiliereFilter(e.target.value ? Number(e.target.value) : null)}
          >
            <MenuItem value="">Toutes les filières</MenuItem>
            {filieres.map((f) => (
              <MenuItem key={f.id} value={f.id}>
                {f.sigle || f.libelle}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
      <DataTable
        columns={columns}
        rows={modules}
        loading={loading}
        searchPlaceholder="Rechercher un module..."
        onEdit={onEdit}
        onDelete={onDelete}
        onView={onView}
      />
    </Box>
  );
};

export default ModulesList;
