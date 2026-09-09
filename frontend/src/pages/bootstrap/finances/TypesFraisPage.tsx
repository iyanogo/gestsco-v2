import React, { useState, useEffect } from 'react';
import { Row, Col, Button, Modal, Form, Alert, Badge } from 'react-bootstrap';
import { PageHeader } from '../../../components/layouts';
import { DataCard, DataTable, SearchFilter, ConfirmModal, Column } from '../../../components/ui';
import { usePermissions } from '../../../hooks/usePermissions';
import { typeFraisService } from '../../../services/typeFraisService';
import type { TypeFrais, CreateTypeFrais } from '../../../types/finance';

const CATEGORIES = [
  { value: 'inscription', label: 'Inscription' },
  { value: 'scolarite', label: 'Scolarité' },
  { value: 'examen', label: 'Examen' },
  { value: 'bibliotheque', label: 'Bibliothèque' },
  { value: 'sport', label: 'Sport' },
  { value: 'autre', label: 'Autre' },
];

const TypesFraisPage: React.FC = () => {
  const { moduleActions } = usePermissions();
  const { canCreate, canUpdate, canDelete } = moduleActions('finances');
  const [typesFrais, setTypesFrais] = useState<TypeFrais[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TypeFrais | null>(null);
  const [formData, setFormData] = useState<CreateTypeFrais>({
    code: '',
    libelle: '',
    categorie: 'scolarite',
    montant_defaut: undefined,
    est_obligatoire: true,
    est_recurrent: false,
    description: '',
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await typeFraisService.getTypesFrais();
      setTypesFrais(data);
    } catch (err) {
      console.error('Erreur lors du chargement des types de frais:', err);
      setError('Impossible de charger les types de frais.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount?: number | null) => {
    if (amount == null) return '-';
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  const columns: Column<TypeFrais>[] = [
    {
      key: 'code',
      header: 'Code',
      width: '100px',
      render: (item) => <code className="text-primary">{item.code}</code>,
    },
    { key: 'libelle', header: 'Libellé' },
    {
      key: 'categorie',
      header: 'Catégorie',
      render: (item) => <Badge bg="secondary">{item.categorie}</Badge>,
    },
    {
      key: 'montant_defaut',
      header: 'Montant défaut',
      render: (item) => formatCurrency(item.montant_defaut),
    },
    {
      key: 'est_obligatoire',
      header: 'Obligatoire',
      render: (item) =>
        item.est_obligatoire ? (
          <Badge bg="success">Oui</Badge>
        ) : (
          <Badge bg="light" text="dark">Non</Badge>
        ),
    },
    {
      key: 'is_active',
      header: 'Statut',
      render: (item) =>
        item.is_active ? (
          <Badge bg="success">Actif</Badge>
        ) : (
          <Badge bg="secondary">Inactif</Badge>
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '120px',
      render: (item) => (
        <div className="d-flex gap-1">
          {canUpdate && (
            <Button
              size="sm"
              variant="outline-primary"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(item);
              }}
            >
              <i className="bi bi-pencil"></i>
            </Button>
          )}
          {canDelete && (
            <Button
              size="sm"
              variant="outline-danger"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(item);
              }}
            >
              <i className="bi bi-trash"></i>
            </Button>
          )}
        </div>
      ),
    },
  ];

  const filteredData = typesFrais.filter((item) => {
    const term = searchValue.toLowerCase();
    return (
      !term ||
      item.libelle.toLowerCase().includes(term) ||
      item.code.toLowerCase().includes(term) ||
      item.categorie.toLowerCase().includes(term)
    );
  });

  const handleAdd = () => {
    setSelectedItem(null);
    setFormData({
      code: '',
      libelle: '',
      categorie: 'scolarite',
      montant_defaut: undefined,
      est_obligatoire: true,
      est_recurrent: false,
      description: '',
      is_active: true,
    });
    setShowModal(true);
  };

  const handleEdit = (item: TypeFrais) => {
    setSelectedItem(item);
    setFormData({
      code: item.code,
      libelle: item.libelle,
      categorie: item.categorie,
      montant_defaut: item.montant_defaut ?? undefined,
      est_obligatoire: item.est_obligatoire,
      est_recurrent: item.est_recurrent,
      description: item.description ?? '',
      is_active: item.is_active,
    });
    setShowModal(true);
  };

  const handleDeleteClick = (item: TypeFrais) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const handleSave = async () => {
    try {
      if (selectedItem) {
        await typeFraisService.updateTypeFrais(selectedItem.id, formData);
      } else {
        await typeFraisService.createTypeFrais(formData);
      }
      setShowModal(false);
      await loadData();
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      setError('Erreur lors de la sauvegarde du type de frais.');
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      await typeFraisService.deleteTypeFrais(selectedItem.id);
      setShowDeleteModal(false);
      await loadData();
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setError('Erreur lors de la suppression du type de frais.');
    }
  };

  const totalMontantObligatoire = typesFrais
    .filter((t) => t.est_obligatoire && t.is_active)
    .reduce((acc, t) => acc + (t.montant_defaut ?? 0), 0);

  return (
    <div className="fade-in">
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <PageHeader
        title="Types de frais"
        subtitle="Configuration des différents types de frais"
        breadcrumbs={[
          { label: 'Finances', path: '/admin/finances' },
          { label: 'Types de frais' },
        ]}
        actions={
          canCreate ? (
            <Button variant="primary" onClick={handleAdd}>
              <i className="bi bi-plus-lg me-2"></i>
              Nouveau type
            </Button>
          ) : undefined
        }
      />

      <Row className="g-3 mb-4">
        <Col sm={6} xl={4}>
          <div className="p-3 bg-primary text-white rounded">
            <h3 className="mb-0">{typesFrais.length}</h3>
            <small>Types de frais</small>
          </div>
        </Col>
        <Col sm={6} xl={4}>
          <div className="p-3 bg-success text-white rounded">
            <h3 className="mb-0">{typesFrais.filter((t) => t.est_obligatoire).length}</h3>
            <small>Obligatoires</small>
          </div>
        </Col>
        <Col sm={12} xl={4}>
          <div className="p-3 bg-warning text-dark rounded">
            <h3 className="mb-0">{formatCurrency(totalMontantObligatoire)}</h3>
            <small>Total montants obligatoires</small>
          </div>
        </Col>
      </Row>

      <DataCard title={`Liste (${filteredData.length})`}>
        <SearchFilter
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder="Rechercher par code, libellé..."
          filters={[]}
          filterValues={{}}
          onFilterChange={() => undefined}
          onReset={() => setSearchValue('')}
        />
        <DataTable
          columns={columns}
          data={filteredData}
          loading={loading}
          emptyMessage="Aucun type de frais trouvé"
        />
      </DataCard>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{selectedItem ? 'Modifier' : 'Nouveau'} type de frais</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Code *</Form.Label>
              <Form.Control
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Libellé *</Form.Label>
              <Form.Control
                value={formData.libelle}
                onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Catégorie *</Form.Label>
              <Form.Select
                value={formData.categorie}
                onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Montant par défaut</Form.Label>
              <Form.Control
                type="number"
                min={0}
                value={formData.montant_defaut ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    montant_defaut: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={formData.description ?? ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Form.Group>
            <Form.Check
              type="checkbox"
              className="mb-2"
              label="Obligatoire"
              checked={formData.est_obligatoire}
              onChange={(e) => setFormData({ ...formData, est_obligatoire: e.target.checked })}
            />
            <Form.Check
              type="checkbox"
              className="mb-2"
              label="Récurrent"
              checked={formData.est_recurrent}
              onChange={(e) => setFormData({ ...formData, est_recurrent: e.target.checked })}
            />
            <Form.Check
              type="checkbox"
              label="Actif"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            />
          </Form>
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
        title="Supprimer le type de frais"
        message={`Confirmer la suppression de « ${selectedItem?.libelle} » ?`}
        confirmLabel="Supprimer"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default TypesFraisPage;
