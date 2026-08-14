import React, { useState } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Badge, Modal } from 'react-bootstrap';

interface AuditEntry {
  id: number;
  timestamp: string;
  utilisateur: string;
  action: string;
  entite: string;
  entiteId: string;
  ancienneValeur: string;
  nouvelleValeur: string;
  ip: string;
}

const mockAuditEntries: AuditEntry[] = [
  { id: 1, timestamp: '2025-01-08 09:15:00', utilisateur: 'admin@gestsco.com', action: 'Modification', entite: 'Étudiant', entiteId: '2024-0001', ancienneValeur: 'email: ancien@email.com', nouvelleValeur: 'email: nouveau@email.com', ip: '192.168.1.100' },
  { id: 2, timestamp: '2025-01-08 09:10:00', utilisateur: 'enseignant@gestsco.com', action: 'Création', entite: 'Note', entiteId: 'NOTE-001', ancienneValeur: '-', nouvelleValeur: 'INF101: 15/20 - Diallo Amadou', ip: '192.168.1.75' },
  { id: 3, timestamp: '2025-01-08 09:05:00', utilisateur: 'admin@gestsco.com', action: 'Suppression', entite: 'Document', entiteId: 'DOC-045', ancienneValeur: 'Attestation_2024.pdf', nouvelleValeur: '-', ip: '192.168.1.100' },
  { id: 4, timestamp: '2025-01-08 08:55:00', utilisateur: 'comptable@gestsco.com', action: 'Création', entite: 'Paiement', entiteId: 'PAY-2025-001', ancienneValeur: '-', nouvelleValeur: '150000 FCFA - Sow Fatou', ip: '192.168.1.80' },
  { id: 5, timestamp: '2025-01-08 08:45:00', utilisateur: 'admin@gestsco.com', action: 'Modification', entite: 'Paramètre', entiteId: 'PARAM-001', ancienneValeur: 'annee_scolaire: 2023-2024', nouvelleValeur: 'annee_scolaire: 2024-2025', ip: '192.168.1.100' },
  { id: 6, timestamp: '2025-01-07 17:30:00', utilisateur: 'admin@gestsco.com', action: 'Création', entite: 'Utilisateur', entiteId: 'USER-050', ancienneValeur: '-', nouvelleValeur: 'nouveau.prof@gestsco.com (Enseignant)', ip: '192.168.1.100' },
  { id: 7, timestamp: '2025-01-07 16:00:00', utilisateur: 'enseignant@gestsco.com', action: 'Modification', entite: 'Note', entiteId: 'NOTE-002', ancienneValeur: 'INF102: 12/20', nouvelleValeur: 'INF102: 14/20', ip: '192.168.1.75' },
];

const AuditPage: React.FC = () => {
  const [auditEntries] = useState<AuditEntry[]>(mockAuditEntries);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterEntite, setFilterEntite] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);

  const entites = [...new Set(auditEntries.map(e => e.entite))];

  const filteredEntries = auditEntries.filter(e => {
    const matchSearch = e.utilisateur.toLowerCase().includes(searchTerm.toLowerCase()) || e.entiteId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchAction = !filterAction || e.action === filterAction;
    const matchEntite = !filterEntite || e.entite === filterEntite;
    return matchSearch && matchAction && matchEntite;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'Création': return <Badge bg="success"><i className="bi bi-plus-circle me-1"></i>Création</Badge>;
      case 'Modification': return <Badge bg="warning" text="dark"><i className="bi bi-pencil me-1"></i>Modification</Badge>;
      case 'Suppression': return <Badge bg="danger"><i className="bi bi-trash me-1"></i>Suppression</Badge>;
      default: return <Badge bg="secondary">{action}</Badge>;
    }
  };

  const stats = {
    total: auditEntries.length,
    creations: auditEntries.filter(e => e.action === 'Création').length,
    modifications: auditEntries.filter(e => e.action === 'Modification').length,
    suppressions: auditEntries.filter(e => e.action === 'Suppression').length
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1 fw-bold">Audit</h2>
              <p className="text-muted mb-0">Historique des modifications et actions sur les données</p>
            </div>
            <Button variant="outline-success"><i className="bi bi-download me-2"></i>Exporter</Button>
          </div>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-primary text-white">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3"><i className="bi bi-clipboard-data fs-4"></i></div>
              <div><h3 className="mb-0 fw-bold">{stats.total}</h3><small>Total entrées</small></div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-success text-white">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3"><i className="bi bi-plus-circle fs-4"></i></div>
              <div><h3 className="mb-0 fw-bold">{stats.creations}</h3><small>Créations</small></div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-warning text-dark">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3"><i className="bi bi-pencil fs-4"></i></div>
              <div><h3 className="mb-0 fw-bold">{stats.modifications}</h3><small>Modifications</small></div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-danger text-white">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3"><i className="bi bi-trash fs-4"></i></div>
              <div><h3 className="mb-0 fw-bold">{stats.suppressions}</h3><small>Suppressions</small></div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white py-3">
          <Row className="align-items-center">
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text className="bg-light border-end-0"><i className="bi bi-search text-muted"></i></InputGroup.Text>
                <Form.Control type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="border-start-0" />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select value={filterAction} onChange={(e) => setFilterAction(e.target.value)}>
                <option value="">Toutes les actions</option>
                <option value="Création">Création</option>
                <option value="Modification">Modification</option>
                <option value="Suppression">Suppression</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select value={filterEntite} onChange={(e) => setFilterEntite(e.target.value)}>
                <option value="">Toutes les entités</option>
                {entites.map(e => <option key={e} value={e}>{e}</option>)}
              </Form.Select>
            </Col>
            <Col md={2} className="text-end">
              <span className="text-muted">{filteredEntries.length} entrée(s)</span>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="bg-light">
              <tr>
                <th className="border-0 px-4 py-3">Horodatage</th>
                <th className="border-0 py-3">Utilisateur</th>
                <th className="border-0 py-3">Action</th>
                <th className="border-0 py-3">Entité</th>
                <th className="border-0 py-3">ID</th>
                <th className="border-0 py-3 text-end px-4">Détails</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-4 py-3"><small className="text-muted">{entry.timestamp}</small></td>
                  <td className="py-3"><small>{entry.utilisateur}</small></td>
                  <td className="py-3">{getActionBadge(entry.action)}</td>
                  <td className="py-3"><Badge bg="light" text="dark">{entry.entite}</Badge></td>
                  <td className="py-3"><code className="small">{entry.entiteId}</code></td>
                  <td className="py-3 text-end px-4">
                    <Button variant="outline-info" size="sm" onClick={() => { setSelectedEntry(entry); setShowModal(true); }}>
                      <i className="bi bi-eye"></i>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Modal Détails */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton><Modal.Title>Détails de l'audit</Modal.Title></Modal.Header>
        <Modal.Body>
          {selectedEntry && (
            <>
              <Row className="mb-3">
                <Col md={6}><p className="mb-1"><strong>Date:</strong></p><p className="text-muted">{selectedEntry.timestamp}</p></Col>
                <Col md={6}><p className="mb-1"><strong>Utilisateur:</strong></p><p className="text-muted">{selectedEntry.utilisateur}</p></Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}><p className="mb-1"><strong>Action:</strong></p><p>{getActionBadge(selectedEntry.action)}</p></Col>
                <Col md={6}><p className="mb-1"><strong>IP:</strong></p><p><code>{selectedEntry.ip}</code></p></Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}><p className="mb-1"><strong>Entité:</strong></p><p className="text-muted">{selectedEntry.entite}</p></Col>
                <Col md={6}><p className="mb-1"><strong>ID:</strong></p><p><code>{selectedEntry.entiteId}</code></p></Col>
              </Row>
              <hr />
              <Row>
                <Col md={6}>
                  <p className="mb-1"><strong>Ancienne valeur:</strong></p>
                  <Card className="bg-light border-0"><Card.Body className="py-2"><small className="text-danger">{selectedEntry.ancienneValeur}</small></Card.Body></Card>
                </Col>
                <Col md={6}>
                  <p className="mb-1"><strong>Nouvelle valeur:</strong></p>
                  <Card className="bg-light border-0"><Card.Body className="py-2"><small className="text-success">{selectedEntry.nouvelleValeur}</small></Card.Body></Card>
                </Col>
              </Row>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Fermer</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AuditPage;
