import React, { useState, useEffect } from 'react';
import { Row, Col, Button, Badge, Modal, Form } from 'react-bootstrap';
import { PageHeader } from '../../../components/layouts';
import { DataCard, DataTable, SearchFilter, ConfirmModal, Column } from '../../../components/ui';

interface Etablissement {
  id: number;
  code: string;
  nom: string;
  sigle: string;
  ville: string;
  telephone: string;
  email: string;
  nom_directeur: string;
  is_active: boolean;
}

const EtablissementsListPage: React.FC = () => {
  const [etablissements, setEtablissements] = useState<Etablissement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Etablissement | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    nom: '',
    sigle: '',
    ville: '',
    telephone: '',
    email: '',
    nom_directeur: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    // Simulation de données - à remplacer par appel API
    setTimeout(() => {
      setEtablissements([
        { id: 1, code: 'ESCO-IGES-J', nom: 'ESCO-IGES JOUR', sigle: 'ESCO-J', ville: 'Ouagadougou', telephone: '+226 25 34 39 15', email: 'contact@esco-iges.com', nom_directeur: 'Dr. Jean François BOUDA', is_active: true },
        { id: 2, code: 'ESCO-IGES-S', nom: 'ESCO-IGES SOIR', sigle: 'ESCO-S', ville: 'Ouagadougou', telephone: '+226 25 34 39 15', email: 'soir@esco-iges.com', nom_directeur: 'Dr. Jean François BOUDA', is_active: true },
        { id: 3, code: 'IST', nom: 'Institut Supérieur de Technologie', sigle: 'IST', ville: 'Bobo-Dioulasso', telephone: '+226 20 97 00 00', email: 'contact@ist.bf', nom_directeur: 'Pr. Amadou TRAORE', is_active: true },
      ]);
      setLoading(false);
    }, 500);
  };

  const columns: Column<Etablissement>[] = [
    { key: 'code', header: 'Code', width: '120px' },
    { key: 'nom', header: 'Nom', render: (item) => (
      <div>
        <div className="fw-medium">{item.nom}</div>
        <small className="text-muted">{item.sigle}</small>
      </div>
    )},
    { key: 'ville', header: 'Ville' },
    { key: 'telephone', header: 'Téléphone' },
    { key: 'nom_directeur', header: 'Directeur' },
    { key: 'is_active', header: 'Statut', render: (item) => (
      <Badge bg={item.is_active ? 'success' : 'secondary'}>
        {item.is_active ? 'Actif' : 'Inactif'}
      </Badge>
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

  const filteredData = etablissements.filter(item =>
    item.nom.toLowerCase().includes(searchValue.toLowerCase()) ||
    item.code.toLowerCase().includes(searchValue.toLowerCase()) ||
    item.ville.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleAdd = () => {
    setSelectedItem(null);
    setFormData({ code: '', nom: '', sigle: '', ville: '', telephone: '', email: '', nom_directeur: '' });
    setShowModal(true);
  };

  const handleEdit = (item: Etablissement) => {
    setSelectedItem(item);
    setFormData({
      code: item.code,
      nom: item.nom,
      sigle: item.sigle,
      ville: item.ville,
      telephone: item.telephone,
      email: item.email,
      nom_directeur: item.nom_directeur
    });
    setShowModal(true);
  };

  const handleDeleteClick = (item: Etablissement) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const handleSave = () => {
    // TODO: Appel API pour sauvegarder
    console.log('Saving:', formData);
    setShowModal(false);
    loadData();
  };

  const handleDelete = () => {
    // TODO: Appel API pour supprimer
    console.log('Deleting:', selectedItem?.id);
    setShowDeleteModal(false);
    loadData();
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Établissements"
        subtitle="Gestion des établissements d'enseignement"
        breadcrumbs={[
          { label: 'Référentiel', path: '/admin/referentiel' },
          { label: 'Établissements' }
        ]}
        actions={
          <Button variant="primary" onClick={handleAdd}>
            <i className="bi bi-plus-lg me-2"></i>
            Nouvel établissement
          </Button>
        }
      />

      <DataCard
        title={`Liste des établissements (${filteredData.length})`}
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
          searchPlaceholder="Rechercher un établissement..."
        />

        <DataTable
          columns={columns}
          data={filteredData}
          loading={loading}
          emptyMessage="Aucun établissement trouvé"
        />
      </DataCard>

      {/* Modal Ajout/Modification */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedItem ? 'Modifier l\'établissement' : 'Nouvel établissement'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Code *</Form.Label>
                <Form.Control
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Ex: ESCO-IGES"
                />
              </Form.Group>
            </Col>
            <Col md={8}>
              <Form.Group>
                <Form.Label>Nom complet *</Form.Label>
                <Form.Control
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="Nom de l'établissement"
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Sigle</Form.Label>
                <Form.Control
                  value={formData.sigle}
                  onChange={(e) => setFormData({ ...formData, sigle: e.target.value })}
                  placeholder="Sigle"
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Ville</Form.Label>
                <Form.Control
                  value={formData.ville}
                  onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                  placeholder="Ville"
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Téléphone</Form.Label>
                <Form.Control
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  placeholder="+226 XX XX XX XX"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@etablissement.com"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Nom du directeur</Form.Label>
                <Form.Control
                  value={formData.nom_directeur}
                  onChange={(e) => setFormData({ ...formData, nom_directeur: e.target.value })}
                  placeholder="Nom du directeur"
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

      {/* Modal Confirmation Suppression */}
      <ConfirmModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Supprimer l'établissement"
        message={`Êtes-vous sûr de vouloir supprimer l'établissement "${selectedItem?.nom}" ?`}
        confirmLabel="Supprimer"
        variant="danger"
      />
    </div>
  );
};

export default EtablissementsListPage;
