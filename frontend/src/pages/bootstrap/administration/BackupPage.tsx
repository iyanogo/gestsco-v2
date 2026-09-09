import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Form, Modal } from 'react-bootstrap';
import { PageHeader } from '../../../components/layouts';
import { AdminSectionNav } from '../../../components/administration';
import { DataCard, DataTable, Column } from '../../../components/ui';
import administrationService, { BackupRun } from '../../../services/administrationService';

const STATUS_BADGE: Record<string, string> = {
  success: 'success',
  running: 'primary',
  pending: 'secondary',
  failed: 'danger',
};

function formatSize(bytes?: number | null): string {
  if (bytes == null) return '-';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

const BackupPage: React.FC = () => {
  const [backups, setBackups] = useState<BackupRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<BackupRun | null>(null);
  const [restoreConfirm, setRestoreConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBackups(await administrationService.getBackups());
    } catch {
      setError('Impossible de charger l\'historique des sauvegardes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRestore = async () => {
    if (!restoreTarget) return;
    setRestoringId(restoreTarget.id);
    setError(null);
    setSuccess(null);
    try {
      await administrationService.restoreBackup(restoreTarget.id, restoreConfirm);
      setSuccess(`Restauration lancée depuis ${restoreTarget.filename}.`);
      setRestoreTarget(null);
      setRestoreConfirm('');
      await loadData();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : null;
      setError(typeof msg === 'string' ? msg : 'Échec de la restauration.');
    } finally {
      setRestoringId(null);
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    setSuccess(null);
    try {
      const run = await administrationService.createBackup();
      if (run.status === 'success') {
        setSuccess(`Sauvegarde créée : ${run.filename}`);
      } else {
        setError(run.error_message ?? 'La sauvegarde a échoué.');
      }
      await loadData();
    } catch {
      setError('Impossible de lancer la sauvegarde.');
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = async (id: number) => {
    try {
      await administrationService.downloadBackup(id);
    } catch {
      setError('Téléchargement impossible.');
    }
  };

  const columns: Column<BackupRun>[] = [
    { key: 'filename', header: 'Fichier', render: (item) => <code>{item.filename}</code> },
    {
      key: 'date',
      header: 'Date',
      render: (item) => new Date(item.started_at).toLocaleString('fr-FR'),
    },
    {
      key: 'size',
      header: 'Taille',
      render: (item) => formatSize(item.file_size_bytes),
    },
    {
      key: 'type',
      header: 'Type',
      render: (item) => <Badge bg="secondary">{item.backup_type}</Badge>,
    },
    {
      key: 'status',
      header: 'Statut',
      render: (item) => (
        <Badge bg={STATUS_BADGE[item.status] ?? 'secondary'}>{item.status}</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) =>
        item.status === 'success' ? (
          <div className="d-flex gap-2 justify-content-end">
            <Button size="sm" variant="outline-primary" onClick={() => handleDownload(item.id)}>
              <i className="bi bi-download me-1" />
              Télécharger
            </Button>
            <Button
              size="sm"
              variant="outline-danger"
              disabled={restoringId !== null}
              onClick={() => {
                setRestoreTarget(item);
                setRestoreConfirm('');
              }}
            >
              Restaurer
            </Button>
          </div>
        ) : item.error_message ? (
          <span className="small text-danger">{item.error_message}</span>
        ) : (
          '-'
        ),
    },
  ];

  return (
    <div className="fade-in">
      <PageHeader
        title="Sauvegardes"
        subtitle="Sauvegardes PostgreSQL via pg_dump"
        breadcrumbs={[
          { label: 'Administration', path: '/admin/administration/backup' },
          { label: 'Sauvegardes' },
        ]}
        actions={
          <Button variant="primary" onClick={handleCreate} disabled={creating}>
            {creating ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Sauvegarde…
              </>
            ) : (
              <>
                <i className="bi bi-cloud-download me-2" />
                Créer une sauvegarde
              </>
            )}
          </Button>
        }
      />

      <AdminSectionNav />

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Alert variant="warning" className="mb-4">
        <i className="bi bi-exclamation-triangle me-2" />
        Nécessite <code>pg_dump</code> et <code>psql</code> sur le serveur backend.
        La restauration remplace toutes les données - confirmation <code>RESTAURER</code> requise.
      </Alert>

      <DataCard title="Historique des sauvegardes">
        <DataTable
          columns={columns}
          data={backups}
          loading={loading}
          emptyMessage="Aucune sauvegarde enregistrée."
        />
      </DataCard>

      <Modal show={restoreTarget !== null} onHide={() => setRestoreTarget(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmer la restauration</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Vous allez restaurer la base depuis{' '}
            <strong>{restoreTarget?.filename}</strong>. Cette action est destructive et
            irréversible.
          </p>
          <Form.Group>
            <Form.Label>
              Saisissez <code>RESTAURER</code> pour confirmer
            </Form.Label>
            <Form.Control
              value={restoreConfirm}
              onChange={(e) => setRestoreConfirm(e.target.value)}
              placeholder="RESTAURER"
              autoComplete="off"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setRestoreTarget(null)}>
            Annuler
          </Button>
          <Button
            variant="danger"
            disabled={restoreConfirm !== 'RESTAURER' || restoringId !== null}
            onClick={handleRestore}
          >
            {restoringId !== null ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Restauration…
              </>
            ) : (
              'Restaurer la base'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default BackupPage;
