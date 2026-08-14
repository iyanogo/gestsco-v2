import React, { useState, useEffect } from 'react';
import { Row, Col, Button, Modal, Form, Alert } from 'react-bootstrap';
import { PageHeader } from '../../../components/layouts';
import { DataCard, DataTable, SearchFilter, ConfirmModal, Column } from '../../../components/ui';
import { getFilieres, createFiliere, updateFiliere, deleteFiliere } from '../../../services/filiereService';
import type { Filiere } from '../../../types/reference';

const FilieresListPage: React.FC = () => {
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Filiere | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    libelle: '',
    sigle: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getFilieres({
        search: searchValue || undefined,
      });
      setFilieres(data);
    } catch (err) {
      console.error('Erreur lors du chargement des filières:', err);
      setError('Impossible de charger les filières. Vérifiez que le serveur backend est démarré.');
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<Filiere>[] = [
    { key: 'code', header: 'Code', width: '100px', render: (item) => (
      <code className="text-primary">{item.code || '-'}</code>
    )},
    { key: 'libelle', header: 'Libellé' },
    { key: 'sigle', header: 'Sigle', render: (item) => (
      <span>{item.sigle || '-'}</span>
    )},
    { key: 'annee', header: 'Année', render: (item) => (
      <span>{item.annee || '-'}</span>
    )},
    { key: 'actions', header: 'Actions', width: '120px', render: (item) => (
      <div className="d-flex gap-1">
        <Button size="sm" variant="outline-primary" onClick={(e) => { e.stopPropagation(); handleEdit(item); }}>
          <i className="bi bi-pencil"></i>
        </Button>
        <Button size="sm" variant="outline-danger" onClick={(e) => { e.stopPropagation(); handleDeleteClick(item); }}>
          <i className="bi bi-trash"></i>
        </Button>
      </div>
    )}
  ];

  const filteredData = filieres.filter(item => {
    const matchSearch = !searchValue ||
      (item.libelle || '').toLowerCase().includes(searchValue.toLowerCase()) ||
      (item.code || '').toLowerCase().includes(searchValue.toLowerCase());
    return matchSearch;
  });

  const handleAdd = () => {
    setSelectedItem(null);
    setFormData({ code: '', libelle: '', sigle: '' });
    setShowModal(true);
  };

  const handleEdit = (item: Filiere) => {
    setSelectedItem(item);
    setFormData({
      code: item.code || '',
      libelle: item.libelle || '',
      sigle: item.sigle || '',
    });
    setShowModal(true);
  };

  const handleDeleteClick = (item: Filiere) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const handleSave = async () => {
    try {
      if (selectedItem) {
        await updateFiliere(selectedItem.id, formData);
      } else {
        await createFiliere(formData);
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      setError('Impossible de sauvegarder la filière.');
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      await deleteFiliere(selectedItem.id);
      setShowDeleteModal(false);
      loadData();
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setError('Impossible de supprimer la filière.');
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
        title="Filières"
        subtitle="Gestion des filières d'enseignement"
        breadcrumbs={[
          { label: 'Référentiel', path: '/admin/referentiel' },
          { label: 'Filières' }
        ]}
        actions={
          <Button variant="primary" onClick={handleAdd}>
            <i className="bi bi-plus-lg me-2"></i>
            Nouvelle filière
          </Button>
        }
      />

      <DataCard
        title={`Liste des filières (${filteredData.length})`}
        actions={
          <Button variant="outline-secondary" size="sm" onClick={loadData}>
            <i className="bi bi-arrow-clockwise me-1"></i>
            Actualiser
          </Button>
        }
      >
        <SearchFilter
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder="Rechercher une filière..."
          filters={[]}
          filterValues={filterValues}
          onFilterChange={(key, value) => setFilterValues({ ...filterValues, [key]: value })}
          onReset={() => { setSearchValue(''); setFilterValues({}); }}
        />

        <DataTable
          columns={columns}
          data={filteredData}
          loading={loading}
          emptyMessage="Aucune filière trouvée"
        />
      </DataCard>

      {/* Modal Ajout/Modification */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedItem ? 'Modifier la filière' : 'Nouvelle filière'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Code</Form.Label>
                <Form.Control
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Ex: INFO"
                />
              </Form.Group>
            </Col>
            <Col md={8}>
              <Form.Group>
                <Form.Label>Libellé *</Form.Label>
                <Form.Control
                  value={formData.libelle}
                  onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                  placeholder="Libellé de la filière"
                />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group>
                <Form.Label>Sigle</Form.Label>
                <Form.Control
                  value={formData.sigle}
                  onChange={(e) => setFormData({ ...formData, sigle: e.target.value })}
                  placeholder="Sigle (optionnel)"
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleSave}>
            <i className="bi bi-check-lg me-2"></i>
            {selectedItem ? 'Modifier' : 'Créer'}
          </Button>
        </Modal.Footer>
      </Modal>

      <ConfirmModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Supprimer la filière"
        message={`Êtes-vous sûr de vouloir supprimer la filière "${selectedItem?.libelle}" ?`}
        confirmLabel="Supprimer"
        variant="danger"
      />
    </div>
  );
};

export default FilieresListPage;
