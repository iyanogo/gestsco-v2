import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Col, Form, Modal, Row } from 'react-bootstrap';
import { PageHeader } from '../../../components/layouts';
import { AdminSectionNav } from '../../../components/administration';
import { DataCard, DataTable, SearchFilter, StatCard, Column } from '../../../components/ui';
import administrationService, {
  SystemLog,
  SystemLogSummary,
} from '../../../services/administrationService';

const LEVEL_BADGE: Record<string, string> = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'danger',
};

const LogsPage: React.FC = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [summary, setSummary] = useState<SystemLogSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purgeDays, setPurgeDays] = useState(90);
  const [purgeConfirm, setPurgeConfirm] = useState('');
  const [purging, setPurging] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [logsData, summaryData] = await Promise.all([
        administrationService.getLogs({
          search: searchValue || undefined,
          level: filterValues.level || undefined,
          source: filterValues.source || undefined,
          limit: 200,
        }),
        administrationService.getLogsSummary(),
      ]);
      setLogs(logsData);
      setSummary(summaryData);
    } catch {
      setError('Impossible de charger les logs système.');
    } finally {
      setLoading(false);
    }
  }, [searchValue, filterValues]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePurge = async () => {
    setPurging(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await administrationService.purgeLogs(purgeDays, purgeConfirm);
      setSuccess(result.message);
      setShowPurgeModal(false);
      setPurgeConfirm('');
      await loadData();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : null;
      setError(typeof msg === 'string' ? msg : 'Échec de la purge des logs.');
    } finally {
      setPurging(false);
    }
  };

  const columns: Column<SystemLog>[] = [
    {
      key: 'created_at',
      header: 'Date',
      render: (item) => (
        <small>{new Date(item.created_at).toLocaleString('fr-FR')}</small>
      ),
    },
    {
      key: 'level',
      header: 'Niveau',
      render: (item) => (
        <Badge bg={LEVEL_BADGE[item.level] ?? 'secondary'}>{item.level}</Badge>
      ),
    },
    { key: 'source', header: 'Source' },
    {
      key: 'action',
      header: 'Action',
      render: (item) => item.action ?? '-',
    },
    {
      key: 'message',
      header: 'Message',
      render: (item) => <span className="small">{item.message}</span>,
    },
    {
      key: 'user',
      header: 'Utilisateur',
      render: (item) => item.user_email ?? '-',
    },
    {
      key: 'ip',
      header: 'IP',
      render: (item) => item.ip_address ?? '-',
    },
  ];

  return (
    <div className="fade-in">
      <PageHeader
        title="Logs système"
        subtitle="Journal applicatif persisté (connexions, requêtes API, événements)"
        breadcrumbs={[
          { label: 'Administration', path: '/admin/administration/logs' },
          { label: 'Logs système' },
        ]}
        actions={
          <Button variant="outline-danger" onClick={() => setShowPurgeModal(true)}>
            <i className="bi bi-trash me-2" />
            Purger l&apos;historique
          </Button>
        }
      />

      <AdminSectionNav />

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {summary && (
        <Row className="g-3 mb-4">
          <Col sm={6} xl={3}>
            <StatCard title="Total" value={summary.total} icon="journal-text" variant="primary" />
          </Col>
          <Col sm={6} xl={3}>
            <StatCard title="Succès" value={summary.success} icon="check-circle" variant="success" />
          </Col>
          <Col sm={6} xl={3}>
            <StatCard title="Avertissements" value={summary.warning} icon="exclamation-triangle" variant="warning" />
          </Col>
          <Col sm={6} xl={3}>
            <StatCard title="Erreurs" value={summary.error} icon="x-circle" variant="danger" />
          </Col>
        </Row>
      )}

      <SearchFilter
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder="Rechercher dans les messages, actions, chemins…"
        filters={[
          {
            key: 'level',
            label: 'Niveau',
            type: 'select',
            options: [
              { value: '', label: 'Tous' },
              { value: 'INFO', label: 'INFO' },
              { value: 'SUCCESS', label: 'SUCCESS' },
              { value: 'WARNING', label: 'WARNING' },
              { value: 'ERROR', label: 'ERROR' },
            ],
          },
          {
            key: 'source',
            label: 'Source',
            type: 'select',
            options: [
              { value: '', label: 'Toutes' },
              { value: 'auth', label: 'Auth' },
              { value: 'api', label: 'API' },
            ],
          },
        ]}
        filterValues={filterValues}
        onFilterChange={(key, value) =>
          setFilterValues((prev) => ({ ...prev, [key]: value }))
        }
        onReset={() => {
          setSearchValue('');
          setFilterValues({});
        }}
      />

      <DataCard title="Historique">
        <DataTable
          columns={columns}
          data={logs}
          loading={loading}
          emptyMessage="Aucun log enregistré pour le moment."
        />
      </DataCard>

      <Form.Text className="text-muted d-block mt-2">
        Les requêtes API sont journalisées automatiquement. Les connexions et actions
        utilisateurs alimentent aussi ce journal.
      </Form.Text>

      <Modal show={showPurgeModal} onHide={() => setShowPurgeModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Purger les logs anciens</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Supprime définitivement les entrées de log plus anciennes que la rétention choisie.
          </p>
          <Form.Group className="mb-3">
            <Form.Label>Rétention (jours minimum à conserver)</Form.Label>
            <Form.Control
              type="number"
              min={1}
              max={3650}
              value={purgeDays}
              onChange={(e) => setPurgeDays(Number(e.target.value))}
            />
            <Form.Text>Les logs antérieurs à {purgeDays} jours seront supprimés.</Form.Text>
          </Form.Group>
          <Form.Group>
            <Form.Label>
              Saisissez <code>PURGER</code> pour confirmer
            </Form.Label>
            <Form.Control
              value={purgeConfirm}
              onChange={(e) => setPurgeConfirm(e.target.value)}
              placeholder="PURGER"
              autoComplete="off"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPurgeModal(false)}>
            Annuler
          </Button>
          <Button
            variant="danger"
            disabled={purgeConfirm !== 'PURGER' || purging || purgeDays < 1}
            onClick={handlePurge}
          >
            {purging ? 'Purge…' : 'Purger'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default LogsPage;
