import React, { useState } from 'react';
import { Row, Col, Card, Button, Badge, Form, Table, Alert } from 'react-bootstrap';
import { PageHeader } from '../../../components/layouts';
import { DataCard, Avatar } from '../../../components/ui';

interface Etudiant {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  present: boolean;
  retard: boolean;
  justifie: boolean;
  commentaire: string;
}

const PresencesPage: React.FC = () => {
  const [selectedClasse, setSelectedClasse] = useState('L3-INFO-A');
  const [selectedMatiere, setSelectedMatiere] = useState('algo');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCreneau, setSelectedCreneau] = useState('08:00-10:00');
  const [saved, setSaved] = useState(false);

  const [etudiants, setEtudiants] = useState<Etudiant[]>([
    { id: 1, matricule: '2024-0125', nom: 'DIALLO', prenom: 'Amadou', present: true, retard: false, justifie: false, commentaire: '' },
    { id: 2, matricule: '2024-0126', nom: 'TRAORE', prenom: 'Fatou', present: true, retard: false, justifie: false, commentaire: '' },
    { id: 3, matricule: '2024-0127', nom: 'KONE', prenom: 'Ibrahim', present: false, retard: false, justifie: false, commentaire: '' },
    { id: 4, matricule: '2024-0128', nom: 'OUEDRAOGO', prenom: 'Aïcha', present: true, retard: true, justifie: false, commentaire: 'Retard de 15 min' },
    { id: 5, matricule: '2024-0129', nom: 'SANOGO', prenom: 'Moussa', present: true, retard: false, justifie: false, commentaire: '' },
    { id: 6, matricule: '2024-0130', nom: 'BARRY', prenom: 'Mariama', present: false, retard: false, justifie: true, commentaire: 'Certificat médical' },
    { id: 7, matricule: '2024-0131', nom: 'COULIBALY', prenom: 'Seydou', present: true, retard: false, justifie: false, commentaire: '' },
    { id: 8, matricule: '2024-0132', nom: 'DIARRA', prenom: 'Aminata', present: true, retard: false, justifie: false, commentaire: '' },
  ]);

  const handlePresenceChange = (id: number, field: 'present' | 'retard' | 'justifie', value: boolean) => {
    setEtudiants(prev => prev.map(e => {
      if (e.id === id) {
        const updated = { ...e, [field]: value };
        if (field === 'present' && value) {
          updated.justifie = false;
        }
        if (field === 'present' && !value) {
          updated.retard = false;
        }
        return updated;
      }
      return e;
    }));
    setSaved(false);
  };

  const handleCommentChange = (id: number, value: string) => {
    setEtudiants(prev => prev.map(e => 
      e.id === id ? { ...e, commentaire: value } : e
    ));
    setSaved(false);
  };

  const handleSave = () => {
    console.log('Saving presences:', etudiants);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleMarkAllPresent = () => {
    setEtudiants(prev => prev.map(e => ({ ...e, present: true, retard: false, justifie: false })));
    setSaved(false);
  };

  const handleMarkAllAbsent = () => {
    setEtudiants(prev => prev.map(e => ({ ...e, present: false, retard: false })));
    setSaved(false);
  };

  // Statistiques
  const stats = {
    total: etudiants.length,
    presents: etudiants.filter(e => e.present).length,
    absents: etudiants.filter(e => !e.present).length,
    retards: etudiants.filter(e => e.retard).length,
    justifies: etudiants.filter(e => !e.present && e.justifie).length,
    tauxPresence: Math.round((etudiants.filter(e => e.present).length / etudiants.length) * 100)
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Appel / Présences"
        subtitle="Gestion des présences et absences"
        breadcrumbs={[
          { label: 'Présences', path: '/admin/presences' },
          { label: 'Appel' }
        ]}
        actions={
          <div className="d-flex gap-2">
            <Button variant="outline-primary">
              <i className="bi bi-download me-2"></i>
              Exporter
            </Button>
            <Button variant="success" onClick={handleSave}>
              <i className="bi bi-check-lg me-2"></i>
              Enregistrer
            </Button>
          </div>
        }
      />

      {/* Filtres */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={3}>
              <Form.Group>
                <Form.Label>Classe</Form.Label>
                <Form.Select
                  value={selectedClasse}
                  onChange={(e) => setSelectedClasse(e.target.value)}
                >
                  <option value="L3-INFO-A">L3 Informatique A</option>
                  <option value="L3-INFO-B">L3 Informatique B</option>
                  <option value="L2-INFO-A">L2 Informatique A</option>
                  <option value="M1-INFO">M1 Informatique</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Matière</Form.Label>
                <Form.Select
                  value={selectedMatiere}
                  onChange={(e) => setSelectedMatiere(e.target.value)}
                >
                  <option value="algo">Algorithmique avancée</option>
                  <option value="bdd">Base de données</option>
                  <option value="web">Programmation Web</option>
                  <option value="reseaux">Réseaux</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Date</Form.Label>
                <Form.Control
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Créneau</Form.Label>
                <Form.Select
                  value={selectedCreneau}
                  onChange={(e) => setSelectedCreneau(e.target.value)}
                >
                  <option value="08:00-10:00">08:00 - 10:00</option>
                  <option value="10:15-12:15">10:15 - 12:15</option>
                  <option value="14:00-16:00">14:00 - 16:00</option>
                  <option value="16:15-18:15">16:15 - 18:15</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Statistiques */}
      <Row className="g-3 mb-4">
        <Col sm={6} md={2}>
          <div className="bg-white rounded p-3 border text-center">
            <div className="fs-4 fw-bold text-primary">{stats.total}</div>
            <small className="text-muted">Étudiants</small>
          </div>
        </Col>
        <Col sm={6} md={2}>
          <div className="bg-white rounded p-3 border text-center">
            <div className="fs-4 fw-bold text-success">{stats.presents}</div>
            <small className="text-muted">Présents</small>
          </div>
        </Col>
        <Col sm={6} md={2}>
          <div className="bg-white rounded p-3 border text-center">
            <div className="fs-4 fw-bold text-danger">{stats.absents}</div>
            <small className="text-muted">Absents</small>
          </div>
        </Col>
        <Col sm={6} md={2}>
          <div className="bg-white rounded p-3 border text-center">
            <div className="fs-4 fw-bold text-warning">{stats.retards}</div>
            <small className="text-muted">Retards</small>
          </div>
        </Col>
        <Col sm={6} md={2}>
          <div className="bg-white rounded p-3 border text-center">
            <div className="fs-4 fw-bold text-info">{stats.justifies}</div>
            <small className="text-muted">Justifiés</small>
          </div>
        </Col>
        <Col sm={6} md={2}>
          <div className="bg-white rounded p-3 border text-center">
            <div className={`fs-4 fw-bold ${stats.tauxPresence >= 80 ? 'text-success' : stats.tauxPresence >= 60 ? 'text-warning' : 'text-danger'}`}>
              {stats.tauxPresence}%
            </div>
            <small className="text-muted">Taux présence</small>
          </div>
        </Col>
      </Row>

      {saved && (
        <Alert variant="success" className="d-flex align-items-center">
          <i className="bi bi-check-circle me-2"></i>
          Les présences ont été enregistrées avec succès !
        </Alert>
      )}

      <DataCard
        title={`Appel - ${selectedClasse}`}
        actions={
          <div className="d-flex gap-2">
            <Button variant="outline-success" size="sm" onClick={handleMarkAllPresent}>
              <i className="bi bi-check-all me-1"></i>
              Tous présents
            </Button>
            <Button variant="outline-danger" size="sm" onClick={handleMarkAllAbsent}>
              <i className="bi bi-x-lg me-1"></i>
              Tous absents
            </Button>
          </div>
        }
      >
        <Table responsive hover className="mb-0">
          <thead className="table-light">
            <tr>
              <th style={{ width: '50px' }}>#</th>
              <th>Étudiant</th>
              <th style={{ width: '100px' }} className="text-center">Présent</th>
              <th style={{ width: '100px' }} className="text-center">Retard</th>
              <th style={{ width: '100px' }} className="text-center">Justifié</th>
              <th>Commentaire</th>
              <th style={{ width: '100px' }} className="text-center">Statut</th>
            </tr>
          </thead>
          <tbody>
            {etudiants.map((etudiant, index) => (
              <tr key={etudiant.id} className={!etudiant.present && !etudiant.justifie ? 'table-danger' : etudiant.retard ? 'table-warning' : ''}>
                <td className="text-muted">{index + 1}</td>
                <td>
                  <div className="d-flex align-items-center gap-2">
                    <Avatar name={`${etudiant.prenom} ${etudiant.nom}`} size="sm" />
                    <div>
                      <div className="fw-medium">{etudiant.nom} {etudiant.prenom}</div>
                      <small className="text-muted">{etudiant.matricule}</small>
                    </div>
                  </div>
                </td>
                <td className="text-center">
                  <Form.Check
                    type="checkbox"
                    checked={etudiant.present}
                    onChange={(e) => handlePresenceChange(etudiant.id, 'present', e.target.checked)}
                  />
                </td>
                <td className="text-center">
                  <Form.Check
                    type="checkbox"
                    checked={etudiant.retard}
                    onChange={(e) => handlePresenceChange(etudiant.id, 'retard', e.target.checked)}
                    disabled={!etudiant.present}
                  />
                </td>
                <td className="text-center">
                  <Form.Check
                    type="checkbox"
                    checked={etudiant.justifie}
                    onChange={(e) => handlePresenceChange(etudiant.id, 'justifie', e.target.checked)}
                    disabled={etudiant.present}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    value={etudiant.commentaire}
                    onChange={(e) => handleCommentChange(etudiant.id, e.target.value)}
                    placeholder="Commentaire..."
                  />
                </td>
                <td className="text-center">
                  {etudiant.present ? (
                    etudiant.retard ? (
                      <Badge bg="warning">Retard</Badge>
                    ) : (
                      <Badge bg="success">Présent</Badge>
                    )
                  ) : etudiant.justifie ? (
                    <Badge bg="info">Justifié</Badge>
                  ) : (
                    <Badge bg="danger">Absent</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </DataCard>
    </div>
  );
};

export default PresencesPage;
