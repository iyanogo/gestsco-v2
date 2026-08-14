import React, { useState, useEffect } from 'react';
import { Row, Col, Button, Badge, Modal, Form } from 'react-bootstrap';
import { PageHeader } from '../../../components/layouts';
import { DataCard, DataTable, SearchFilter, ConfirmModal, Avatar, Column } from '../../../components/ui';

interface Utilisateur {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: 'admin' | 'enseignant' | 'etudiant' | 'comptable';
  dateCreation: string;
  derniereConnexion: string;
  isActive: boolean;
}

const UtilisateursListPage: React.FC = () => {
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Utilisateur | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    nom: '',
    prenom: '',
    role: 'enseignant',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setTimeout(() => {
      setUtilisateurs([
        { id: 1, email: 'admin@gestsco.com', nom: 'ADMIN', prenom: 'Super', role: 'admin', dateCreation: '2024-01-15', derniereConnexion: '2026-01-07 14:30', isActive: true },
        { id: 2, email: 'bouda.jf@gestsco.com', nom: 'BOUDA', prenom: 'Jean François', role: 'admin', dateCreation: '2024-02-01', derniereConnexion: '2026-01-07 10:15', isActive: true },
        { id: 3, email: 'traore.a@gestsco.com', nom: 'TRAORE', prenom: 'Amadou', role: 'enseignant', dateCreation: '2024-03-10', derniereConnexion: '2026-01-06 16:45', isActive: true },
        { id: 4, email: 'ouedraogo.m@gestsco.com', nom: 'OUEDRAOGO', prenom: 'Marie', role: 'enseignant', dateCreation: '2024-03-15', derniereConnexion: '2026-01-05 09:00', isActive: true },
        { id: 5, email: 'sanogo.i@gestsco.com', nom: 'SANOGO', prenom: 'Ibrahim', role: 'comptable', dateCreation: '2024-04-01', derniereConnexion: '2026-01-07 11:30', isActive: true },
        { id: 6, email: 'diallo.f@gestsco.com', nom: 'DIALLO', prenom: 'Fatou', role: 'enseignant', dateCreation: '2024-05-20', derniereConnexion: '2026-01-04 14:00', isActive: false },
        { id: 7, email: 'kone.s@gestsco.com', nom: 'KONE', prenom: 'Seydou', role: 'enseignant', dateCreation: '2024-06-01', derniereConnexion: '2026-01-03 08:30', isActive: true },
      ]);
      setLoading(false);
    }, 500);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge bg="danger">Administrateur</Badge>;
      case 'enseignant':
        return <Badge bg="success">Enseignant</Badge>;
      case 'etudiant':
        return <Badge bg="info">Étudiant</Badge>;
      case 'comptable':
        return <Badge bg="warning">Comptable</Badge>;
      default:
        return <Badge bg="secondary">{role}</Badge>;
    }
  };

  const columns: Column<Utilisateur>[] = [
    { key: 'nom', header: 'Utilisateur', render: (item) => (
      <div className="d-flex align-items-center gap-2">
        <Avatar name={`${item.prenom} ${item.nom}`} size="sm" />
        <div>
          <div className="fw-medium">{item.prenom} {item.nom}</div>
          <small className="text-muted">{item.email}</small>
        </div>
      </div>
    )},
    { key: 'role', header: 'Rôle', render: (item) => getRoleBadge(item.role) },
    { key: 'dateCreation', header: 'Créé le', render: (item) => (
      new Date(item.dateCreation).toLocaleDateString('fr-FR')
    )},
    { key: 'derniereConnexion', header: 'Dernière connexion', render: (item) => (
      <small className="text-muted">{item.derniereConnexion}</small>
    )},
    { key: 'isActive', header: 'Statut', render: (item) => (
      <Badge bg={item.isActive ? 'success' : 'secondary'}>
        {item.isActive ? 'Actif' : 'Inactif'}
      </Badge>
    )},
    { key: 'actions', header: 'Actions', width: '150px', render: (item) => (
      <div className="d-flex gap-1">
        <Button size="sm" variant="outline-primary" onClick={(e) => { e.stopPropagation(); handleEdit(item); }}>
          <i className="bi bi-pencil"></i>
        </Button>
        <Button size="sm" variant="outline-warning" title="Réinitialiser mot de passe">
          <i className="bi bi-key"></i>
        </Button>
        <Button size="sm" variant="outline-danger" onClick={(e) => { e.stopPropagation(); handleDeleteClick(item); }}>
          <i className="bi bi-trash"></i>
        </Button>
      </div>
    )}
  ];

  const filteredData = utilisateurs.filter(item => {
    const matchSearch = 
      item.nom.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.prenom.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.email.toLowerCase().includes(searchValue.toLowerCase());
    const matchRole = !filterValues.role || item.role === filterValues.role;
    const matchStatut = !filterValues.statut || 
      (filterValues.statut === 'actif' && item.isActive) ||
      (filterValues.statut === 'inactif' && !item.isActive);
    return matchSearch && matchRole && matchStatut;
  });

  const handleAdd = () => {
    setSelectedItem(null);
    setFormData({ email: '', nom: '', prenom: '', role: 'enseignant', password: '', confirmPassword: '' });
    setShowModal(true);
  };

  const handleEdit = (item: Utilisateur) => {
    setSelectedItem(item);
    setFormData({
      email: item.email,
      nom: item.nom,
      prenom: item.prenom,
      role: item.role,
      password: '',
      confirmPassword: ''
    });
    setShowModal(true);
  };

  const handleDeleteClick = (item: Utilisateur) => {
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
  const stats = {
    total: utilisateurs.length,
    admins: utilisateurs.filter(u => u.role === 'admin').length,
    enseignants: utilisateurs.filter(u => u.role === 'enseignant').length,
    actifs: utilisateurs.filter(u => u.isActive).length
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Utilisateurs"
        subtitle="Gestion des comptes utilisateurs"
        breadcrumbs={[
          { label: 'Paramétrage', path: '/admin/parametrage' },
          { label: 'Utilisateurs' }
        ]}
        actions={
          <Button variant="primary" onClick={handleAdd}>
            <i className="bi bi-plus-lg me-2"></i>
            Nouvel utilisateur
          </Button>
        }
      />

      {/* Statistiques */}
      <Row className="g-3 mb-4">
        <Col sm={6} md={3}>
          <div className="bg-white rounded p-3 border d-flex align-items-center gap-3">
            <div className="bg-primary bg-opacity-10 rounded p-2">
              <i className="bi bi-people fs-4 text-primary"></i>
            </div>
            <div>
              <div className="fs-4 fw-bold">{stats.total}</div>
              <small className="text-muted">Total utilisateurs</small>
            </div>
          </div>
        </Col>
        <Col sm={6} md={3}>
          <div className="bg-white rounded p-3 border d-flex align-items-center gap-3">
            <div className="bg-danger bg-opacity-10 rounded p-2">
              <i className="bi bi-shield-check fs-4 text-danger"></i>
            </div>
            <div>
              <div className="fs-4 fw-bold">{stats.admins}</div>
              <small className="text-muted">Administrateurs</small>
            </div>
          </div>
        </Col>
        <Col sm={6} md={3}>
          <div className="bg-white rounded p-3 border d-flex align-items-center gap-3">
            <div className="bg-success bg-opacity-10 rounded p-2">
              <i className="bi bi-person-workspace fs-4 text-success"></i>
            </div>
            <div>
              <div className="fs-4 fw-bold">{stats.enseignants}</div>
              <small className="text-muted">Enseignants</small>
            </div>
          </div>
        </Col>
        <Col sm={6} md={3}>
          <div className="bg-white rounded p-3 border d-flex align-items-center gap-3">
            <div className="bg-info bg-opacity-10 rounded p-2">
              <i className="bi bi-check-circle fs-4 text-info"></i>
            </div>
            <div>
              <div className="fs-4 fw-bold">{stats.actifs}</div>
              <small className="text-muted">Actifs</small>
            </div>
          </div>
        </Col>
      </Row>

      <DataCard
        title={`Liste des utilisateurs (${filteredData.length})`}
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
          searchPlaceholder="Rechercher par nom, email..."
          filters={[
            {
              key: 'role',
              label: 'Tous les rôles',
              type: 'select',
              options: [
                { value: 'admin', label: 'Administrateur' },
                { value: 'enseignant', label: 'Enseignant' },
                { value: 'comptable', label: 'Comptable' },
                { value: 'etudiant', label: 'Étudiant' }
              ]
            },
            {
              key: 'statut',
              label: 'Tous les statuts',
              type: 'select',
              options: [
                { value: 'actif', label: 'Actif' },
                { value: 'inactif', label: 'Inactif' }
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
          emptyMessage="Aucun utilisateur trouvé"
        />
      </DataCard>

      {/* Modal Ajout/Modification */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedItem ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Prénom *</Form.Label>
                <Form.Control
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  placeholder="Prénom"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Nom *</Form.Label>
                <Form.Control
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="Nom"
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
                  placeholder="email@exemple.com"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Rôle *</Form.Label>
                <Form.Select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="admin">Administrateur</option>
                  <option value="enseignant">Enseignant</option>
                  <option value="comptable">Comptable</option>
                  <option value="etudiant">Étudiant</option>
                </Form.Select>
              </Form.Group>
            </Col>
            {!selectedItem && (
              <>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Mot de passe *</Form.Label>
                    <Form.Control
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Confirmer le mot de passe *</Form.Label>
                    <Form.Control
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                    />
                  </Form.Group>
                </Col>
              </>
            )}
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
        title="Supprimer l'utilisateur"
        message={`Êtes-vous sûr de vouloir supprimer l'utilisateur "${selectedItem?.prenom} ${selectedItem?.nom}" ?`}
        confirmLabel="Supprimer"
        variant="danger"
      />
    </div>
  );
};

export default UtilisateursListPage;
