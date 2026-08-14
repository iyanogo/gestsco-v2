/**
 * Composant liste des départements
 */

import React from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import DataTable from '../common/DataTable';
import type { Departement, Etablissement } from '../../types/reference';

interface DepartementsListProps {
  departements: Departement[];
  etablissements: Etablissement[];
  loading?: boolean;
  selectedEtablissementId?: number | null;
  onEtablissementFilter: (etablissementId: number | null) => void;
  onEdit: (departement: Departement) => void;
  onDelete: (id: number) => void;
  onView: (id: number) => void;
}

const DepartementsList: React.FC<DepartementsListProps> = ({
  departements,
  etablissements,
  loading = false,
  selectedEtablissementId,
  onEtablissementFilter,
  onEdit,
  onDelete,
  onView,
}) => {
  const etablissementMap = React.useMemo(() => {
    const map = new Map<number, string>();
    etablissements.forEach((e) => map.set(e.id, e.sigle || e.nom || ''));
    return map;
  }, [etablissements]);

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
      field: 'etablissement_id',
      headerName: 'Établissement',
      width: 150,
      valueGetter: (_value, row) => etablissementMap.get(row.etablissement_id) || '-',
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Filtrer par établissement</InputLabel>
          <Select
            value={selectedEtablissementId || ''}
            label="Filtrer par établissement"
            onChange={(e) => onEtablissementFilter(e.target.value ? Number(e.target.value) : null)}
          >
            <MenuItem value="">Tous les établissements</MenuItem>
            {etablissements.map((e) => (
              <MenuItem key={e.id} value={e.id}>
                {e.sigle || e.nom}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <DataTable
        columns={columns}
        rows={departements}
        loading={loading}
        searchPlaceholder="Rechercher un département..."
        onEdit={onEdit}
        onDelete={onDelete}
        onView={onView}
      />
    </Box>
  );
};

export default DepartementsList;
