import React, { useState } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Badge } from 'react-bootstrap';

interface Log {
  id: number;
  timestamp: string;
  type: 'info' | 'warning' | 'error' | 'success';
  action: string;
  utilisateur: string;
  ip: string;
  details: string;
}

const mockLogs: Log[] = [
  { id: 1, timestamp: '2025-01-08 09:15:32', type: 'success', action: 'Connexion', utilisateur: 'admin@gestsco.com', ip: '192.168.1.100', details: 'Connexion réussie' },
  { id: 2, timestamp: '2025-01-08 09:10:45', type: 'info', action: 'Création étudiant', utilisateur: 'admin@gestsco.com', ip: '192.168.1.100', details: 'Nouvel étudiant: Amadou Diallo' },
  { id: 3, timestamp: '2025-01-08 09:05:12', type: 'warning', action: 'Tentative connexion', utilisateur: 'inconnu', ip: '192.168.1.50', details: 'Mot de passe incorrect (3 tentatives)' },
  { id: 4, timestamp: '2025-01-08 08:55:00', type: 'info', action: 'Modification note', utilisateur: 'enseignant@gestsco.com', ip: '192.168.1.75', details: 'Note modifiée: INF101 - Diallo Amadou' },
  { id: 5, timestamp: '2025-01-08 08:45:30', type: 'error', action: 'Erreur système', utilisateur: 'système', ip: '-', details: 'Échec envoi email: serveur SMTP indisponible' },
  { id: 6, timestamp: '2025-01-08 08:30:00', type: 'success', action: 'Sauvegarde', utilisateur: 'système', ip: '-', details: 'Sauvegarde automatique effectuée' },
  { id: 7, timestamp: '2025-01-07 18:00:00', type: 'info', action: 'Déconnexion', utilisateur: 'admin@gestsco.com', ip: '192.168.1.100', details: 'Déconnexion manuelle' },
  { id: 8, timestamp: '2025-01-07 17:45:22', type: 'success', action: 'Paiement', utilisateur: 'comptable@gestsco.com', ip: '192.168.1.80', details: 'Paiement enregistré: 150000 FCFA - Sow Fatou' },
];

const LogsPage: React.FC = () => {
  const [logs] = useState<Log[]>(mockLogs);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const filteredLogs = logs.filter(l => {
    const matchSearch = l.action.toLowerCase().includes(searchTerm.toLowerCase()) || l.utilisateur.toLowerCase().includes(searchTerm.toLowerCase()) || l.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = !filterType || l.type === filterType;
    const matchDate = !filterDate || l.timestamp.startsWith(filterDate);
    return matchSearch && matchType && matchDate;
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'success': return <Badge bg="success"><i className="bi bi-check-circle me-1"></i>Succès</Badge>;
      case 'info': return <Badge bg="info"><i className="bi bi-info-circle me-1"></i>Info</Badge>;
      case 'warning': return <Badge bg="warning" text="dark"><i className="bi bi-exclamation-triangle me-1"></i>Attention</Badge>;
      case 'error': return <Badge bg="danger"><i className="bi bi-x-circle me-1"></i>Erreur</Badge>;
      default: return <Badge bg="secondary">{type}</Badge>;
    }
  };

  const stats = {
    total: logs.length,
    success: logs.filter(l => l.type === 'success').length,
    warnings: logs.filter(l => l.type === 'warning').length,
    errors: logs.filter(l => l.type === 'error').length
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1 fw-bold">Logs système</h2>
              <p className="text-muted mb-0">Historique des événements et actions système</p>
            </div>
            <div>
              <Button variant="outline-danger" className="me-2"><i className="bi bi-trash me-2"></i>Purger les logs</Button>
              <Button variant="outline-success"><i className="bi bi-download me-2"></i>Exporter</Button>
            </div>
          </div>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-primary text-white">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3"><i className="bi bi-journal-text fs-4"></i></div>
              <div><h3 className="mb-0 fw-bold">{stats.total}</h3><small>Total logs</small></div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-success text-white">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3"><i className="bi bi-check-circle fs-4"></i></div>
              <div><h3 className="mb-0 fw-bold">{stats.success}</h3><small>Succès</small></div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-warning text-dark">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3"><i className="bi bi-exclamation-triangle fs-4"></i></div>
              <div><h3 className="mb-0 fw-bold">{stats.warnings}</h3><small>Avertissements</small></div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-danger text-white">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3"><i className="bi bi-x-circle fs-4"></i></div>
              <div><h3 className="mb-0 fw-bold">{stats.errors}</h3><small>Erreurs</small></div>
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
              <Form.Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="">Tous les types</option>
                <option value="success">Succès</option>
                <option value="info">Info</option>
                <option value="warning">Avertissement</option>
                <option value="error">Erreur</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Control type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
            </Col>
            <Col md={2} className="text-end">
              <span className="text-muted">{filteredLogs.length} entrée(s)</span>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="bg-light">
              <tr>
                <th className="border-0 px-4 py-3">Horodatage</th>
                <th className="border-0 py-3">Type</th>
                <th className="border-0 py-3">Action</th>
                <th className="border-0 py-3">Utilisateur</th>
                <th className="border-0 py-3">IP</th>
                <th className="border-0 py-3">Détails</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3"><small className="text-muted">{log.timestamp}</small></td>
                  <td className="py-3">{getTypeBadge(log.type)}</td>
                  <td className="py-3 fw-semibold">{log.action}</td>
                  <td className="py-3"><small>{log.utilisateur}</small></td>
                  <td className="py-3"><code className="small">{log.ip}</code></td>
                  <td className="py-3"><small className="text-muted">{log.details}</small></td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default LogsPage;
