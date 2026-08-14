import React, { useState, useEffect } from 'react';
import { Row, Col, Button, Badge, Modal, Form } from 'react-bootstrap';
import { PageHeader } from '../../../components/layouts';
import { DataCard, DataTable, ConfirmModal, Column } from '../../../components/ui';

interface AnneeScolaire {
  id: number;
  code: string;
  libelle: string;
  dateDebut: string;
  dateFin: string;
  estActive: boolean;
  estCloturee: boolean;
}

const AnneesScolairesPage: React.FC = () => {
  const [annees, setAnnees] = useState<AnneeScolaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AnneeScolaire | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    libelle: '',
    dateDebut: '',
    dateFin: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setTimeout(() => {
      setAnnees([
        { id: 1, code: '2025-2026', libelle: 'Année académique 2025-2026', dateDebut: '2025-10-01', dateFin: '2026-07-31', estActive: true, estCloturee: false },
        { id: 2, code: '2024-2025', libelle: 'Année académique 2024-2025', dateDebut: '2024-10-01', dateFin: '2025-07-31', estActive: false, estCloturee: true },
        { id: 3, code: '2023-2024', libelle: 'Année académique 2023-2024', dateDebut: '2023-10-01', dateFin: '2024-07-31', estActive: false, estCloturee: true },
        { id: 4, code: '2026-2027', libelle: 'Année académique 2026-2027', dateDebut: '2026-10-01', dateFin: '2027-07-31', estActive: false, estCloturee: false },
      ]);
      setLoading(false);
    }, 500);
  };

  const columns: Column<AnneeScolaire>[] = [
    { key: 'code', header: 'Code', width: '120px', render: (item) => (
      <span className="fw-bold">{item.code}</span>
    )},
    { key: 'libelle', header: 'Libellé' },
    { key: 'dateDebut', header: 'Date début', render: (item) => (
      new Date(item.dateDebut).toLocaleDateString('fr-FR')
    )},
    { key: 'dateFin', header: 'Date fin', render: (item) => (
      new Date(item.dateFin).toLocaleDateString('fr-FR')
    )},
    { key: 'estActive', header: 'Statut', render: (item) => (
      <div className="d-flex gap-1">
        {item.estActive && <Badge bg="success">Active</Badge>}
        {item.estCloturee && <Badge bg="secondary">Clôturée</Badge>}
        {!item.estActive && !item.estCloturee && <Badge bg="warning">En préparation</Badge>}
      </div>
    )},
    { key: 'actions', header: 'Actions', width: '180px', render: (item) => (
      <div className="d-flex gap-1">
        {!item.estActive && !item.estCloturee && (
          <Button size="sm" variant="outline-success" title="Activer">
            <i className="bi bi-check-circle"></i>
          </Button>
        )}
        <Button size="sm" variant="outline-primary" onClick={(e) => { e.stopPropagation(); handleEdit(item); }}>
          <i className="bi bi-pencil"></i>
        </Button>
        {!item.estCloturee && (
          <Button size="sm" variant="outline-danger" onClick={(e) => { e.stopPropagation(); handleDeleteClick(item); }}>
            <i className="bi bi-trash"></i>
          </Button>
        )}
      </div>
    )}
  ];

  const handleAdd = () => {
    setSelectedItem(null);
    const nextYear = new Date().getFullYear() + 1;
    setFormData({
      code: `${nextYear}-${nextYear + 1}`,
      libelle: `Année académique ${nextYear}-${nextYear + 1}`,
      dateDebut: `${nextYear}-10-01`,
      dateFin: `${nextYear + 1}-07-31`
    });
    setShowModal(true);
  };

  const handleEdit = (item: AnneeScolaire) => {
    setSelectedItem(item);
    setFormData({
      code: item.code,
      libelle: item.libelle,
      dateDebut: item.dateDebut,
      dateFin: item.dateFin
    });
    setShowModal(true);
  };

  const handleDeleteClick = (item: AnneeScolaire) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const handleSave = () => {
    console.log('Saving:', formData);
    setShowModal(false);
    loadData();
  };

  const handleDelete = () => {
    console.log('Deleting:', selectedItem?.id);
    setShowDeleteModal(false);
    loadData();
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Années scolaires"
        subtitle="Gestion des années académiques"
        breadcrumbs={[
          { label: 'Paramétrage', path: '/admin/parametrage' },
          { label: 'Années scolaires' }
        ]}
        actions={
          <Button variant="primary" onClick={handleAdd}>
            <i className="bi bi-plus-lg me-2"></i>
            Nouvelle année
          </Button>
        }
      />

      <DataCard
        title={`Années scolaires (${annees.length})`}
        actions={
          <Button variant="outline-secondary" size="sm" onClick={loadData}>
            <i className="bi bi-arrow-clockwise me-1"></i>
            Actualiser
          </Button>
        }
      >
        <DataTable
          columns={columns}
          data={annees}
          loading={loading}
          emptyMessage="Aucune année scolaire trouvée"
        />
      </DataCard>

      {/* Modal Ajout/Modification */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedItem ? 'Modifier l\'année scolaire' : 'Nouvelle année scolaire'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Code *</Form.Label>
                <Form.Control
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Ex: 2025-2026"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Libellé *</Form.Label>
                <Form.Control
                  value={formData.libelle}
                  onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Date de début *</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.dateDebut}
                  onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Date de fin *</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.dateFin}
                  onChange={(e) => setFormData({ ...formData, dateFin: e.target.value })}
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
        title="Supprimer l'année scolaire"
        message={`Êtes-vous sûr de vouloir supprimer l'année "${selectedItem?.libelle}" ?`}
        confirmLabel="Supprimer"
        variant="danger"
      />
    </div>
  );
};

export default AnneesScolairesPage;
