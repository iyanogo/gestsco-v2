import React, { useState } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Modal, Badge } from 'react-bootstrap';

interface Departement {
  id: number;
  code: string;
  nom: string;
  etablissement: string;
  responsable: string;
  email: string;
  telephone: string;
  nombreFilieres: number;
  nombreEnseignants: number;
  statut: 'actif' | 'inactif';
}

const mockDepartements: Departement[] = [
  {
    id: 1,
    code: 'INFO',
    nom: 'Département Informatique',
    etablissement: 'Faculté des Sciences',
    responsable: 'Dr. Amadou Diallo',
    email: 'info@ucad.edu.sn',
    telephone: '+221 33 825 10 01',
    nombreFilieres: 4,
    nombreEnseignants: 25,
    statut: 'actif'
  },
  {
    id: 2,
    code: 'MATH',
    nom: 'Département Mathématiques',
    etablissement: 'Faculté des Sciences',
    responsable: 'Pr. Fatou Sow',
    email: 'math@ucad.edu.sn',
    telephone: '+221 33 825 10 02',
    nombreFilieres: 3,
    nombreEnseignants: 18,
    statut: 'actif'
  },
  {
    id: 3,
    code: 'PHY',
    nom: 'Département Physique',
    etablissement: 'Faculté des Sciences',
    responsable: 'Dr. Moussa Ndiaye',
    email: 'physique@ucad.edu.sn',
    telephone: '+221 33 825 10 03',
    nombreFilieres: 2,
    nombreEnseignants: 15,
    statut: 'actif'
  },
  {
    id: 4,
    code: 'GES',
    nom: 'Département Gestion',
    etablissement: 'Faculté des Sciences Économiques',
    responsable: 'Dr. Ibrahima Fall',
    email: 'gestion@ucad.edu.sn',
    telephone: '+221 33 825 20 01',
    nombreFilieres: 5,
    nombreEnseignants: 22,
    statut: 'actif'
  },
  {
    id: 5,
    code: 'ECO',
    nom: 'Département Économie',
    etablissement: 'Faculté des Sciences Économiques',
    responsable: 'Pr. Aïssatou Ba',
    email: 'economie@ucad.edu.sn',
    telephone: '+221 33 825 20 02',
    nombreFilieres: 3,
    nombreEnseignants: 20,
    statut: 'actif'
  }
];

const DepartementsListPage: React.FC = () => {
  const [departements, setDepartements] = useState<Departement[]>(mockDepartements);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDepartement, setEditingDepartement] = useState<Departement | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    nom: '',
    etablissement: '',
    responsable: '',
    email: '',
    telephone: '',
    statut: 'actif' as 'actif' | 'inactif'
  });

  const filteredDepartements = departements.filter(d =>
    d.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.etablissement.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleShowModal = (departement?: Departement) => {
    if (departement) {
      setEditingDepartement(departement);
      setFormData({
        code: departement.code,
        nom: departement.nom,
        etablissement: departement.etablissement,
        responsable: departement.responsable,
        email: departement.email,
        telephone: departement.telephone,
        statut: departement.statut
      });
    } else {
      setEditingDepartement(null);
      setFormData({
        code: '',
        nom: '',
        etablissement: '',
        responsable: '',
        email: '',
        telephone: '',
        statut: 'actif'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDepartement(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDepartement) {
      setDepartements(departements.map(d =>
        d.id === editingDepartement.id
          ? { ...d, ...formData }
          : d
      ));
    } else {
      const newDepartement: Departement = {
        id: Math.max(...departements.map(d => d.id)) + 1,
        ...formData,
        nombreFilieres: 0,
        nombreEnseignants: 0
      };
      setDepartements([...departements, newDepartement]);
    }
    handleCloseModal();
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce département ?')) {
      setDepartements(departements.filter(d => d.id !== id));
    }
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1 fw-bold">Départements</h2>
              <p className="text-muted mb-0">Gestion des départements académiques</p>
            </div>
            <Button variant="primary" onClick={() => handleShowModal()}>
              <i className="bi bi-plus-lg me-2"></i>
              Nouveau département
            </Button>
          </div>
        </Col>
      </Row>

      {/* Statistiques */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-primary text-white">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3">
                <i className="bi bi-diagram-3 fs-4"></i>
              </div>
              <div>
                <h3 className="mb-0 fw-bold">{departements.length}</h3>
                <small>Départements</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-success text-white">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3">
                <i className="bi bi-signpost-split fs-4"></i>
              </div>
              <div>
                <h3 className="mb-0 fw-bold">{departements.reduce((acc, d) => acc + d.nombreFilieres, 0)}</h3>
                <small>Filières</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-info text-white">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3">
                <i className="bi bi-person-workspace fs-4"></i>
              </div>
              <div>
                <h3 className="mb-0 fw-bold">{departements.reduce((acc, d) => acc + d.nombreEnseignants, 0)}</h3>
                <small>Enseignants</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-warning text-dark">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3">
                <i className="bi bi-check-circle fs-4"></i>
              </div>
              <div>
                <h3 className="mb-0 fw-bold">{departements.filter(d => d.statut === 'actif').length}</h3>
                <small>Actifs</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white py-3">
          <Row className="align-items-center">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text className="bg-light border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Rechercher un département..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-start-0"
                />
              </InputGroup>
            </Col>
            <Col md={6} className="text-end">
              <Button variant="outline-secondary" size="sm" className="me-2">
                <i className="bi bi-funnel me-1"></i>
                Filtrer
              </Button>
              <Button variant="outline-success" size="sm">
                <i className="bi bi-download me-1"></i>
                Exporter
              </Button>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="bg-light">
              <tr>
                <th className="border-0 px-4 py-3">Code</th>
                <th className="border-0 py-3">Département</th>
                <th className="border-0 py-3">Établissement</th>
                <th className="border-0 py-3">Responsable</th>
                <th className="border-0 py-3 text-center">Filières</th>
                <th className="border-0 py-3 text-center">Enseignants</th>
                <th className="border-0 py-3 text-center">Statut</th>
                <th className="border-0 py-3 text-end px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDepartements.map((departement) => (
                <tr key={departement.id}>
                  <td className="px-4 py-3">
                    <span className="fw-semibold text-primary">{departement.code}</span>
                  </td>
                  <td className="py-3">
                    <div className="fw-semibold">{departement.nom}</div>
                    <small className="text-muted">{departement.email}</small>
                  </td>
                  <td className="py-3">{departement.etablissement}</td>
                  <td className="py-3">
                    <div>{departement.responsable}</div>
                    <small className="text-muted">{departement.telephone}</small>
                  </td>
                  <td className="py-3 text-center">
                    <Badge bg="info" className="px-3 py-2">{departement.nombreFilieres}</Badge>
                  </td>
                  <td className="py-3 text-center">
                    <Badge bg="secondary" className="px-3 py-2">{departement.nombreEnseignants}</Badge>
                  </td>
                  <td className="py-3 text-center">
                    <Badge bg={departement.statut === 'actif' ? 'success' : 'secondary'}>
                      {departement.statut === 'actif' ? 'Actif' : 'Inactif'}
                    </Badge>
                  </td>
                  <td className="py-3 text-end px-4">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                      onClick={() => handleShowModal(departement)}
                    >
                      <i className="bi bi-pencil"></i>
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDelete(departement.id)}
                    >
                      <i className="bi bi-trash"></i>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Modal Ajout/Modification */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingDepartement ? 'Modifier le département' : 'Nouveau département'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Code</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Nom du département</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Établissement</Form.Label>
              <Form.Select
                value={formData.etablissement}
                onChange={(e) => setFormData({ ...formData, etablissement: e.target.value })}
                required
              >
                <option value="">Sélectionner un établissement</option>
                <option value="Faculté des Sciences">Faculté des Sciences</option>
                <option value="Faculté des Sciences Économiques">Faculté des Sciences Économiques</option>
                <option value="Faculté de Médecine">Faculté de Médecine</option>
                <option value="École Polytechnique">École Polytechnique</option>
                <option value="Institut Universitaire de Technologie">Institut Universitaire de Technologie</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Responsable</Form.Label>
              <Form.Control
                type="text"
                value={formData.responsable}
                onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                required
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Téléphone</Form.Label>
                  <Form.Control
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Statut</Form.Label>
              <Form.Select
                value={formData.statut}
                onChange={(e) => setFormData({ ...formData, statut: e.target.value as 'actif' | 'inactif' })}
              >
                <option value="actif">Actif</option>
                <option value="inactif">Inactif</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Annuler
            </Button>
            <Button variant="primary" type="submit">
              {editingDepartement ? 'Modifier' : 'Créer'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default DepartementsListPage;
