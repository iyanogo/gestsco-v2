import React, { useState } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Modal, Badge } from 'react-bootstrap';

interface Cycle {
  id: number;
  code: string;
  nom: string;
  duree: number;
  description: string;
  nombreNiveaux: number;
  nombreEtudiants: number;
  statut: 'actif' | 'inactif';
}

const mockCycles: Cycle[] = [
  {
    id: 1,
    code: 'LIC',
    nom: 'Licence',
    duree: 3,
    description: 'Cycle de formation de 3 ans après le baccalauréat',
    nombreNiveaux: 3,
    nombreEtudiants: 850,
    statut: 'actif'
  },
  {
    id: 2,
    code: 'MAS',
    nom: 'Master',
    duree: 2,
    description: 'Cycle de formation de 2 ans après la licence',
    nombreNiveaux: 2,
    nombreEtudiants: 320,
    statut: 'actif'
  },
  {
    id: 3,
    code: 'DOC',
    nom: 'Doctorat',
    duree: 3,
    description: 'Cycle de recherche de 3 ans minimum après le master',
    nombreNiveaux: 3,
    nombreEtudiants: 45,
    statut: 'actif'
  },
  {
    id: 4,
    code: 'DUT',
    nom: 'DUT',
    duree: 2,
    description: 'Diplôme Universitaire de Technologie',
    nombreNiveaux: 2,
    nombreEtudiants: 180,
    statut: 'actif'
  },
  {
    id: 5,
    code: 'BTS',
    nom: 'BTS',
    duree: 2,
    description: 'Brevet de Technicien Supérieur',
    nombreNiveaux: 2,
    nombreEtudiants: 120,
    statut: 'actif'
  }
];

const CyclesListPage: React.FC = () => {
  const [cycles, setCycles] = useState<Cycle[]>(mockCycles);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCycle, setEditingCycle] = useState<Cycle | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    nom: '',
    duree: 3,
    description: '',
    statut: 'actif' as 'actif' | 'inactif'
  });

  const filteredCycles = cycles.filter(c =>
    c.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleShowModal = (cycle?: Cycle) => {
    if (cycle) {
      setEditingCycle(cycle);
      setFormData({
        code: cycle.code,
        nom: cycle.nom,
        duree: cycle.duree,
        description: cycle.description,
        statut: cycle.statut
      });
    } else {
      setEditingCycle(null);
      setFormData({
        code: '',
        nom: '',
        duree: 3,
        description: '',
        statut: 'actif'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCycle(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCycle) {
      setCycles(cycles.map(c =>
        c.id === editingCycle.id ? { ...c, ...formData } : c
      ));
    } else {
      const newCycle: Cycle = {
        id: Math.max(...cycles.map(c => c.id)) + 1,
        ...formData,
        nombreNiveaux: formData.duree,
        nombreEtudiants: 0
      };
      setCycles([...cycles, newCycle]);
    }
    handleCloseModal();
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce cycle ?')) {
      setCycles(cycles.filter(c => c.id !== id));
    }
  };

  const totalEtudiants = cycles.reduce((acc, c) => acc + c.nombreEtudiants, 0);

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1 fw-bold">Cycles d'études</h2>
              <p className="text-muted mb-0">Gestion des cycles de formation (Licence, Master, Doctorat)</p>
            </div>
            <Button variant="primary" onClick={() => handleShowModal()}>
              <i className="bi bi-plus-lg me-2"></i>
              Nouveau cycle
            </Button>
          </div>
        </Col>
      </Row>

      {/* Statistiques */}
      <Row className="mb-4">
        {cycles.filter(c => c.statut === 'actif').slice(0, 4).map((cycle, index) => {
          const colors = ['primary', 'success', 'info', 'warning'];
          return (
            <Col md={3} key={cycle.id}>
              <Card className={`border-0 shadow-sm bg-${colors[index]} text-white`}>
                <Card.Body className="d-flex align-items-center">
                  <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3">
                    <i className="bi bi-mortarboard fs-4"></i>
                  </div>
                  <div>
                    <h3 className="mb-0 fw-bold">{cycle.nombreEtudiants}</h3>
                    <small>{cycle.nom}</small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
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
                  placeholder="Rechercher un cycle..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-start-0"
                />
              </InputGroup>
            </Col>
            <Col md={6} className="text-end">
              <span className="text-muted me-3">
                Total: <strong>{totalEtudiants}</strong> étudiants
              </span>
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
                <th className="border-0 py-3">Cycle</th>
                <th className="border-0 py-3">Description</th>
                <th className="border-0 py-3 text-center">Durée</th>
                <th className="border-0 py-3 text-center">Niveaux</th>
                <th className="border-0 py-3 text-center">Étudiants</th>
                <th className="border-0 py-3 text-center">Statut</th>
                <th className="border-0 py-3 text-end px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCycles.map((cycle) => (
                <tr key={cycle.id}>
                  <td className="px-4 py-3">
                    <span className="fw-semibold text-primary">{cycle.code}</span>
                  </td>
                  <td className="py-3">
                    <div className="fw-semibold">{cycle.nom}</div>
                  </td>
                  <td className="py-3">
                    <small className="text-muted">{cycle.description}</small>
                  </td>
                  <td className="py-3 text-center">
                    <Badge bg="secondary" className="px-3 py-2">{cycle.duree} ans</Badge>
                  </td>
                  <td className="py-3 text-center">
                    <Badge bg="info" className="px-3 py-2">{cycle.nombreNiveaux}</Badge>
                  </td>
                  <td className="py-3 text-center">
                    <Badge bg="primary" className="px-3 py-2">{cycle.nombreEtudiants}</Badge>
                  </td>
                  <td className="py-3 text-center">
                    <Badge bg={cycle.statut === 'actif' ? 'success' : 'secondary'}>
                      {cycle.statut === 'actif' ? 'Actif' : 'Inactif'}
                    </Badge>
                  </td>
                  <td className="py-3 text-end px-4">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                      onClick={() => handleShowModal(cycle)}
                    >
                      <i className="bi bi-pencil"></i>
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDelete(cycle.id)}
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
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingCycle ? 'Modifier le cycle' : 'Nouveau cycle'}
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
                  <Form.Label>Nom du cycle</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Durée (années)</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max="10"
                    value={formData.duree}
                    onChange={(e) => setFormData({ ...formData, duree: parseInt(e.target.value) })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
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
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Annuler
            </Button>
            <Button variant="primary" type="submit">
              {editingCycle ? 'Modifier' : 'Créer'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default CyclesListPage;
