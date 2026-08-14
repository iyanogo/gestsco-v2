import React, { useState } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Badge, Modal, ProgressBar } from 'react-bootstrap';

interface Deliberation {
  id: number;
  filiere: string;
  niveau: string;
  session: string;
  anneeScolaire: string;
  dateDeliberation: string;
  nombreEtudiants: number;
  admis: number;
  ajournes: number;
  exclus: number;
  statut: 'en_attente' | 'en_cours' | 'terminee' | 'validee';
  jury: string;
}

const mockDeliberations: Deliberation[] = [
  { id: 1, filiere: 'Informatique', niveau: 'L1', session: 'Session Normale S1', anneeScolaire: '2024-2025', dateDeliberation: '2025-01-28', nombreEtudiants: 120, admis: 85, ajournes: 30, exclus: 5, statut: 'en_attente', jury: 'Pr. Moussa Ndiaye' },
  { id: 2, filiere: 'Informatique', niveau: 'L2', session: 'Session Normale S1', anneeScolaire: '2024-2025', dateDeliberation: '2025-01-28', nombreEtudiants: 95, admis: 72, ajournes: 20, exclus: 3, statut: 'en_attente', jury: 'Dr. Amadou Diallo' },
  { id: 3, filiere: 'Gestion', niveau: 'L1', session: 'Session Normale S1', anneeScolaire: '2024-2025', dateDeliberation: '2025-01-29', nombreEtudiants: 150, admis: 0, ajournes: 0, exclus: 0, statut: 'en_attente', jury: 'Dr. Fatou Sow' },
  { id: 4, filiere: 'Informatique', niveau: 'L3', session: 'Session Normale S2', anneeScolaire: '2023-2024', dateDeliberation: '2024-06-20', nombreEtudiants: 80, admis: 65, ajournes: 12, exclus: 3, statut: 'validee', jury: 'Pr. Ibrahima Fall' },
  { id: 5, filiere: 'Économie', niveau: 'L2', session: 'Session Normale S2', anneeScolaire: '2023-2024', dateDeliberation: '2024-06-21', nombreEtudiants: 65, admis: 50, ajournes: 13, exclus: 2, statut: 'validee', jury: 'Dr. Aïssatou Ba' },
];

const DeliberationsPage: React.FC = () => {
  const [deliberations, setDeliberations] = useState<Deliberation[]>(mockDeliberations);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedDeliberation, setSelectedDeliberation] = useState<Deliberation | null>(null);

  const filteredDeliberations = deliberations.filter(d => {
    const matchSearch = d.filiere.toLowerCase().includes(searchTerm.toLowerCase()) || d.niveau.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatut = !filterStatut || d.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'en_attente': return <Badge bg="secondary">En attente</Badge>;
      case 'en_cours': return <Badge bg="warning" text="dark">En cours</Badge>;
      case 'terminee': return <Badge bg="info">Terminée</Badge>;
      case 'validee': return <Badge bg="success">Validée</Badge>;
      default: return <Badge bg="secondary">{statut}</Badge>;
    }
  };

  const handleValider = (id: number) => {
    setDeliberations(deliberations.map(d => d.id === id ? { ...d, statut: 'validee' as const } : d));
    setShowModal(false);
  };

  const handleDemarrer = (id: number) => {
    setDeliberations(deliberations.map(d => d.id === id ? { ...d, statut: 'en_cours' as const } : d));
  };

  const stats = {
    total: deliberations.length,
    enAttente: deliberations.filter(d => d.statut === 'en_attente').length,
    validees: deliberations.filter(d => d.statut === 'validee').length,
    totalEtudiants: deliberations.reduce((acc, d) => acc + d.nombreEtudiants, 0)
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1 fw-bold">Délibérations</h2>
              <p className="text-muted mb-0">Gestion des délibérations et validation des résultats</p>
            </div>
            <Button variant="outline-success">
              <i className="bi bi-file-earmark-pdf me-2"></i>Générer PV
            </Button>
          </div>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-primary text-white">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3"><i className="bi bi-clipboard-data fs-4"></i></div>
              <div><h3 className="mb-0 fw-bold">{stats.total}</h3><small>Délibérations</small></div>
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
          <Card className="border-0 shadow-sm bg-success text-white">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3"><i className="bi bi-check-circle fs-4"></i></div>
              <div><h3 className="mb-0 fw-bold">{stats.validees}</h3><small>Validées</small></div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-info text-white">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3"><i className="bi bi-people fs-4"></i></div>
              <div><h3 className="mb-0 fw-bold">{stats.totalEtudiants}</h3><small>Étudiants</small></div>
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
                <option value="en_cours">En cours</option>
                <option value="terminee">Terminée</option>
                <option value="validee">Validée</option>
              </Form.Select>
            </Col>
            <Col md={4} className="text-end">
              <span className="text-muted">{filteredDeliberations.length} délibération(s)</span>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="bg-light">
              <tr>
                <th className="border-0 px-4 py-3">Filière / Niveau</th>
                <th className="border-0 py-3">Session</th>
                <th className="border-0 py-3">Date</th>
                <th className="border-0 py-3">Jury</th>
                <th className="border-0 py-3 text-center">Étudiants</th>
                <th className="border-0 py-3">Résultats</th>
                <th className="border-0 py-3 text-center">Statut</th>
                <th className="border-0 py-3 text-end px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeliberations.map((delib) => (
                <tr key={delib.id}>
                  <td className="px-4 py-3">
                    <div className="fw-semibold">{delib.filiere}</div>
                    <Badge bg="secondary">{delib.niveau}</Badge>
                  </td>
                  <td className="py-3">
                    <div>{delib.session}</div>
                    <small className="text-muted">{delib.anneeScolaire}</small>
                  </td>
                  <td className="py-3">{new Date(delib.dateDeliberation).toLocaleDateString('fr-FR')}</td>
                  <td className="py-3"><small>{delib.jury}</small></td>
                  <td className="py-3 text-center"><Badge bg="info" className="px-3 py-2">{delib.nombreEtudiants}</Badge></td>
                  <td className="py-3">
                    {delib.statut === 'validee' || delib.statut === 'terminee' ? (
                      <div style={{ width: 150 }}>
                        <div className="d-flex justify-content-between small mb-1">
                          <span className="text-success">{delib.admis} admis</span>
                          <span className="text-warning">{delib.ajournes} aj.</span>
                          <span className="text-danger">{delib.exclus} excl.</span>
                        </div>
                        <ProgressBar style={{ height: 8 }}>
                          <ProgressBar variant="success" now={(delib.admis / delib.nombreEtudiants) * 100} key={1} />
                          <ProgressBar variant="warning" now={(delib.ajournes / delib.nombreEtudiants) * 100} key={2} />
                          <ProgressBar variant="danger" now={(delib.exclus / delib.nombreEtudiants) * 100} key={3} />
                        </ProgressBar>
                      </div>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td className="py-3 text-center">{getStatutBadge(delib.statut)}</td>
                  <td className="py-3 text-end px-4">
                    {delib.statut === 'en_attente' && (
                      <Button variant="warning" size="sm" className="me-2" onClick={() => handleDemarrer(delib.id)}>
                        <i className="bi bi-play me-1"></i>Démarrer
                      </Button>
                    )}
                    {(delib.statut === 'en_cours' || delib.statut === 'terminee') && (
                      <Button variant="success" size="sm" className="me-2" onClick={() => { setSelectedDeliberation(delib); setShowModal(true); }}>
                        <i className="bi bi-check-lg me-1"></i>Valider
                      </Button>
                    )}
                    {delib.statut === 'validee' && (
                      <>
                        <Button variant="outline-primary" size="sm" className="me-2"><i className="bi bi-eye"></i></Button>
                        <Button variant="outline-success" size="sm"><i className="bi bi-printer"></i></Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Modal Validation */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Valider la délibération</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedDeliberation && (
            <>
              <p>Voulez-vous valider la délibération suivante ?</p>
              <Card className="bg-light border-0">
                <Card.Body>
                  <p className="mb-1"><strong>Filière:</strong> {selectedDeliberation.filiere} - {selectedDeliberation.niveau}</p>
                  <p className="mb-1"><strong>Session:</strong> {selectedDeliberation.session}</p>
                  <p className="mb-1"><strong>Date:</strong> {new Date(selectedDeliberation.dateDeliberation).toLocaleDateString('fr-FR')}</p>
                  <p className="mb-0"><strong>Jury:</strong> {selectedDeliberation.jury}</p>
                </Card.Body>
              </Card>
              <div className="alert alert-warning mt-3 mb-0">
                <i className="bi bi-exclamation-triangle me-2"></i>
                Cette action est irréversible. Les résultats seront définitivement validés.
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Annuler</Button>
          <Button variant="success" onClick={() => selectedDeliberation && handleValider(selectedDeliberation.id)}>
            <i className="bi bi-check-lg me-2"></i>Valider définitivement
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default DeliberationsPage;
