import React from 'react';
import { Table, Form, Pagination, Spinner } from 'react-bootstrap';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  selectable?: boolean;
  selectedIds?: number[];
  onSelectChange?: (ids: number[]) => void;
  onRowClick?: (item: T) => void;
  keyField?: string;
  emptyMessage?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
}

function DataTable<T extends { id?: number }>({
  columns,
  data,
  loading = false,
  selectable = false,
  selectedIds = [],
  onSelectChange,
  onRowClick,
  keyField = 'id',
  emptyMessage = 'Aucune donnée disponible',
  pagination
}: DataTableProps<T>) {
  const handleSelectAll = (checked: boolean) => {
    if (onSelectChange) {
      if (checked) {
        onSelectChange(data.map(item => (item as any)[keyField]));
      } else {
        onSelectChange([]);
      }
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (onSelectChange) {
      if (checked) {
        onSelectChange([...selectedIds, id]);
      } else {
        onSelectChange(selectedIds.filter(selectedId => selectedId !== id));
      }
    }
  };

  const allSelected = data.length > 0 && selectedIds.length === data.length;

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Chargement...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-5 text-muted">
        <i className="bi bi-inbox fs-1 d-block mb-2"></i>
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      <Table responsive hover className="data-table mb-0">
        <thead>
          <tr>
            {selectable && (
              <th style={{ width: '40px' }}>
                <Form.Check
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </th>
            )}
            {columns.map(col => (
              <th key={col.key} style={col.width ? { width: col.width } : undefined}>
                {col.header}
                {col.sortable && (
                  <i className="bi bi-arrow-down-up ms-1 text-muted" style={{ fontSize: '0.75rem' }}></i>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => {
            const itemId = (item as any)[keyField];
            const isSelected = selectedIds.includes(itemId);

            return (
              <tr
                key={itemId || index}
                className={`${isSelected ? 'table-primary' : ''} ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick && onRowClick(item)}
              >
                {selectable && (
                  <td onClick={(e) => e.stopPropagation()}>
                    <Form.Check
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleSelectOne(itemId, e.target.checked)}
                    />
                  </td>
                )}
                {columns.map(col => (
                  <td key={col.key}>
                    {col.render ? col.render(item) : (item as any)[col.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </Table>

      {pagination && pagination.totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-3 px-2">
          <small className="text-muted">
            Page {pagination.currentPage} sur {pagination.totalPages}
          </small>
          <Pagination className="mb-0">
            <Pagination.First
              disabled={pagination.currentPage === 1}
              onClick={() => pagination.onPageChange(1)}
            />
            <Pagination.Prev
              disabled={pagination.currentPage === 1}
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
            />
            {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
              const page = i + 1;
              return (
                <Pagination.Item
                  key={page}
                  active={page === pagination.currentPage}
                  onClick={() => pagination.onPageChange(page)}
                >
                  {page}
                </Pagination.Item>
              );
            })}
            <Pagination.Next
              disabled={pagination.currentPage === pagination.totalPages}
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
            />
            <Pagination.Last
              disabled={pagination.currentPage === pagination.totalPages}
              onClick={() => pagination.onPageChange(pagination.totalPages)}
            />
          </Pagination>
        </div>
      )}
    </>
  );
}

export default DataTable;
