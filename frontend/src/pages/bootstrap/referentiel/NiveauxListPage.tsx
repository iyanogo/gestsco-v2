import React, { useState } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Modal, Badge } from 'react-bootstrap';

interface Niveau {
  id: number;
  code: string;
  nom: string;
  cycle: string;
  ordre: number;
  nombreEtudiants: number;
  nombreClasses: number;
  statut: 'actif' | 'inactif';
}

const mockNiveaux: Niveau[] = [
  { id: 1, code: 'L1', nom: 'Licence 1', cycle: 'Licence', ordre: 1, nombreEtudiants: 450, nombreClasses: 12, statut: 'actif' },
  { id: 2, code: 'L2', nom: 'Licence 2', cycle: 'Licence', ordre: 2, nombreEtudiants: 380, nombreClasses: 10, statut: 'actif' },
  { id: 3, code: 'L3', nom: 'Licence 3', cycle: 'Licence', ordre: 3, nombreEtudiants: 320, nombreClasses: 8, statut: 'actif' },
  { id: 4, code: 'M1', nom: 'Master 1', cycle: 'Master', ordre: 1, nombreEtudiants: 180, nombreClasses: 6, statut: 'actif' },
  { id: 5, code: 'M2', nom: 'Master 2', cycle: 'Master', ordre: 2, nombreEtudiants: 140, nombreClasses: 5, statut: 'actif' },
  { id: 6, code: 'D1', nom: 'Doctorat 1', cycle: 'Doctorat', ordre: 1, nombreEtudiants: 25, nombreClasses: 2, statut: 'actif' },
  { id: 7, code: 'D2', nom: 'Doctorat 2', cycle: 'Doctorat', ordre: 2, nombreEtudiants: 15, nombreClasses: 1, statut: 'actif' },
  { id: 8, code: 'D3', nom: 'Doctorat 3', cycle: 'Doctorat', ordre: 3, nombreEtudiants: 10, nombreClasses: 1, statut: 'actif' }
];

const NiveauxListPage: React.FC = () => {
  const [niveaux, setNiveaux] = useState<Niveau[]>(mockNiveaux);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCycle, setFilterCycle] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingNiveau, setEditingNiveau] = useState<Niveau | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    nom: '',
    cycle: 'Licence',
    ordre: 1,
    statut: 'actif' as 'actif' | 'inactif'
  });

  const cycles = [...new Set(niveaux.map(n => n.cycle))];

  const filteredNiveaux = niveaux.filter(n => {
    const matchSearch = n.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCycle = !filterCycle || n.cycle === filterCycle;
    return matchSearch && matchCycle;
  });

  const handleShowModal = (niveau?: Niveau) => {
    if (niveau) {
      setEditingNiveau(niveau);
      setFormData({
        code: niveau.code,
        nom: niveau.nom,
        cycle: niveau.cycle,
        ordre: niveau.ordre,
        statut: niveau.statut
      });
    } else {
      setEditingNiveau(null);
      setFormData({ code: '', nom: '', cycle: 'Licence', ordre: 1, statut: 'actif' });
    }
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingNiveau) {
      setNiveaux(niveaux.map(n => n.id === editingNiveau.id ? { ...n, ...formData } : n));
    } else {
      const newNiveau: Niveau = {
        id: Math.max(...niveaux.map(n => n.id)) + 1,
        ...formData,
        nombreEtudiants: 0,
        nombreClasses: 0
      };
      setNiveaux([...niveaux, newNiveau]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce niveau ?')) {
      setNiveaux(niveaux.filter(n => n.id !== id));
    }
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1 fw-bold">Niveaux d'études</h2>
              <p className="text-muted mb-0">Gestion des niveaux par cycle de formation</p>
            </div>
            <Button variant="primary" onClick={() => handleShowModal()}>
              <i className="bi bi-plus-lg me-2"></i>
              Nouveau niveau
            </Button>
          </div>
        </Col>
      </Row>

      {/* Stats par cycle */}
      <Row className="mb-4">
        {cycles.map((cycle, index) => {
          const cycleNiveaux = niveaux.filter(n => n.cycle === cycle);
          const totalEtudiants = cycleNiveaux.reduce((acc, n) => acc + n.nombreEtudiants, 0);
          const colors = ['primary', 'success', 'info'];
          return (
            <Col md={4} key={cycle}>
              <Card className={`border-0 shadow-sm bg-${colors[index % 3]} text-white`}>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="mb-1">{cycle}</h5>
                      <small>{cycleNiveaux.length} niveaux</small>
                    </div>
                    <div className="text-end">
                      <h3 className="mb-0 fw-bold">{totalEtudiants}</h3>
                      <small>étudiants</small>
                    </div>
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
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text className="bg-light border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-start-0"
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select value={filterCycle} onChange={(e) => setFilterCycle(e.target.value)}>
                <option value="">Tous les cycles</option>
                {cycles.map(c => <option key={c} value={c}>{c}</option>)}
              </Form.Select>
            </Col>
            <Col md={5} className="text-end">
              <span className="text-muted">{filteredNiveaux.length} niveau(x)</span>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="bg-light">
              <tr>
                <th className="border-0 px-4 py-3">Code</th>
                <th className="border-0 py-3">Niveau</th>
                <th className="border-0 py-3">Cycle</th>
                <th className="border-0 py-3 text-center">Ordre</th>
                <th className="border-0 py-3 text-center">Étudiants</th>
                <th className="border-0 py-3 text-center">Classes</th>
                <th className="border-0 py-3 text-center">Statut</th>
                <th className="border-0 py-3 text-end px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredNiveaux.map((niveau) => (
                <tr key={niveau.id}>
                  <td className="px-4 py-3">
                    <span className="fw-semibold text-primary">{niveau.code}</span>
                  </td>
                  <td className="py-3 fw-semibold">{niveau.nom}</td>
                  <td className="py-3">
                    <Badge bg={niveau.cycle === 'Licence' ? 'primary' : niveau.cycle === 'Master' ? 'success' : 'info'}>
                      {niveau.cycle}
                    </Badge>
                  </td>
                  <td className="py-3 text-center">{niveau.ordre}</td>
                  <td className="py-3 text-center">
                    <Badge bg="secondary" className="px-3 py-2">{niveau.nombreEtudiants}</Badge>
                  </td>
                  <td className="py-3 text-center">
                    <Badge bg="info" className="px-3 py-2">{niveau.nombreClasses}</Badge>
                  </td>
                  <td className="py-3 text-center">
                    <Badge bg={niveau.statut === 'actif' ? 'success' : 'secondary'}>
                      {niveau.statut === 'actif' ? 'Actif' : 'Inactif'}
                    </Badge>
                  </td>
                  <td className="py-3 text-end px-4">
                    <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleShowModal(niveau)}>
                      <i className="bi bi-pencil"></i>
                    </Button>
                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(niveau.id)}>
                      <i className="bi bi-trash"></i>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingNiveau ? 'Modifier le niveau' : 'Nouveau niveau'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Code</Form.Label>
                  <Form.Control type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required />
                </Form.Group>
              </Col>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Nom</Form.Label>
                  <Form.Control type="text" value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} required />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Cycle</Form.Label>
                  <Form.Select value={formData.cycle} onChange={(e) => setFormData({ ...formData, cycle: e.target.value })}>
                    <option value="Licence">Licence</option>
                    <option value="Master">Master</option>
                    <option value="Doctorat">Doctorat</option>
                    <option value="DUT">DUT</option>
                    <option value="BTS">BTS</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Ordre</Form.Label>
                  <Form.Control type="number" min="1" value={formData.ordre} onChange={(e) => setFormData({ ...formData, ordre: parseInt(e.target.value) })} required />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Statut</Form.Label>
              <Form.Select value={formData.statut} onChange={(e) => setFormData({ ...formData, statut: e.target.value as 'actif' | 'inactif' })}>
                <option value="actif">Actif</option>
                <option value="inactif">Inactif</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button variant="primary" type="submit">{editingNiveau ? 'Modifier' : 'Créer'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default NiveauxListPage;
