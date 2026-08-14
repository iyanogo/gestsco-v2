import React, { useState, useEffect } from 'react';
import { Row, Col, Button, Badge, Modal, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../../components/layouts';
import { DataCard, DataTable, SearchFilter, ConfirmModal, Avatar, Column } from '../../../components/ui';

interface Enseignant {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  specialite: string;
  grade: string;
  departement: string;
  heuresHebdo: number;
  isActive: boolean;
}

const EnseignantsListPage: React.FC = () => {
  const [enseignants, setEnseignants] = useState<Enseignant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Enseignant | null>(null);
  const [formData, setFormData] = useState({
    matricule: '',
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    specialite: '',
    grade: '',
    departement_id: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setTimeout(() => {
      setEnseignants([
        { id: 1, matricule: 'ENS-001', nom: 'BOUDA', prenom: 'Jean François', email: 'bouda.jf@esco-iges.com', telephone: '+226 70 11 22 33', specialite: 'Informatique', grade: 'Docteur', departement: 'Sciences et Technologies', heuresHebdo: 18, isActive: true },
        { id: 2, matricule: 'ENS-002', nom: 'TRAORE', prenom: 'Amadou', email: 'traore.a@esco-iges.com', telephone: '+226 70 22 33 44', specialite: 'Base de données', grade: 'Ingénieur', departement: 'Sciences et Technologies', heuresHebdo: 16, isActive: true },
        { id: 3, matricule: 'ENS-003', nom: 'OUEDRAOGO', prenom: 'Marie', email: 'ouedraogo.m@esco-iges.com', telephone: '+226 70 33 44 55', specialite: 'Réseaux', grade: 'Docteur', departement: 'Sciences et Technologies', heuresHebdo: 14, isActive: true },
        { id: 4, matricule: 'ENS-004', nom: 'SANOGO', prenom: 'Ibrahim', email: 'sanogo.i@esco-iges.com', telephone: '+226 70 44 55 66', specialite: 'Gestion', grade: 'Master', departement: 'Sciences Économiques', heuresHebdo: 20, isActive: true },
        { id: 5, matricule: 'ENS-005', nom: 'DIALLO', prenom: 'Fatou', email: 'diallo.f@esco-iges.com', telephone: '+226 70 55 66 77', specialite: 'Droit', grade: 'Docteur', departement: 'Droit', heuresHebdo: 12, isActive: false },
        { id: 6, matricule: 'ENS-006', nom: 'KONE', prenom: 'Seydou', email: 'kone.s@esco-iges.com', telephone: '+226 70 66 77 88', specialite: 'Programmation Web', grade: 'Ingénieur', departement: 'Sciences et Technologies', heuresHebdo: 18, isActive: true },
        { id: 7, matricule: 'ENS-007', nom: 'BARRY', prenom: 'Aminata', email: 'barry.a@esco-iges.com', telephone: '+226 70 77 88 99', specialite: 'Anglais', grade: 'Master', departement: 'Langues', heuresHebdo: 16, isActive: true },
      ]);
      setLoading(false);
    }, 500);
  };

  const getGradeBadge = (grade: string) => {
    switch (grade) {
      case 'Docteur':
        return <Badge bg="danger">Dr.</Badge>;
      case 'Ingénieur':
        return <Badge bg="primary">Ing.</Badge>;
      case 'Master':
        return <Badge bg="info">M.</Badge>;
      default:
        return <Badge bg="secondary">{grade}</Badge>;
    }
  };

  const columns: Column<Enseignant>[] = [
    { key: 'matricule', header: 'Matricule', width: '100px', render: (item) => (
      <code className="text-primary">{item.matricule}</code>
    )},
    { key: 'nom', header: 'Enseignant', render: (item) => (
      <div className="d-flex align-items-center gap-2">
        <Avatar name={`${item.prenom} ${item.nom}`} size="sm" />
        <div>
          <div className="fw-medium">{item.prenom} {item.nom}</div>
          <small className="text-muted">{item.email}</small>
        </div>
      </div>
    )},
    { key: 'grade', header: 'Grade', render: (item) => getGradeBadge(item.grade) },
    { key: 'specialite', header: 'Spécialité' },
    { key: 'departement', header: 'Département' },
    { key: 'heuresHebdo', header: 'Heures/sem', render: (item) => (
      <span>{item.heuresHebdo}h</span>
    )},
    { key: 'isActive', header: 'Statut', render: (item) => (
      <Badge bg={item.isActive ? 'success' : 'secondary'}>
        {item.isActive ? 'Actif' : 'Inactif'}
      </Badge>
    )},
    { key: 'actions', header: 'Actions', width: '150px', render: (item) => (
      <div className="d-flex gap-1">
        <Link to={`/admin/enseignants/${item.id}`} className="btn btn-sm btn-outline-info">
          <i className="bi bi-eye"></i>
        </Link>
        <Button size="sm" variant="outline-primary" onClick={(e) => { e.stopPropagation(); handleEdit(item); }}>
          <i className="bi bi-pencil"></i>
        </Button>
        <Button size="sm" variant="outline-danger" onClick={(e) => { e.stopPropagation(); handleDeleteClick(item); }}>
          <i className="bi bi-trash"></i>
        </Button>
      </div>
    )}
  ];

  const filteredData = enseignants.filter(item => {
    const matchSearch = 
      item.nom.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.prenom.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.matricule.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.specialite.toLowerCase().includes(searchValue.toLowerCase());
    const matchDepartement = !filterValues.departement || item.departement === filterValues.departement;
    const matchGrade = !filterValues.grade || item.grade === filterValues.grade;
    return matchSearch && matchDepartement && matchGrade;
  });

  const handleAdd = () => {
    setSelectedItem(null);
    setFormData({ matricule: '', nom: '', prenom: '', email: '', telephone: '', specialite: '', grade: '', departement_id: '' });
    setShowModal(true);
  };

  const handleEdit = (item: Enseignant) => {
    setSelectedItem(item);
    setFormData({
      matricule: item.matricule,
      nom: item.nom,
      prenom: item.prenom,
      email: item.email,
      telephone: item.telephone,
      specialite: item.specialite,
      grade: item.grade,
      departement_id: ''
    });
    setShowModal(true);
  };

  const handleDeleteClick = (item: Enseignant) => {
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

  // Statistiques
  const totalHeures = enseignants.filter(e => e.isActive).reduce((sum, e) => sum + e.heuresHebdo, 0);

  return (
    <div className="fade-in">
      <PageHeader
        title="Enseignants"
        subtitle="Gestion du corps enseignant"
        breadcrumbs={[
          { label: 'Enseignants', path: '/admin/enseignants' },
          { label: 'Liste' }
        ]}
        actions={
          <div className="d-flex gap-2">
            <Button variant="outline-primary">
              <i className="bi bi-download me-2"></i>
              Exporter
            </Button>
            <Button variant="primary" onClick={handleAdd}>
              <i className="bi bi-plus-lg me-2"></i>
              Nouvel enseignant
            </Button>
          </div>
        }
      />

      {/* Statistiques */}
      <Row className="g-3 mb-4">
        <Col sm={6} md={3}>
          <div className="bg-white rounded p-3 border d-flex align-items-center gap-3">
            <div className="bg-primary bg-opacity-10 rounded p-2">
              <i className="bi bi-person-workspace fs-4 text-primary"></i>
            </div>
            <div>
              <div className="fs-4 fw-bold">{enseignants.length}</div>
              <small className="text-muted">Total enseignants</small>
            </div>
          </div>
        </Col>
        <Col sm={6} md={3}>
          <div className="bg-white rounded p-3 border d-flex align-items-center gap-3">
            <div className="bg-success bg-opacity-10 rounded p-2">
              <i className="bi bi-check-circle fs-4 text-success"></i>
            </div>
            <div>
              <div className="fs-4 fw-bold">{enseignants.filter(e => e.isActive).length}</div>
              <small className="text-muted">Actifs</small>
            </div>
          </div>
        </Col>
        <Col sm={6} md={3}>
          <div className="bg-white rounded p-3 border d-flex align-items-center gap-3">
            <div className="bg-danger bg-opacity-10 rounded p-2">
              <i className="bi bi-mortarboard fs-4 text-danger"></i>
            </div>
            <div>
              <div className="fs-4 fw-bold">{enseignants.filter(e => e.grade === 'Docteur').length}</div>
              <small className="text-muted">Docteurs</small>
            </div>
          </div>
        </Col>
        <Col sm={6} md={3}>
          <div className="bg-white rounded p-3 border d-flex align-items-center gap-3">
            <div className="bg-info bg-opacity-10 rounded p-2">
              <i className="bi bi-clock fs-4 text-info"></i>
            </div>
            <div>
              <div className="fs-4 fw-bold">{totalHeures}h</div>
              <small className="text-muted">Heures/semaine</small>
            </div>
          </div>
        </Col>
      </Row>

      <DataCard
        title={`Liste des enseignants (${filteredData.length})`}
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
          searchPlaceholder="Rechercher par nom, matricule, spécialité..."
          filters={[
            {
              key: 'departement',
              label: 'Tous les départements',
              type: 'select',
              options: [
                { value: 'Sciences et Technologies', label: 'Sciences et Technologies' },
                { value: 'Sciences Économiques', label: 'Sciences Économiques' },
                { value: 'Droit', label: 'Droit' },
                { value: 'Langues', label: 'Langues' }
              ]
            },
            {
              key: 'grade',
              label: 'Tous les grades',
              type: 'select',
              options: [
                { value: 'Docteur', label: 'Docteur' },
                { value: 'Ingénieur', label: 'Ingénieur' },
                { value: 'Master', label: 'Master' }
              ]
            }
          ]}
          filterValues={filterValues}
          onFilterChange={(key, value) => setFilterValues({ ...filterValues, [key]: value })}
          onReset={() => { setSearchValue(''); setFilterValues({}); }}
        />

        <DataTable
          columns={columns}
          data={filteredData}
          loading={loading}
          emptyMessage="Aucun enseignant trouvé"
        />
      </DataCard>

      {/* Modal Ajout/Modification */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedItem ? 'Modifier l\'enseignant' : 'Nouvel enseignant'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Matricule *</Form.Label>
                <Form.Control
                  value={formData.matricule}
                  onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
                  placeholder="ENS-XXX"
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Prénom *</Form.Label>
                <Form.Control
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Nom *</Form.Label>
                <Form.Control
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Email *</Form.Label>
                <Form.Control
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Téléphone</Form.Label>
                <Form.Control
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Grade *</Form.Label>
                <Form.Select
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                >
                  <option value="">Sélectionner</option>
                  <option value="Docteur">Docteur</option>
                  <option value="Ingénieur">Ingénieur</option>
                  <option value="Master">Master</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Spécialité *</Form.Label>
                <Form.Control
                  value={formData.specialite}
                  onChange={(e) => setFormData({ ...formData, specialite: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Département *</Form.Label>
                <Form.Select
                  value={formData.departement_id}
                  onChange={(e) => setFormData({ ...formData, departement_id: e.target.value })}
                >
                  <option value="">Sélectionner</option>
                  <option value="1">Sciences et Technologies</option>
                  <option value="2">Sciences Économiques</option>
                  <option value="3">Droit</option>
                  <option value="4">Langues</option>
                </Form.Select>
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
        title="Supprimer l'enseignant"
        message={`Êtes-vous sûr de vouloir supprimer l'enseignant "${selectedItem?.prenom} ${selectedItem?.nom}" ?`}
        confirmLabel="Supprimer"
        variant="danger"
      />
    </div>
  );
};

export default EnseignantsListPage;
