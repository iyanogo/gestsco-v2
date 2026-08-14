import React, { useState } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, ProgressBar, Alert } from 'react-bootstrap';

interface Backup {
  id: number;
  nom: string;
  date: string;
  taille: string;
  type: 'automatique' | 'manuel';
  statut: 'complet' | 'en_cours' | 'echec';
}

const mockBackups: Backup[] = [
  { id: 1, nom: 'backup_2025-01-08_08-30.sql', date: '2025-01-08 08:30:00', taille: '125 MB', type: 'automatique', statut: 'complet' },
  { id: 2, nom: 'backup_2025-01-07_08-30.sql', date: '2025-01-07 08:30:00', taille: '124 MB', type: 'automatique', statut: 'complet' },
  { id: 3, nom: 'backup_2025-01-06_08-30.sql', date: '2025-01-06 08:30:00', taille: '123 MB', type: 'automatique', statut: 'complet' },
  { id: 4, nom: 'backup_manuel_2025-01-05.sql', date: '2025-01-05 15:45:00', taille: '122 MB', type: 'manuel', statut: 'complet' },
  { id: 5, nom: 'backup_2025-01-05_08-30.sql', date: '2025-01-05 08:30:00', taille: '122 MB', type: 'automatique', statut: 'complet' },
];

const BackupPage: React.FC = () => {
  const [backups] = useState<Backup[]>(mockBackups);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleBackup = () => {
    setIsBackingUp(true);
    setProgress(0);
    setShowSuccess(false);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsBackingUp(false);
          setShowSuccess(true);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'complet': return <Badge bg="success">Complet</Badge>;
      case 'en_cours': return <Badge bg="warning" text="dark">En cours</Badge>;
      case 'echec': return <Badge bg="danger">Échec</Badge>;
      default: return <Badge bg="secondary">{statut}</Badge>;
    }
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1 fw-bold">Sauvegardes</h2>
              <p className="text-muted mb-0">Gestion des sauvegardes de la base de données</p>
            </div>
            <Button variant="primary" onClick={handleBackup} disabled={isBackingUp}>
              {isBackingUp ? (
                <><span className="spinner-border spinner-border-sm me-2"></span>Sauvegarde en cours...</>
              ) : (
                <><i className="bi bi-cloud-upload me-2"></i>Nouvelle sauvegarde</>
              )}
            </Button>
          </div>
        </Col>
      </Row>

      {showSuccess && (
        <Alert variant="success" dismissible onClose={() => setShowSuccess(false)}>
          <i className="bi bi-check-circle me-2"></i>
          Sauvegarde effectuée avec succès !
        </Alert>
      )}

      {isBackingUp && (
        <Card className="border-0 shadow-sm mb-4">
          <Card.Body>
            <div className="d-flex justify-content-between mb-2">
              <span>Sauvegarde en cours...</span>
              <span>{progress}%</span>
            </div>
            <ProgressBar now={progress} animated striped />
          </Card.Body>
        </Card>
      )}

      <Row className="mb-4">
        <Col md={4}>
          <Card className="border-0 shadow-sm bg-primary text-white">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3"><i className="bi bi-cloud-download fs-4"></i></div>
              <div><h3 className="mb-0 fw-bold">{backups.length}</h3><small>Sauvegardes</small></div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm bg-success text-white">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3"><i className="bi bi-check-circle fs-4"></i></div>
              <div><h3 className="mb-0 fw-bold">{backups.filter(b => b.statut === 'complet').length}</h3><small>Réussies</small></div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm bg-info text-white">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3"><i className="bi bi-hdd fs-4"></i></div>
              <div><h3 className="mb-0 fw-bold">~620 MB</h3><small>Espace utilisé</small></div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white"><h6 className="mb-0 fw-bold">Configuration</h6></Card.Header>
            <Card.Body>
              <div className="mb-3">
                <label className="form-label small text-muted">Sauvegarde automatique</label>
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" defaultChecked />
                  <label className="form-check-label">Activée</label>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label small text-muted">Fréquence</label>
                <select className="form-select" defaultValue="daily">
                  <option value="hourly">Toutes les heures</option>
                  <option value="daily">Quotidienne</option>
                  <option value="weekly">Hebdomadaire</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label small text-muted">Heure de sauvegarde</label>
                <input type="time" className="form-control" defaultValue="08:30" />
              </div>
              <div>
                <label className="form-label small text-muted">Rétention (jours)</label>
                <input type="number" className="form-control" defaultValue={30} min={7} max={365} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white"><h6 className="mb-0 fw-bold">Dernière sauvegarde</h6></Card.Header>
            <Card.Body>
              <div className="text-center py-3">
                <i className="bi bi-cloud-check text-success display-4 mb-3"></i>
                <h5 className="fw-bold">Sauvegarde réussie</h5>
                <p className="text-muted mb-2">{backups[0]?.date}</p>
                <p className="mb-3"><Badge bg="info">{backups[0]?.taille}</Badge></p>
                <Button variant="outline-primary" size="sm" className="me-2">
                  <i className="bi bi-download me-1"></i>Télécharger
                </Button>
                <Button variant="outline-success" size="sm">
                  <i className="bi bi-arrow-counterclockwise me-1"></i>Restaurer
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white py-3">
          <h6 className="mb-0 fw-bold">Historique des sauvegardes</h6>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="bg-light">
              <tr>
                <th className="border-0 px-4 py-3">Nom</th>
                <th className="border-0 py-3">Date</th>
                <th className="border-0 py-3">Taille</th>
                <th className="border-0 py-3">Type</th>
                <th className="border-0 py-3 text-center">Statut</th>
                <th className="border-0 py-3 text-end px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((backup) => (
                <tr key={backup.id}>
                  <td className="px-4 py-3"><code className="small">{backup.nom}</code></td>
                  <td className="py-3"><small>{backup.date}</small></td>
                  <td className="py-3"><Badge bg="light" text="dark">{backup.taille}</Badge></td>
                  <td className="py-3">
                    {backup.type === 'automatique' ? <Badge bg="info">Auto</Badge> : <Badge bg="secondary">Manuel</Badge>}
                  </td>
                  <td className="py-3 text-center">{getStatutBadge(backup.statut)}</td>
                  <td className="py-3 text-end px-4">
                    <Button variant="outline-primary" size="sm" className="me-2"><i className="bi bi-download"></i></Button>
                    <Button variant="outline-success" size="sm" className="me-2"><i className="bi bi-arrow-counterclockwise"></i></Button>
                    <Button variant="outline-danger" size="sm"><i className="bi bi-trash"></i></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default BackupPage;
