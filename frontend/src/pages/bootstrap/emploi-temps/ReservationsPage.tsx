import React, { useState } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Badge, Modal } from 'react-bootstrap';

interface Reservation {
  id: number;
  salle: string;
  capacite: number;
  date: string;
  heureDebut: string;
  heureFin: string;
  motif: string;
  demandeur: string;
  departement: string;
  statut: 'en_attente' | 'approuvee' | 'rejetee' | 'annulee';
}

const mockReservations: Reservation[] = [
  { id: 1, salle: 'Amphi A', capacite: 200, date: '2025-01-15', heureDebut: '08:00', heureFin: '12:00', motif: 'Examen Algorithmique L1', demandeur: 'Dr. Amadou Diallo', departement: 'Informatique', statut: 'approuvee' },
  { id: 2, salle: 'Salle 101', capacite: 40, date: '2025-01-15', heureDebut: '14:00', heureFin: '16:00', motif: 'TD Bases de Données', demandeur: 'Dr. Ibrahima Fall', departement: 'Informatique', statut: 'approuvee' },
  { id: 3, salle: 'Salle Info 1', capacite: 30, date: '2025-01-16', heureDebut: '10:00', heureFin: '12:00', motif: 'TP Programmation', demandeur: 'M. Cheikh Sarr', departement: 'Informatique', statut: 'en_attente' },
  { id: 4, salle: 'Amphi B', capacite: 150, date: '2025-01-17', heureDebut: '08:00', heureFin: '10:00', motif: 'Conférence', demandeur: 'Pr. Moussa Ndiaye', departement: 'Direction', statut: 'en_attente' },
  { id: 5, salle: 'Salle 205', capacite: 35, date: '2025-01-14', heureDebut: '14:00', heureFin: '16:00', motif: 'Réunion département', demandeur: 'Dr. Fatou Sow', departement: 'Gestion', statut: 'rejetee' },
];

const ReservationsPage: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>(mockReservations);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    salle: '', date: '', heureDebut: '08:00', heureFin: '10:00', motif: '', demandeur: '', departement: ''
  });

  const salles = [
    { nom: 'Amphi A', capacite: 200 },
    { nom: 'Amphi B', capacite: 150 },
    { nom: 'Salle 101', capacite: 40 },
    { nom: 'Salle 102', capacite: 40 },
    { nom: 'Salle 205', capacite: 35 },
    { nom: 'Salle Info 1', capacite: 30 },
    { nom: 'Salle Info 2', capacite: 30 },
  ];

  const filteredReservations = reservations.filter(r => {
    const matchSearch = r.salle.toLowerCase().includes(searchTerm.toLowerCase()) || r.motif.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatut = !filterStatut || r.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'approuvee': return <Badge bg="success">Approuvée</Badge>;
      case 'en_attente': return <Badge bg="warning" text="dark">En attente</Badge>;
      case 'rejetee': return <Badge bg="danger">Rejetée</Badge>;
      case 'annulee': return <Badge bg="secondary">Annulée</Badge>;
      default: return <Badge bg="secondary">{statut}</Badge>;
    }
  };

  const handleApprove = (id: number) => {
    setReservations(reservations.map(r => r.id === id ? { ...r, statut: 'approuvee' as const } : r));
  };

  const handleReject = (id: number) => {
    setReservations(reservations.map(r => r.id === id ? { ...r, statut: 'rejetee' as const } : r));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedSalle = salles.find(s => s.nom === formData.salle);
    setReservations([...reservations, {
      id: Math.max(...reservations.map(r => r.id)) + 1,
      ...formData,
      capacite: selectedSalle?.capacite || 0,
      statut: 'en_attente'
    }]);
    setShowModal(false);
    setFormData({ salle: '', date: '', heureDebut: '08:00', heureFin: '10:00', motif: '', demandeur: '', departement: '' });
  };

  const stats = {
    total: reservations.length,
    approuvees: reservations.filter(r => r.statut === 'approuvee').length,
    enAttente: reservations.filter(r => r.statut === 'en_attente').length,
    rejetees: reservations.filter(r => r.statut === 'rejetee').length
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1 fw-bold">Réservations de salles</h2>
              <p className="text-muted mb-0">Gestion des demandes de réservation</p>
            </div>
            <Button variant="primary" onClick={() => setShowModal(true)}>
              <i className="bi bi-plus-lg me-2"></i>Nouvelle réservation
            </Button>
          </div>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-primary text-white">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3"><i className="bi bi-calendar-check fs-4"></i></div>
              <div><h3 className="mb-0 fw-bold">{stats.total}</h3><small>Total</small></div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-success text-white">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3"><i className="bi bi-check-circle fs-4"></i></div>
              <div><h3 className="mb-0 fw-bold">{stats.approuvees}</h3><small>Approuvées</small></div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-warning text-dark">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3"><i className="bi bi-hourglass-split fs-4"></i></div>
              <div><h3 className="mb-0 fw-bold">{stats.enAttente}</h3><small>En attente</small></div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-danger text-white">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3"><i className="bi bi-x-circle fs-4"></i></div>
              <div><h3 className="mb-0 fw-bold">{stats.rejetees}</h3><small>Rejetées</small></div>
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
                <option value="en_attente">En attente</option>
                <option value="approuvee">Approuvée</option>
                <option value="rejetee">Rejetée</option>
              </Form.Select>
            </Col>
            <Col md={4} className="text-end">
              <span className="text-muted">{filteredReservations.length} réservation(s)</span>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="bg-light">
              <tr>
                <th className="border-0 px-4 py-3">Salle</th>
                <th className="border-0 py-3">Date & Horaire</th>
                <th className="border-0 py-3">Motif</th>
                <th className="border-0 py-3">Demandeur</th>
                <th className="border-0 py-3 text-center">Statut</th>
                <th className="border-0 py-3 text-end px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReservations.map((reservation) => (
                <tr key={reservation.id}>
                  <td className="px-4 py-3">
                    <div className="fw-semibold">{reservation.salle}</div>
                    <small className="text-muted">{reservation.capacite} places</small>
                  </td>
                  <td className="py-3">
                    <div>{new Date(reservation.date).toLocaleDateString('fr-FR')}</div>
                    <small className="text-muted">{reservation.heureDebut} - {reservation.heureFin}</small>
                  </td>
                  <td className="py-3">{reservation.motif}</td>
                  <td className="py-3">
                    <div>{reservation.demandeur}</div>
                    <small className="text-muted">{reservation.departement}</small>
                  </td>
                  <td className="py-3 text-center">{getStatutBadge(reservation.statut)}</td>
                  <td className="py-3 text-end px-4">
                    {reservation.statut === 'en_attente' && (
                      <>
                        <Button variant="success" size="sm" className="me-2" onClick={() => handleApprove(reservation.id)}>
                          <i className="bi bi-check"></i>
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => handleReject(reservation.id)}>
                          <i className="bi bi-x"></i>
                        </Button>
                      </>
                    )}
                    {reservation.statut === 'approuvee' && (
                      <Button variant="outline-secondary" size="sm"><i className="bi bi-printer"></i></Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton><Modal.Title>Nouvelle réservation</Modal.Title></Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Salle</Form.Label>
              <Form.Select value={formData.salle} onChange={(e) => setFormData({ ...formData, salle: e.target.value })} required>
                <option value="">Sélectionner une salle</option>
                {salles.map(s => <option key={s.nom} value={s.nom}>{s.nom} ({s.capacite} places)</option>)}
              </Form.Select>
            </Form.Group>
            <Row>
              <Col md={4}><Form.Group className="mb-3"><Form.Label>Date</Form.Label><Form.Control type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required /></Form.Group></Col>
              <Col md={4}><Form.Group className="mb-3"><Form.Label>Début</Form.Label><Form.Control type="time" value={formData.heureDebut} onChange={(e) => setFormData({ ...formData, heureDebut: e.target.value })} required /></Form.Group></Col>
              <Col md={4}><Form.Group className="mb-3"><Form.Label>Fin</Form.Label><Form.Control type="time" value={formData.heureFin} onChange={(e) => setFormData({ ...formData, heureFin: e.target.value })} required /></Form.Group></Col>
            </Row>
            <Form.Group className="mb-3"><Form.Label>Motif</Form.Label><Form.Control type="text" value={formData.motif} onChange={(e) => setFormData({ ...formData, motif: e.target.value })} required /></Form.Group>
            <Row>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Demandeur</Form.Label><Form.Control type="text" value={formData.demandeur} onChange={(e) => setFormData({ ...formData, demandeur: e.target.value })} required /></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Département</Form.Label><Form.Control type="text" value={formData.departement} onChange={(e) => setFormData({ ...formData, departement: e.target.value })} /></Form.Group></Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button variant="primary" type="submit">Soumettre</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default ReservationsPage;
