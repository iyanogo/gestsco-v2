import React, { useState } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Badge, Modal } from 'react-bootstrap';

interface Session {
  id: number;
  code: string;
  nom: string;
  type: 'normale' | 'rattrapage';
  anneeScolaire: string;
  semestre: number;
  dateDebut: string;
  dateFin: string;
  nombreExamens: number;
  statut: 'planifiee' | 'en_cours' | 'terminee' | 'cloturee';
}

const mockSessions: Session[] = [
  { id: 1, code: 'SN-2025-S1', nom: 'Session Normale S1', type: 'normale', anneeScolaire: '2024-2025', semestre: 1, dateDebut: '2025-01-10', dateFin: '2025-01-25', nombreExamens: 45, statut: 'en_cours' },
  { id: 2, code: 'SR-2025-S1', nom: 'Session Rattrapage S1', type: 'rattrapage', anneeScolaire: '2024-2025', semestre: 1, dateDebut: '2025-02-15', dateFin: '2025-02-28', nombreExamens: 30, statut: 'planifiee' },
  { id: 3, code: 'SN-2025-S2', nom: 'Session Normale S2', type: 'normale', anneeScolaire: '2024-2025', semestre: 2, dateDebut: '2025-06-01', dateFin: '2025-06-15', nombreExamens: 0, statut: 'planifiee' },
  { id: 4, code: 'SN-2024-S2', nom: 'Session Normale S2', type: 'normale', anneeScolaire: '2023-2024', semestre: 2, dateDebut: '2024-06-01', dateFin: '2024-06-15', nombreExamens: 48, statut: 'cloturee' },
  { id: 5, code: 'SR-2024-S2', nom: 'Session Rattrapage S2', type: 'rattrapage', anneeScolaire: '2023-2024', semestre: 2, dateDebut: '2024-09-01', dateFin: '2024-09-10', nombreExamens: 25, statut: 'cloturee' },
];

const SessionsPage: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>(mockSessions);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [formData, setFormData] = useState({
    code: '', nom: '', type: 'normale' as 'normale' | 'rattrapage', anneeScolaire: '2024-2025', semestre: 1, dateDebut: '', dateFin: ''
  });

  const filteredSessions = sessions.filter(s => {
    const matchSearch = s.nom.toLowerCase().includes(searchTerm.toLowerCase()) || s.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = !filterType || s.type === filterType;
    return matchSearch && matchType;
  });

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'planifiee': return <Badge bg="info">Planifiée</Badge>;
      case 'en_cours': return <Badge bg="warning" text="dark">En cours</Badge>;
      case 'terminee': return <Badge bg="success">Terminée</Badge>;
      case 'cloturee': return <Badge bg="secondary">Clôturée</Badge>;
      default: return <Badge bg="secondary">{statut}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    return type === 'normale' ? <Badge bg="primary">Normale</Badge> : <Badge bg="warning" text="dark">Rattrapage</Badge>;
  };

  const handleShowModal = (session?: Session) => {
    if (session) {
      setEditingSession(session);
      setFormData({ code: session.code, nom: session.nom, type: session.type, anneeScolaire: session.anneeScolaire, semestre: session.semestre, dateDebut: session.dateDebut, dateFin: session.dateFin });
    } else {
      setEditingSession(null);
      setFormData({ code: '', nom: '', type: 'normale', anneeScolaire: '2024-2025', semestre: 1, dateDebut: '', dateFin: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSession) {
      setSessions(sessions.map(s => s.id === editingSession.id ? { ...s, ...formData } : s));
    } else {
      setSessions([...sessions, { id: Math.max(...sessions.map(s => s.id)) + 1, ...formData, nombreExamens: 0, statut: 'planifiee' }]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Supprimer cette session ?')) setSessions(sessions.filter(s => s.id !== id));
  };

  const stats = {
    total: sessions.length,
    enCours: sessions.filter(s => s.statut === 'en_cours').length,
    planifiees: sessions.filter(s => s.statut === 'planifiee').length,
    totalExamens: sessions.reduce((acc, s) => acc + s.nombreExamens, 0)
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1 fw-bold">Sessions d'évaluation</h2>
              <p className="text-muted mb-0">Configuration des sessions d'examens par semestre</p>
            </div>
            <Button variant="primary" onClick={() => handleShowModal()}>
              <i className="bi bi-plus-lg me-2"></i>Nouvelle session
            </Button>
          </div>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-primary text-white">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3"><i className="bi bi-calendar3 fs-4"></i></div>
              <div><h3 className="mb-0 fw-bold">{stats.total}</h3><small>Sessions</small></div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-warning text-dark">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3"><i className="bi bi-play-circle fs-4"></i></div>
              <div><h3 className="mb-0 fw-bold">{stats.enCours}</h3><small>En cours</small></div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-info text-white">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3"><i className="bi bi-clock fs-4"></i></div>
              <div><h3 className="mb-0 fw-bold">{stats.planifiees}</h3><small>Planifiées</small></div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-success text-white">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3"><i className="bi bi-file-earmark-text fs-4"></i></div>
              <div><h3 className="mb-0 fw-bold">{stats.totalExamens}</h3><small>Examens</small></div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white py-3">
          <Row className="align-items-center">
            <Col md={5}>
              <InputGroup>
                <InputGroup.Text className="bg-light border-end-0"><i className="bi bi-search text-muted"></i></InputGroup.Text>
                <Form.Control type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="border-start-0" />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="">Tous les types</option>
                <option value="normale">Session normale</option>
                <option value="rattrapage">Session rattrapage</option>
              </Form.Select>
            </Col>
            <Col md={4} className="text-end">
              <span className="text-muted">{filteredSessions.length} session(s)</span>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="bg-light">
              <tr>
                <th className="border-0 px-4 py-3">Code</th>
                <th className="border-0 py-3">Session</th>
                <th className="border-0 py-3">Type</th>
                <th className="border-0 py-3">Année / Semestre</th>
                <th className="border-0 py-3">Période</th>
                <th className="border-0 py-3 text-center">Examens</th>
                <th className="border-0 py-3 text-center">Statut</th>
                <th className="border-0 py-3 text-end px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((session) => (
                <tr key={session.id}>
                  <td className="px-4 py-3"><span className="fw-semibold text-primary">{session.code}</span></td>
                  <td className="py-3 fw-semibold">{session.nom}</td>
                  <td className="py-3">{getTypeBadge(session.type)}</td>
                  <td className="py-3"><div>{session.anneeScolaire}</div><Badge bg="secondary">S{session.semestre}</Badge></td>
                  <td className="py-3"><small>{new Date(session.dateDebut).toLocaleDateString('fr-FR')} - {new Date(session.dateFin).toLocaleDateString('fr-FR')}</small></td>
                  <td className="py-3 text-center"><Badge bg="info" className="px-3 py-2">{session.nombreExamens}</Badge></td>
                  <td className="py-3 text-center">{getStatutBadge(session.statut)}</td>
                  <td className="py-3 text-end px-4">
                    <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleShowModal(session)}><i className="bi bi-pencil"></i></Button>
                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(session.id)} disabled={session.statut === 'cloturee'}><i className="bi bi-trash"></i></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton><Modal.Title>{editingSession ? 'Modifier la session' : 'Nouvelle session'}</Modal.Title></Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={5}><Form.Group className="mb-3"><Form.Label>Code</Form.Label><Form.Control type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required /></Form.Group></Col>
              <Col md={7}><Form.Group className="mb-3"><Form.Label>Nom</Form.Label><Form.Control type="text" value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} required /></Form.Group></Col>
            </Row>
            <Row>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Type</Form.Label><Form.Select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as 'normale' | 'rattrapage' })}><option value="normale">Session normale</option><option value="rattrapage">Session rattrapage</option></Form.Select></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Semestre</Form.Label><Form.Select value={formData.semestre} onChange={(e) => setFormData({ ...formData, semestre: parseInt(e.target.value) })}><option value={1}>Semestre 1</option><option value={2}>Semestre 2</option></Form.Select></Form.Group></Col>
            </Row>
            <Form.Group className="mb-3"><Form.Label>Année scolaire</Form.Label><Form.Select value={formData.anneeScolaire} onChange={(e) => setFormData({ ...formData, anneeScolaire: e.target.value })}><option value="2024-2025">2024-2025</option><option value="2025-2026">2025-2026</option></Form.Select></Form.Group>
            <Row>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Date début</Form.Label><Form.Control type="date" value={formData.dateDebut} onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })} required /></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Date fin</Form.Label><Form.Control type="date" value={formData.dateFin} onChange={(e) => setFormData({ ...formData, dateFin: e.target.value })} required /></Form.Group></Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button variant="primary" type="submit">{editingSession ? 'Modifier' : 'Créer'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default SessionsPage;
