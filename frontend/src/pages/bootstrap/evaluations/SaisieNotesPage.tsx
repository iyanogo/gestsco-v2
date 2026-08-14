import React, { useState, useEffect } from 'react';
import { Row, Col, Button, Badge, Form, Card, Table, Alert } from 'react-bootstrap';
import { PageHeader } from '../../../components/layouts';
import { DataCard } from '../../../components/ui';

interface Etudiant {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  note?: number;
  absent: boolean;
}

const SaisieNotesPage: React.FC = () => {
  const [selectedMatiere, setSelectedMatiere] = useState('');
  const [selectedClasse, setSelectedClasse] = useState('');
  const [selectedTypeEval, setSelectedTypeEval] = useState('');
  const [etudiants, setEtudiants] = useState<Etudiant[]>([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const loadEtudiants = () => {
    if (!selectedMatiere || !selectedClasse || !selectedTypeEval) return;
    
    setLoading(true);
    setTimeout(() => {
      setEtudiants([
        { id: 1, matricule: '2024-0125', nom: 'DIALLO', prenom: 'Amadou', note: 15, absent: false },
        { id: 2, matricule: '2024-0126', nom: 'TRAORE', prenom: 'Fatou', note: 16, absent: false },
        { id: 3, matricule: '2024-0127', nom: 'KONE', prenom: 'Ibrahim', note: undefined, absent: true },
        { id: 4, matricule: '2024-0128', nom: 'OUEDRAOGO', prenom: 'Aïcha', note: 14, absent: false },
        { id: 5, matricule: '2024-0129', nom: 'SANOGO', prenom: 'Moussa', note: 12, absent: false },
        { id: 6, matricule: '2024-0130', nom: 'BARRY', prenom: 'Mariama', note: 17, absent: false },
        { id: 7, matricule: '2024-0131', nom: 'COULIBALY', prenom: 'Seydou', note: 13, absent: false },
        { id: 8, matricule: '2024-0132', nom: 'DIARRA', prenom: 'Aminata', note: undefined, absent: false },
      ]);
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    loadEtudiants();
  }, [selectedMatiere, selectedClasse, selectedTypeEval]);

  const handleNoteChange = (id: number, value: string) => {
    const note = value === '' ? undefined : parseFloat(value);
    setEtudiants(prev => prev.map(e => 
      e.id === id ? { ...e, note: note, absent: false } : e
    ));
    setSaved(false);
  };

  const handleAbsentChange = (id: number, absent: boolean) => {
    setEtudiants(prev => prev.map(e => 
      e.id === id ? { ...e, absent, note: absent ? undefined : e.note } : e
    ));
    setSaved(false);
  };

  const handleSave = () => {
    console.log('Saving notes:', etudiants);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const getStats = () => {
    const notesValides = etudiants.filter(e => e.note !== undefined && !e.absent);
    const absents = etudiants.filter(e => e.absent).length;
    const moyenne = notesValides.length > 0 
      ? notesValides.reduce((sum, e) => sum + (e.note || 0), 0) / notesValides.length 
      : 0;
    const reussite = notesValides.filter(e => (e.note || 0) >= 10).length;
    
    return { notesValides: notesValides.length, absents, moyenne, reussite };
  };

  const stats = getStats();

  return (
    <div className="fade-in">
      <PageHeader
        title="Saisie des notes"
        subtitle="Enregistrement des notes d'évaluation"
        breadcrumbs={[
          { label: 'Évaluations', path: '/admin/evaluations' },
          { label: 'Saisie des notes' }
        ]}
      />

      {/* Sélection */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={3}>
              <Form.Group>
                <Form.Label>Classe *</Form.Label>
                <Form.Select
                  value={selectedClasse}
                  onChange={(e) => setSelectedClasse(e.target.value)}
                >
                  <option value="">Sélectionner une classe</option>
                  <option value="L3-INFO-A">L3 Informatique A</option>
                  <option value="L3-INFO-B">L3 Informatique B</option>
                  <option value="L2-INFO-A">L2 Informatique A</option>
                  <option value="M1-INFO">M1 Informatique</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Matière *</Form.Label>
                <Form.Select
                  value={selectedMatiere}
                  onChange={(e) => setSelectedMatiere(e.target.value)}
                >
                  <option value="">Sélectionner une matière</option>
                  <option value="algo">Algorithmique avancée</option>
                  <option value="bdd">Base de données</option>
                  <option value="web">Programmation Web</option>
                  <option value="reseaux">Réseaux</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Type d'évaluation *</Form.Label>
                <Form.Select
                  value={selectedTypeEval}
                  onChange={(e) => setSelectedTypeEval(e.target.value)}
                >
                  <option value="">Sélectionner un type</option>
                  <option value="examen">Examen</option>
                  <option value="controle">Contrôle continu</option>
                  <option value="tp">TP</option>
                  <option value="projet">Projet</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Session</Form.Label>
                <Form.Select defaultValue="normale">
                  <option value="normale">Session normale</option>
                  <option value="rattrapage">Rattrapage</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {selectedMatiere && selectedClasse && selectedTypeEval && (
        <>
          {/* Statistiques */}
          <Row className="g-3 mb-4">
            <Col sm={6} md={3}>
              <div className="bg-white rounded p-3 border text-center">
                <div className="fs-4 fw-bold text-primary">{etudiants.length}</div>
                <small className="text-muted">Étudiants</small>
              </div>
            </Col>
            <Col sm={6} md={3}>
              <div className="bg-white rounded p-3 border text-center">
                <div className="fs-4 fw-bold text-success">{stats.notesValides}</div>
                <small className="text-muted">Notes saisies</small>
              </div>
            </Col>
            <Col sm={6} md={3}>
              <div className="bg-white rounded p-3 border text-center">
                <div className="fs-4 fw-bold text-info">{stats.moyenne.toFixed(2)}/20</div>
                <small className="text-muted">Moyenne</small>
              </div>
            </Col>
            <Col sm={6} md={3}>
              <div className="bg-white rounded p-3 border text-center">
                <div className="fs-4 fw-bold text-warning">{stats.absents}</div>
                <small className="text-muted">Absents</small>
              </div>
            </Col>
          </Row>

          {saved && (
            <Alert variant="success" className="d-flex align-items-center">
              <i className="bi bi-check-circle me-2"></i>
              Les notes ont été enregistrées avec succès !
            </Alert>
          )}

          <DataCard
            title="Saisie des notes"
            actions={
              <div className="d-flex gap-2">
                <Button variant="outline-secondary" onClick={loadEtudiants}>
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Actualiser
                </Button>
                <Button variant="success" onClick={handleSave}>
                  <i className="bi bi-check-lg me-2"></i>
                  Enregistrer
                </Button>
              </div>
            }
          >
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </div>
              </div>
            ) : (
              <Table responsive hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '50px' }}>#</th>
                    <th style={{ width: '120px' }}>Matricule</th>
                    <th>Nom et Prénom</th>
                    <th style={{ width: '150px' }} className="text-center">Note /20</th>
                    <th style={{ width: '100px' }} className="text-center">Absent</th>
                    <th style={{ width: '100px' }} className="text-center">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {etudiants.map((etudiant, index) => (
                    <tr key={etudiant.id} className={etudiant.absent ? 'table-warning' : ''}>
                      <td className="text-muted">{index + 1}</td>
                      <td><code>{etudiant.matricule}</code></td>
                      <td className="fw-medium">{etudiant.nom} {etudiant.prenom}</td>
                      <td>
                        <Form.Control
                          type="number"
                          min={0}
                          max={20}
                          step={0.25}
                          value={etudiant.note ?? ''}
                          onChange={(e) => handleNoteChange(etudiant.id, e.target.value)}
                          disabled={etudiant.absent}
                          className="text-center"
                          placeholder="-"
                        />
                      </td>
                      <td className="text-center">
                        <Form.Check
                          type="checkbox"
                          checked={etudiant.absent}
                          onChange={(e) => handleAbsentChange(etudiant.id, e.target.checked)}
                        />
                      </td>
                      <td className="text-center">
                        {etudiant.absent ? (
                          <Badge bg="warning">Absent</Badge>
                        ) : etudiant.note !== undefined ? (
                          <Badge bg={etudiant.note >= 10 ? 'success' : 'danger'}>
                            {etudiant.note >= 10 ? 'Validé' : 'Non validé'}
                          </Badge>
                        ) : (
                          <Badge bg="secondary">En attente</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </DataCard>
        </>
      )}

      {(!selectedMatiere || !selectedClasse || !selectedTypeEval) && (
        <Card className="border-0 shadow-sm">
          <Card.Body className="text-center py-5">
            <i className="bi bi-pencil-square fs-1 text-muted mb-3 d-block"></i>
            <h5 className="text-muted">Sélectionnez les critères</h5>
            <p className="text-muted mb-0">
              Veuillez sélectionner une classe, une matière et un type d'évaluation pour commencer la saisie des notes.
            </p>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default SaisieNotesPage;
