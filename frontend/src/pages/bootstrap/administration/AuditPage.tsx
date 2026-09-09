import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Form, Modal } from 'react-bootstrap';
import { PageHeader } from '../../../components/layouts';
import { AdminSectionNav } from '../../../components/administration';
import { DataCard, DataTable, SearchFilter, Column } from '../../../components/ui';
import administrationService, { AuditEvent } from '../../../services/administrationService';

const ACTION_BADGE: Record<string, string> = {
  create: 'success',
  update: 'primary',
  delete: 'danger',
  validate: 'info',
  cancel: 'warning',
  reject: 'danger',
  apply: 'secondary',
  login: 'info',
  login_failed: 'warning',
  publish: 'info',
  calculate: 'secondary',
};

const AuditPage: React.FC = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purgeDays, setPurgeDays] = useState(365);
  const [purgeConfirm, setPurgeConfirm] = useState('');
  const [purging, setPurging] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEvents(
        await administrationService.getAuditEvents({
          search: searchValue || undefined,
          action: filterValues.action || undefined,
          entity_type: filterValues.entity_type || undefined,
          limit: 200,
        }),
      );
    } catch {
      setError('Impossible de charger le journal d\'audit.');
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
      const result = await administrationService.purgeAudit(purgeDays, purgeConfirm);
      setSuccess(result.message);
      setShowPurgeModal(false);
      setPurgeConfirm('');
      await loadData();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : null;
      setError(typeof msg === 'string' ? msg : 'Échec de la purge de l\'audit.');
    } finally {
      setPurging(false);
    }
  };

  const columns: Column<AuditEvent>[] = [
    {
      key: 'created_at',
      header: 'Date',
      render: (item) => (
        <small>{new Date(item.created_at).toLocaleString('fr-FR')}</small>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (item) => (
        <Badge bg={ACTION_BADGE[item.action] ?? 'secondary'}>{item.action}</Badge>
      ),
    },
    { key: 'entity_type', header: 'Entité' },
    { key: 'entity_id', header: 'Référence', render: (item) => <code>{item.entity_id}</code> },
    {
      key: 'user',
      header: 'Utilisateur',
      render: (item) => item.user_email ?? '-',
    },
    {
      key: 'details',
      header: 'Détails',
      render: (item) => {
        if (item.details) return <span className="small">{item.details}</span>;
        if (item.new_values) {
          return (
            <span className="small text-muted">
              {JSON.stringify(item.new_values).slice(0, 80)}
              {JSON.stringify(item.new_values).length > 80 ? '…' : ''}
            </span>
          );
        }
        return '-';
      },
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
        title="Audit"
        subtitle="Trail des modifications sensibles (utilisateurs, inscriptions, évaluations, paramétrage…)"
        breadcrumbs={[
          { label: 'Administration', path: '/admin/administration/audit' },
          { label: 'Audit' },
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

      <SearchFilter
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder="Rechercher par utilisateur, référence…"
        filters={[
          {
            key: 'action',
            label: 'Action',
            type: 'select',
            options: [
              { value: '', label: 'Toutes' },
              { value: 'create', label: 'Création' },
              { value: 'update', label: 'Modification' },
              { value: 'delete', label: 'Suppression' },
              { value: 'login', label: 'Connexion' },
              { value: 'login_failed', label: 'Échec connexion' },
              { value: 'validate', label: 'Validation' },
              { value: 'cancel', label: 'Annulation' },
              { value: 'reject', label: 'Rejet' },
              { value: 'apply', label: 'Application remise' },
              { value: 'publish', label: 'Publication' },
              { value: 'calculate', label: 'Calcul résultats' },
            ],
          },
          {
            key: 'entity_type',
            label: 'Entité',
            type: 'select',
            options: [
              { value: '', label: 'Toutes' },
              { value: 'user', label: 'Utilisateur' },
              { value: 'etudiant', label: 'Étudiant' },
              { value: 'inscription', label: 'Inscription' },
              { value: 'facture', label: 'Facture' },
              { value: 'paiement', label: 'Paiement' },
              { value: 'remise', label: 'Remise' },
              { value: 'note', label: 'Note' },
              { value: 'examen', label: 'Examen' },
              { value: 'deliberation', label: 'Délibération' },
              { value: 'resultat', label: 'Résultat' },
              { value: 'parametre', label: 'Paramètre système' },
              { value: 'configuration', label: 'Configuration établissement' },
              { value: 'configuration_deliberation', label: 'Config. délibération' },
              { value: 'bareme', label: 'Barème' },
              { value: 'mention', label: 'Mention' },
              { value: 'template', label: 'Template document' },
              { value: 'regle_calcul', label: 'Règle de calcul' },
              { value: 'modele_email', label: 'Modèle email' },
              { value: 'modele_sms', label: 'Modèle SMS' },
              { value: 'pays', label: 'Pays' },
              { value: 'presence', label: 'Présence' },
              { value: 'stage', label: 'Stage' },
              { value: 'filiere', label: 'Filière' },
              { value: 'niveau', label: 'Niveau' },
              { value: 'matiere', label: 'Matière' },
              { value: 'departement', label: 'Département' },
              { value: 'reservation_salle', label: 'Réservation salle' },
              { value: 'document_etudiant', label: 'Document étudiant' },
              { value: 'seance', label: 'Séance (EDT)' },
              { value: 'soutenance', label: 'Soutenance' },
              { value: 'rbac_permission', label: 'Permission RBAC' },
              { value: 'backup', label: 'Sauvegarde' },
              { value: 'system_log', label: 'Log système' },
              { value: 'audit_event', label: 'Événement audit' },
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

      <DataCard title="Événements d'audit">
        <DataTable
          columns={columns}
          data={events}
          loading={loading}
          emptyMessage="Aucun événement d'audit enregistré."
        />
      </DataCard>

      <Modal show={showPurgeModal} onHide={() => setShowPurgeModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Purger l&apos;audit ancien</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Supprime définitivement les événements d&apos;audit plus anciens que la rétention
            choisie.
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
            <Form.Text>Les événements antérieurs à {purgeDays} jours seront supprimés.</Form.Text>
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

export default AuditPage;
