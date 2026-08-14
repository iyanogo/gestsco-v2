import React, { useState, useEffect } from 'react';
import { Row, Col, Button, Badge, Modal, Form } from 'react-bootstrap';
import { PageHeader } from '../../../components/layouts';
import { DataCard, DataTable, ConfirmModal, Column } from '../../../components/ui';

interface Template {
  id: number;
  code: string;
  libelle: string;
  type: 'bulletin' | 'attestation' | 'certificat' | 'releve' | 'facture' | 'recu';
  description: string;
  format: string;
  estSysteme: boolean;
  isActive: boolean;
  derniereModification: string;
}

const TemplatesListPage: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Template | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    libelle: '',
    type: 'bulletin',
    description: '',
    format: 'A4'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setTimeout(() => {
      setTemplates([
        { id: 1, code: 'BULLETIN_NOTES', libelle: 'Bulletin de notes', type: 'bulletin', description: 'Template standard pour les bulletins de notes', format: 'A4', estSysteme: true, isActive: true, derniereModification: '01/01/2026' },
        { id: 2, code: 'ATTESTATION_INSCRIPTION', libelle: 'Attestation d\'inscription', type: 'attestation', description: 'Attestation d\'inscription pour l\'année en cours', format: 'A4', estSysteme: true, isActive: true, derniereModification: '01/01/2026' },
        { id: 3, code: 'CERTIFICAT_SCOLARITE', libelle: 'Certificat de scolarité', type: 'certificat', description: 'Certificat de scolarité officiel', format: 'A4', estSysteme: true, isActive: true, derniereModification: '01/01/2026' },
        { id: 4, code: 'RELEVE_NOTES', libelle: 'Relevé de notes', type: 'releve', description: 'Relevé de notes semestriel ou annuel', format: 'A4', estSysteme: true, isActive: true, derniereModification: '01/01/2026' },
        { id: 5, code: 'FACTURE', libelle: 'Facture étudiant', type: 'facture', description: 'Facture pour les frais de scolarité', format: 'A4', estSysteme: true, isActive: true, derniereModification: '01/01/2026' },
        { id: 6, code: 'RECU_PAIEMENT', libelle: 'Reçu de paiement', type: 'recu', description: 'Reçu pour les paiements effectués', format: 'A5', estSysteme: true, isActive: true, derniereModification: '01/01/2026' },
        { id: 7, code: 'ATTESTATION_REUSSITE', libelle: 'Attestation de réussite', type: 'attestation', description: 'Attestation de réussite provisoire', format: 'A4', estSysteme: false, isActive: true, derniereModification: '05/01/2026' },
      ]);
      setLoading(false);
    }, 500);
  };

  const getTypeBadge = (type: string) => {
    const config: Record<string, { bg: string; label: string }> = {
      bulletin: { bg: 'primary', label: 'Bulletin' },
      attestation: { bg: 'success', label: 'Attestation' },
      certificat: { bg: 'info', label: 'Certificat' },
      releve: { bg: 'warning', label: 'Relevé' },
      facture: { bg: 'danger', label: 'Facture' },
      recu: { bg: 'secondary', label: 'Reçu' }
    };
    const c = config[type] || { bg: 'secondary', label: type };
    return <Badge bg={c.bg}>{c.label}</Badge>;
  };

  const columns: Column<Template>[] = [
    { key: 'code', header: 'Code', width: '180px', render: (item) => (
      <code className="text-primary">{item.code}</code>
    )},
    { key: 'libelle', header: 'Libellé', render: (item) => (
      <div>
        <div className="fw-medium">{item.libelle}</div>
        <small className="text-muted">{item.description}</small>
      </div>
    )},
    { key: 'type', header: 'Type', render: (item) => getTypeBadge(item.type) },
    { key: 'format', header: 'Format', render: (item) => (
      <Badge bg="light" text="dark">{item.format}</Badge>
    )},
    { key: 'estSysteme', header: 'Origine', render: (item) => (
      item.estSysteme ? (
        <Badge bg="secondary"><i className="bi bi-lock me-1"></i>Système</Badge>
      ) : (
        <Badge bg="info"><i className="bi bi-person me-1"></i>Personnalisé</Badge>
      )
    )},
    { key: 'isActive', header: 'Statut', render: (item) => (
      <Badge bg={item.isActive ? 'success' : 'secondary'}>
        {item.isActive ? 'Actif' : 'Inactif'}
      </Badge>
    )},
    { key: 'actions', header: 'Actions', width: '150px', render: (item) => (
      <div className="d-flex gap-1">
        <Button size="sm" variant="outline-info" title="Aperçu">
          <i className="bi bi-eye"></i>
        </Button>
        <Button size="sm" variant="outline-primary" onClick={(e) => { e.stopPropagation(); handleEdit(item); }} title="Modifier">
          <i className="bi bi-pencil"></i>
        </Button>
        {!item.estSysteme && (
          <Button size="sm" variant="outline-danger" onClick={(e) => { e.stopPropagation(); handleDeleteClick(item); }} title="Supprimer">
            <i className="bi bi-trash"></i>
          </Button>
        )}
      </div>
    )}
  ];

  const handleAdd = () => {
    setSelectedItem(null);
    setFormData({ code: '', libelle: '', type: 'bulletin', description: '', format: 'A4' });
    setShowModal(true);
  };

  const handleEdit = (item: Template) => {
    setSelectedItem(item);
    setFormData({
      code: item.code,
      libelle: item.libelle,
      type: item.type,
      description: item.description,
      format: item.format
    });
    setShowModal(true);
  };

  const handleDeleteClick = (item: Template) => {
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
        title="Templates de documents"
        subtitle="Gestion des modèles de documents"
        breadcrumbs={[
          { label: 'Documents', path: '/admin/documents' },
          { label: 'Templates' }
        ]}
        actions={
          <div className="d-flex gap-2">
            <Button variant="outline-primary" onClick={() => loadData()}>
              <i className="bi bi-arrow-clockwise me-2"></i>
              Réinitialiser
            </Button>
            <Button variant="primary" onClick={handleAdd}>
              <i className="bi bi-plus-lg me-2"></i>
              Nouveau template
            </Button>
          </div>
        }
      />

      <DataCard title={`Templates (${templates.length})`}>
        <DataTable
          columns={columns}
          data={templates}
          loading={loading}
          emptyMessage="Aucun template trouvé"
        />
      </DataCard>

      {/* Modal Ajout/Modification */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedItem ? 'Modifier le template' : 'Nouveau template'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Code *</Form.Label>
                <Form.Control
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s/g, '_') })}
                  placeholder="CODE_TEMPLATE"
                  disabled={selectedItem?.estSysteme}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Type *</Form.Label>
                <Form.Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  disabled={selectedItem?.estSysteme}
                >
                  <option value="bulletin">Bulletin</option>
                  <option value="attestation">Attestation</option>
                  <option value="certificat">Certificat</option>
                  <option value="releve">Relevé</option>
                  <option value="facture">Facture</option>
                  <option value="recu">Reçu</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={8}>
              <Form.Group>
                <Form.Label>Libellé *</Form.Label>
                <Form.Control
                  value={formData.libelle}
                  onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                  placeholder="Nom du template"
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Format</Form.Label>
                <Form.Select
                  value={formData.format}
                  onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                >
                  <option value="A4">A4</option>
                  <option value="A5">A5</option>
                  <option value="Letter">Letter</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group>
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description du template..."
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
        title="Supprimer le template"
        message={`Êtes-vous sûr de vouloir supprimer le template "${selectedItem?.libelle}" ?`}
        confirmLabel="Supprimer"
        variant="danger"
      />
    </div>
  );
};

export default TemplatesListPage;
