import React, { useState } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Badge, Modal } from 'react-bootstrap';

interface Examen {
  id: number;
  code: string;
  matiere: string;
  filiere: string;
  niveau: string;
  date: string;
  heure: string;
  duree: number;
  salle: string;
  enseignant: string;
  nombreInscrits: number;
  statut: 'planifie' | 'en_cours' | 'termine' | 'annule';
}

const mockExamens: Examen[] = [
  { id: 1, code: 'EX-INF101', matiere: 'Algorithmique', filiere: 'Informatique', niveau: 'L1', date: '2025-01-15', heure: '08:00', duree: 180, salle: 'Amphi A', enseignant: 'Dr. Amadou Diallo', nombreInscrits: 120, statut: 'planifie' },
  { id: 2, code: 'EX-INF102', matiere: 'Bases de Données', filiere: 'Informatique', niveau: 'L2', date: '2025-01-15', heure: '14:00', duree: 120, salle: 'Salle 101', enseignant: 'Dr. Ibrahima Fall', nombreInscrits: 85, statut: 'planifie' },
  { id: 3, code: 'EX-GES101', matiere: 'Comptabilité', filiere: 'Gestion', niveau: 'L1', date: '2025-01-16', heure: '08:00', duree: 180, salle: 'Amphi B', enseignant: 'Dr. Fatou Sow', nombreInscrits: 150, statut: 'planifie' },
  { id: 4, code: 'EX-MAT101', matiere: 'Analyse', filiere: 'Informatique', niveau: 'L1', date: '2025-01-10', heure: '08:00', duree: 180, salle: 'Amphi A', enseignant: 'Pr. Moussa Ndiaye', nombreInscrits: 120, statut: 'termine' },
  { id: 5, code: 'EX-ECO201', matiere: 'Microéconomie', filiere: 'Économie', niveau: 'L2', date: '2025-01-17', heure: '10:00', duree: 120, salle: 'Salle 205', enseignant: 'Dr. Aïssatou Ba', nombreInscrits: 65, statut: 'planifie' },
];

const ExamensPage: React.FC = () => {
  const [examens, setExamens] = useState<Examen[]>(mockExamens);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingExamen, setEditingExamen] = useState<Examen | null>(null);
  const [formData, setFormData] = useState({
    code: '', matiere: '', filiere: '', niveau: '', date: '', heure: '08:00', duree: 120, salle: '', enseignant: ''
  });

  const filteredExamens = examens.filter(e => {
    const matchSearch = e.matiere.toLowerCase().includes(searchTerm.toLowerCase()) || e.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatut = !filterStatut || e.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'planifie': return <Badge bg="info">Planifié</Badge>;
      case 'en_cours': return <Badge bg="warning" text="dark">En cours</Badge>;
      case 'termine': return <Badge bg="success">Terminé</Badge>;
      case 'annule': return <Badge bg="danger">Annulé</Badge>;
      default: return <Badge bg="secondary">{statut}</Badge>;
    }
  };

  const handleShowModal = (examen?: Examen) => {
    if (examen) {
      setEditingExamen(examen);
      setFormData({ code: examen.code, matiere: examen.matiere, filiere: examen.filiere, niveau: examen.niveau, date: examen.date, heure: examen.heure, duree: examen.duree, salle: examen.salle, enseignant: examen.enseignant });
    } else {
      setEditingExamen(null);
      setFormData({ code: '', matiere: '', filiere: '', niveau: '', date: '', heure: '08:00', duree: 120, salle: '', enseignant: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingExamen) {
      setExamens(examens.map(ex => ex.id === editingExamen.id ? { ...ex, ...formData } : ex));
    } else {
      setExamens([...examens, { id: Math.max(...examens.map(ex => ex.id)) + 1, ...formData, nombreInscrits: 0, statut: 'planifie' }]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Supprimer cet examen ?')) setExamens(examens.filter(e => e.id !== id));
  };

  const stats = {
    total: examens.length,
    planifies: examens.filter(e => e.statut === 'planifie').length,
    termines: examens.filter(e => e.statut === 'termine').length,
    totalInscrits: examens.reduce((acc, e) => acc + e.nombreInscrits, 0)
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1 fw-bold">Examens</h2>
              <p className="text-muted mb-0">Planification et gestion des sessions d'examens</p>
            </div>
            <Button variant="primary" onClick={() => handleShowModal()}>
              <i className="bi bi-plus-lg me-2"></i>Nouvel examen
            </Button>
          </div>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-primary text-white">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3"><i className="bi bi-calendar-event fs-4"></i></div>
              <div><h3 className="mb-0 fw-bold">{stats.total}</h3><small>Total examens</small></div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-info text-white">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3"><i className="bi bi-clock fs-4"></i></div>
              <div><h3 className="mb-0 fw-bold">{stats.planifies}</h3><small>Planifiés</small></div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-success text-white">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3"><i className="bi bi-check-circle fs-4"></i></div>
              <div><h3 className="mb-0 fw-bold">{stats.termines}</h3><small>Terminés</small></div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-warning text-dark">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3"><i className="bi bi-people fs-4"></i></div>
              <div><h3 className="mb-0 fw-bold">{stats.totalInscrits}</h3><small>Inscrits</small></div>
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
              <Form.Select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}>
                <option value="">Tous les statuts</option>
                <option value="planifie">Planifié</option>
                <option value="en_cours">En cours</option>
                <option value="termine">Terminé</option>
                <option value="annule">Annulé</option>
              </Form.Select>
            </Col>
            <Col md={4} className="text-end">
              <Button variant="outline-success" size="sm"><i className="bi bi-download me-1"></i>Exporter</Button>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="bg-light">
              <tr>
                <th className="border-0 px-4 py-3">Code</th>
                <th className="border-0 py-3">Matière</th>
                <th className="border-0 py-3">Filière / Niveau</th>
                <th className="border-0 py-3">Date & Heure</th>
                <th className="border-0 py-3">Salle</th>
                <th className="border-0 py-3 text-center">Inscrits</th>
                <th className="border-0 py-3 text-center">Statut</th>
                <th className="border-0 py-3 text-end px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExamens.map((examen) => (
                <tr key={examen.id}>
                  <td className="px-4 py-3"><span className="fw-semibold text-primary">{examen.code}</span></td>
                  <td className="py-3"><div className="fw-semibold">{examen.matiere}</div><small className="text-muted">{examen.enseignant}</small></td>
                  <td className="py-3"><div>{examen.filiere}</div><Badge bg="secondary">{examen.niveau}</Badge></td>
                  <td className="py-3"><div>{new Date(examen.date).toLocaleDateString('fr-FR')}</div><small className="text-muted">{examen.heure} ({examen.duree} min)</small></td>
                  <td className="py-3">{examen.salle}</td>
                  <td className="py-3 text-center"><Badge bg="info" className="px-3 py-2">{examen.nombreInscrits}</Badge></td>
                  <td className="py-3 text-center">{getStatutBadge(examen.statut)}</td>
                  <td className="py-3 text-end px-4">
                    <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleShowModal(examen)}><i className="bi bi-pencil"></i></Button>
                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(examen.id)}><i className="bi bi-trash"></i></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton><Modal.Title>{editingExamen ? 'Modifier l\'examen' : 'Nouvel examen'}</Modal.Title></Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={4}><Form.Group className="mb-3"><Form.Label>Code</Form.Label><Form.Control type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required /></Form.Group></Col>
              <Col md={8}><Form.Group className="mb-3"><Form.Label>Matière</Form.Label><Form.Control type="text" value={formData.matiere} onChange={(e) => setFormData({ ...formData, matiere: e.target.value })} required /></Form.Group></Col>
            </Row>
            <Row>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Filière</Form.Label><Form.Select value={formData.filiere} onChange={(e) => setFormData({ ...formData, filiere: e.target.value })} required><option value="">Sélectionner</option><option value="Informatique">Informatique</option><option value="Gestion">Gestion</option><option value="Économie">Économie</option></Form.Select></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Niveau</Form.Label><Form.Select value={formData.niveau} onChange={(e) => setFormData({ ...formData, niveau: e.target.value })} required><option value="">Sélectionner</option><option value="L1">L1</option><option value="L2">L2</option><option value="L3">L3</option><option value="M1">M1</option><option value="M2">M2</option></Form.Select></Form.Group></Col>
            </Row>
            <Row>
              <Col md={4}><Form.Group className="mb-3"><Form.Label>Date</Form.Label><Form.Control type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required /></Form.Group></Col>
              <Col md={4}><Form.Group className="mb-3"><Form.Label>Heure</Form.Label><Form.Control type="time" value={formData.heure} onChange={(e) => setFormData({ ...formData, heure: e.target.value })} required /></Form.Group></Col>
              <Col md={4}><Form.Group className="mb-3"><Form.Label>Durée (min)</Form.Label><Form.Control type="number" value={formData.duree} onChange={(e) => setFormData({ ...formData, duree: parseInt(e.target.value) })} required /></Form.Group></Col>
            </Row>
            <Row>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Salle</Form.Label><Form.Control type="text" value={formData.salle} onChange={(e) => setFormData({ ...formData, salle: e.target.value })} required /></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Enseignant</Form.Label><Form.Control type="text" value={formData.enseignant} onChange={(e) => setFormData({ ...formData, enseignant: e.target.value })} /></Form.Group></Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button variant="primary" type="submit">{editingExamen ? 'Modifier' : 'Créer'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default ExamensPage;
