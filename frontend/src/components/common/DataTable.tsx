/**
 * Composant générique pour afficher des tables de données
 */

import React from 'react';
import { Box, IconButton, Tooltip, TextField, InputAdornment } from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
} from '@mui/x-data-grid';
import { Visibility, Edit, Delete, Search } from '@mui/icons-material';

interface DataTableProps<T> {
  columns: GridColDef[];
  rows: T[];
  loading?: boolean;
  searchPlaceholder?: string;
  onEdit?: (row: T) => void;
  onDelete?: (id: number) => void;
  onView?: (id: number) => void;
  showActions?: boolean;
  getRowId?: (row: T) => number;
}

function DataTable<T extends { id: number }>({
  columns,
  rows,
  loading = false,
  searchPlaceholder = 'Rechercher...',
  onEdit,
  onDelete,
  onView,
  showActions = true,
  getRowId = (row) => row.id,
}: DataTableProps<T>) {
  const [searchText, setSearchText] = React.useState('');
  const [paginationModel, setPaginationModel] = React.useState({
    pageSize: 10,
    page: 0,
  });

  const filteredRows = React.useMemo(() => {
    if (!searchText) return rows;
    const lowerSearch = searchText.toLowerCase();
    return rows.filter((row) =>
      Object.values(row).some(
        (value) =>
          value !== null &&
          value !== undefined &&
          String(value).toLowerCase().includes(lowerSearch)
      )
    );
  }, [rows, searchText]);

  const actionColumn: GridColDef = {
    field: 'actions',
    headerName: 'Actions',
    width: 150,
    sortable: false,
    filterable: false,
    renderCell: (params: GridRenderCellParams) => (
      <Box>
        {onView && (
          <Tooltip title="Voir">
            <IconButton
              size="small"
              color="info"
              onClick={() => onView(params.row.id)}
            >
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {onEdit && (
          <Tooltip title="Modifier">
            <IconButton
              size="small"
              color="primary"
              onClick={() => onEdit(params.row as T)}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {onDelete && (
          <Tooltip title="Supprimer">
            <IconButton
              size="small"
              color="error"
              onClick={() => onDelete(params.row.id)}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    ),
  };

  const allColumns = showActions ? [...columns, actionColumn] : columns;

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 2 }}>
        <TextField
          size="small"
          placeholder={searchPlaceholder}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ width: 300 }}
        />
      </Box>
      <DataGrid
        rows={filteredRows}
        columns={allColumns}
        loading={loading}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[5, 10, 25, 50]}
        getRowId={getRowId}
        disableRowSelectionOnClick
        autoHeight
                sx={{
          '& .MuiDataGrid-cell:focus': {
            outline: 'none',
          },
        }}
      />
    </Box>
  );
}

export default DataTable;
