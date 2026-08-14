/**
 * Composant liste des établissements
 */

import React from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import DataTable from '../common/DataTable';
import type { Etablissement, Universite } from '../../types/reference';

interface EtablissementsListProps {
  etablissements: Etablissement[];
  universites: Universite[];
  loading?: boolean;
  selectedUniversiteId?: number | null;
  onUniversiteFilter: (universiteId: number | null) => void;
  onEdit: (etablissement: Etablissement) => void;
  onDelete: (id: number) => void;
  onView: (id: number) => void;
}

const EtablissementsList: React.FC<EtablissementsListProps> = ({
  etablissements,
  universites,
  loading = false,
  selectedUniversiteId,
  onUniversiteFilter,
  onEdit,
  onDelete,
  onView,
}) => {
  const universiteMap = React.useMemo(() => {
    const map = new Map<number, string>();
    universites.forEach((u) => map.set(u.id, u.sigle || u.nom || ''));
    return map;
  }, [universites]);

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
    },
    {
      field: 'sigle',
      headerName: 'Sigle',
      width: 100,
    },
    {
      field: 'ville',
      headerName: 'Ville',
      width: 120,
    },
    {
      field: 'universite_id',
      headerName: 'Université',
      width: 150,
      valueGetter: (_value, row) => universiteMap.get(row.universite_id) || '-',
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Filtrer par université</InputLabel>
          <Select
            value={selectedUniversiteId || ''}
            label="Filtrer par université"
            onChange={(e) => onUniversiteFilter(e.target.value ? Number(e.target.value) : null)}
          >
            <MenuItem value="">Toutes les universités</MenuItem>
            {universites.map((u) => (
              <MenuItem key={u.id} value={u.id}>
                {u.sigle || u.nom}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <DataTable
        columns={columns}
        rows={etablissements}
        loading={loading}
        searchPlaceholder="Rechercher un établissement..."
        onEdit={onEdit}
        onDelete={onDelete}
        onView={onView}
      />
    </Box>
  );
};

export default EtablissementsList;
