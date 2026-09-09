import React, { useEffect, useState } from 'react';
import { Alert, Badge, Button, Col, Form, Modal, Row } from 'react-bootstrap';
import { PageHeader } from '../../../components/layouts';
import { ConfirmModal, DataCard, DataTable, SearchFilter, Column } from '../../../components/ui';
import { usePermissions } from '../../../hooks/usePermissions';
import { remiseService } from '../../../services/remiseService';
import type { CreateRemise, Remise } from '../../../types/finance';

const TYPE_REMISE = [
  { value: 'pourcentage', label: 'Pourcentage (%)' },
  { value: 'montant_fixe', label: 'Montant fixe' },
];

const emptyForm = (): CreateRemise => ({
  code: '',
  libelle: '',
  type_remise: 'pourcentage',
  valeur: 0,
  date_debut: new Date().toISOString().slice(0, 10),
  date_fin: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
  is_active: true,
});

const RemisesListPage: React.FC = () => {
  const { moduleActions } = usePermissions();
  const { canCreate, canUpdate, canDelete } = moduleActions('finances');
  const [remises, setRemises] = useState<Remise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Remise | null>(null);
  const [formData, setFormData] = useState<CreateRemise>(emptyForm());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      setRemises(await remiseService.getRemises({ limit: 500 }));
    } catch {
      setError('Impossible de charger les remises.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = remises.filter((r) => {
    const q = searchValue.toLowerCase();
    return !q || r.code.toLowerCase().includes(q) || r.libelle.toLowerCase().includes(q);
  });

  const formatValeur = (item: Remise) =>
    item.type_remise === 'pourcentage' ? `${item.valeur} %` : `${Number(item.valeur).toLocaleString('fr-FR')} FCFA`;

  const columns: Column<Remise>[] = [
    { key: 'code', header: 'Code', render: (i) => <code>{i.code}</code> },
    { key: 'libelle', header: 'Libellé' },
    {
      key: 'type',
      header: 'Type',
      render: (i) => <Badge bg="secondary">{i.type_remise}</Badge>,
    },
    { key: 'valeur', header: 'Valeur', render: formatValeur },
    {
      key: 'validite',
      header: 'Validité',
      render: (i) => (
        <small>
          {new Date(i.date_debut).toLocaleDateString('fr-FR')} →{' '}
          {new Date(i.date_fin).toLocaleDateString('fr-FR')}
        </small>
      ),
    },
    {
      key: 'utilisations',
      header: 'Utilisations',
      render: (i) =>
        i.nombre_utilisations_max
          ? `${i.nombre_utilisations} / ${i.nombre_utilisations_max}`
          : String(i.nombre_utilisations),
    },
    {
      key: 'statut',
      header: 'Statut',
      render: (i) => (
        <Badge bg={i.is_active ? 'success' : 'secondary'}>{i.is_active ? 'Active' : 'Inactive'}</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '100px',
      render: (item) => (
        <div className="d-flex gap-1">
          {canUpdate && (
            <Button size="sm" variant="outline-primary" onClick={() => handleEdit(item)}>
              <i className="bi bi-pencil" />
            </Button>
          )}
          {canDelete && (
            <Button size="sm" variant="outline-danger" onClick={() => handleDeleteClick(item)}>
              <i className="bi bi-trash" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const handleAdd = () => {
    setSelectedItem(null);
    setFormData(emptyForm());
    setShowModal(true);
  };

  const handleEdit = (item: Remise) => {
    setSelectedItem(item);
    setFormData({
      code: item.code,
      libelle: item.libelle,
      type_remise: item.type_remise,
      valeur: Number(item.valeur),
      type_frais_id: item.type_frais_id ?? undefined,
      conditions: item.conditions ?? undefined,
      date_debut: item.date_debut.slice(0, 10),
      date_fin: item.date_fin.slice(0, 10),
      nombre_utilisations_max: item.nombre_utilisations_max ?? undefined,
      is_active: item.is_active,
    });
    setShowModal(true);
  };

  const handleDeleteClick = (item: Remise) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const handleSave = async () => {
    try {
      if (selectedItem) {
        await remiseService.updateRemise(selectedItem.id, formData);
      } else {
        await remiseService.createRemise(formData);
      }
      setShowModal(false);
      await loadData();
    } catch {
      setError('Erreur lors de l\'enregistrement de la remise.');
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      await remiseService.deleteRemise(selectedItem.id);
      setShowDeleteModal(false);
      await loadData();
    } catch {
      setError('Suppression impossible.');
    }
  };

  return (
    <div className="fade-in">
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <PageHeader
        title="Remises"
        subtitle="Réductions et bourses applicables aux factures"
        breadcrumbs={[
          { label: 'Finances', path: '/admin/finances/factures' },
          { label: 'Remises' },
        ]}
        actions={
          canCreate ? (
            <Button variant="primary" onClick={handleAdd}>
              <i className="bi bi-plus-lg me-2" />
              Nouvelle remise
            </Button>
          ) : undefined
        }
      />

      <Row className="g-3 mb-4">
        <Col sm={4}>
          <div className="p-3 bg-primary text-white rounded">
            <h3 className="mb-0">{remises.length}</h3>
            <small>Remises configurées</small>
          </div>
        </Col>
        <Col sm={4}>
          <div className="p-3 bg-success text-white rounded">
            <h3 className="mb-0">{remises.filter((r) => r.is_active).length}</h3>
            <small>Actives</small>
          </div>
        </Col>
      </Row>

      <DataCard title={`Liste (${filtered.length})`}>
        <SearchFilter
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder="Rechercher par code, libellé..."
          filters={[]}
          filterValues={{}}
          onFilterChange={() => undefined}
          onReset={() => setSearchValue('')}
        />
        <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="Aucune remise" />
      </DataCard>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{selectedItem ? 'Modifier' : 'Nouvelle'} remise</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={4}>
              <Form.Label>Code *</Form.Label>
              <Form.Control
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </Col>
            <Col md={8}>
              <Form.Label>Libellé *</Form.Label>
              <Form.Control
                value={formData.libelle}
                onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Type *</Form.Label>
              <Form.Select
                value={formData.type_remise}
                onChange={(e) => setFormData({ ...formData, type_remise: e.target.value })}
              >
                {TYPE_REMISE.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={6}>
              <Form.Label>Valeur *</Form.Label>
              <Form.Control
                type="number"
                min={0}
                value={formData.valeur}
                onChange={(e) => setFormData({ ...formData, valeur: Number(e.target.value) })}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Date début *</Form.Label>
              <Form.Control
                type="date"
                value={formData.date_debut}
                onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Date fin *</Form.Label>
              <Form.Control
                type="date"
                value={formData.date_fin}
                onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
              />
            </Col>
            <Col md={12}>
              <Form.Check
                type="switch"
                label="Active"
                checked={formData.is_active ?? true}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Enregistrer
          </Button>
        </Modal.Footer>
      </Modal>

      <ConfirmModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Supprimer la remise"
        message={`Supprimer « ${selectedItem?.libelle} » ?`}
        confirmLabel="Supprimer"
        variant="danger"
      />
    </div>
  );
};

export default RemisesListPage;
