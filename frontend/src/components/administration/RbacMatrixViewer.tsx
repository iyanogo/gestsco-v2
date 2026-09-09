import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Form, Spinner, Table } from 'react-bootstrap';
import administrationService, { RbacMatrixRow } from '../../services/administrationService';
import { useRbacMatrixStore } from '../../store/rbacMatrixStore';
import { getRbacMatrixRows } from '../../utils/rbacActions';
import { AppRole, getRoleLabel } from '../../utils/rbac';

const MATRIX_ROLES: AppRole[] = ['superadmin', 'admin', 'scolarite', 'comptable'];

const ROLE_BADGE: Record<AppRole, string> = {
  superadmin: 'dark',
  admin: 'danger',
  scolarite: 'primary',
  comptable: 'warning',
  enseignant: 'success',
  etudiant: 'info',
};

function rowKey(row: RbacMatrixRow): string {
  return `${row.module}:${row.action}`;
}

/** Matrice RBAC - consultation et édition (superadmin). */
const RbacMatrixViewer: React.FC = () => {
  const applyMatrixRows = useRbacMatrixStore((s) => s.applyRows);
  const [filterModule, setFilterModule] = useState('');
  const [rows, setRows] = useState<RbacMatrixRow[]>([]);
  const [draft, setDraft] = useState<RbacMatrixRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [fromApi, setFromApi] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadMatrix = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await administrationService.getPermissionsMatrix();
      setRows(data);
      setDraft(data);
      setFromApi(true);
    } catch {
      const fallback = getRbacMatrixRows();
      setRows(fallback);
      setDraft(fallback);
      setFromApi(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMatrix();
  }, [loadMatrix]);

  const displayRows = editMode ? draft : rows;

  const modules = useMemo(
    () => [...new Set(displayRows.map((r) => r.module))].sort(),
    [displayRows],
  );

  const filtered = filterModule
    ? displayRows.filter((r) => r.module === filterModule)
    : displayRows;

  const toggleRole = (key: string, role: AppRole) => {
    setDraft((prev) =>
      prev.map((row) => {
        if (rowKey(row) !== key) return row;
        const has = row.roles.includes(role);
        return {
          ...row,
          roles: has ? row.roles.filter((r) => r !== role) : [...row.roles, role].sort(),
        };
      }),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await administrationService.updatePermissionsMatrix(
        draft.map(({ module, action, roles }) => ({ module, action, roles })),
      );
      setRows(updated);
      setDraft(updated);
      applyMatrixRows(updated);
      setEditMode(false);
      setSuccess('Matrice RBAC enregistrée.');
      setFromApi(true);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : null;
      setError(typeof msg === 'string' ? msg : 'Échec de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft(rows);
    setEditMode(false);
    setError(null);
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" size="sm" className="me-2" />
        Chargement de la matrice…
      </div>
    );
  }

  return (
    <div>
      {!fromApi && (
        <Alert variant="warning" className="py-2 small">
          API indisponible - affichage depuis le code frontend. L&apos;édition nécessite l&apos;API.
        </Alert>
      )}

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <h5 className="mb-0 fw-bold">
          <i className="bi bi-table me-2" />
          Matrice RBAC {editMode ? '(édition)' : 'active'}
        </h5>
        <div className="d-flex flex-wrap gap-2 align-items-center">
          <Form.Select
            style={{ maxWidth: 280 }}
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            aria-label="Filtrer par module"
          >
            <option value="">Tous les modules</option>
            {modules.map((m) => (
              <option key={m} value={m}>
                {displayRows.find((r) => r.module === m)?.module_label ?? m}
              </option>
            ))}
          </Form.Select>
          {fromApi && !editMode && (
            <Button variant="outline-primary" size="sm" onClick={() => setEditMode(true)}>
              <i className="bi bi-pencil me-1" />
              Modifier
            </Button>
          )}
          {editMode && (
            <>
              <Button variant="secondary" size="sm" onClick={handleCancel} disabled={saving}>
                Annuler
              </Button>
              <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="table-responsive">
        <Table striped bordered hover size="sm" className="mb-0 align-middle">
          <thead className="table-light">
            <tr>
              <th>Module</th>
              <th>Action</th>
              {MATRIX_ROLES.map((role) => (
                <th key={role} className="text-center text-nowrap">
                  {getRoleLabel(role)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const key = rowKey(row);
              return (
                <tr key={key}>
                  <td>{row.module_label}</td>
                  <td>
                    <code>{row.action_label}</code>
                  </td>
                  {MATRIX_ROLES.map((role) => (
                    <td key={role} className="text-center">
                      {editMode ? (
                        <Form.Check
                          type="checkbox"
                          checked={row.roles.includes(role)}
                          onChange={() => toggleRole(key, role)}
                          aria-label={`${row.module_label} ${row.action_label} ${role}`}
                          className="d-inline-block"
                        />
                      ) : row.roles.includes(role) ? (
                        <Badge bg={ROLE_BADGE[role]} className="px-2">
                          <i className="bi bi-check-lg" />
                        </Badge>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

export default RbacMatrixViewer;
