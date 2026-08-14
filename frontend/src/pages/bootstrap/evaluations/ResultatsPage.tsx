import React, { useState } from 'react';
import { Row, Col, Button, Badge, Form, Card, Table, ProgressBar } from 'react-bootstrap';
import { PageHeader } from '../../../components/layouts';
import { DataCard, Avatar } from '../../../components/ui';

interface ResultatEtudiant {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  moyenne: number;
  credits: number;
  totalCredits: number;
  rang: number;
  decision: 'admis' | 'rattrapage' | 'redouble' | 'en_attente';
}

const ResultatsPage: React.FC = () => {
  const [selectedClasse, setSelectedClasse] = useState('L3-INFO-A');
  const [selectedSemestre, setSelectedSemestre] = useState('S1');

  const resultats: ResultatEtudiant[] = [
    { id: 1, matricule: '2024-0125', nom: 'DIALLO', prenom: 'Amadou', moyenne: 14.5, credits: 28, totalCredits: 30, rang: 3, decision: 'admis' },
    { id: 2, matricule: '2024-0126', nom: 'TRAORE', prenom: 'Fatou', moyenne: 15.8, credits: 30, totalCredits: 30, rang: 1, decision: 'admis' },
    { id: 3, matricule: '2024-0127', nom: 'KONE', prenom: 'Ibrahim', moyenne: 8.5, credits: 12, totalCredits: 30, rang: 8, decision: 'rattrapage' },
    { id: 4, matricule: '2024-0128', nom: 'OUEDRAOGO', prenom: 'Aïcha', moyenne: 15.2, credits: 30, totalCredits: 30, rang: 2, decision: 'admis' },
    { id: 5, matricule: '2024-0129', nom: 'SANOGO', prenom: 'Moussa', moyenne: 11.2, credits: 22, totalCredits: 30, rang: 6, decision: 'admis' },
    { id: 6, matricule: '2024-0130', nom: 'BARRY', prenom: 'Mariama', moyenne: 13.8, credits: 26, totalCredits: 30, rang: 4, decision: 'admis' },
    { id: 7, matricule: '2024-0131', nom: 'COULIBALY', prenom: 'Seydou', moyenne: 12.5, credits: 24, totalCredits: 30, rang: 5, decision: 'admis' },
    { id: 8, matricule: '2024-0132', nom: 'DIARRA', prenom: 'Aminata', moyenne: 9.8, credits: 18, totalCredits: 30, rang: 7, decision: 'rattrapage' },
  ];

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case 'admis':
        return <Badge bg="success">Admis</Badge>;
      case 'rattrapage':
        return <Badge bg="warning">Rattrapage</Badge>;
      case 'redouble':
        return <Badge bg="danger">Redouble</Badge>;
      case 'en_attente':
        return <Badge bg="secondary">En attente</Badge>;
      default:
        return <Badge bg="secondary">{decision}</Badge>;
    }
  };

  const getMoyenneColor = (moyenne: number) => {
    if (moyenne >= 14) return 'success';
    if (moyenne >= 12) return 'info';
    if (moyenne >= 10) return 'warning';
    return 'danger';
  };

  // Statistiques
  const stats = {
    total: resultats.length,
    admis: resultats.filter(r => r.decision === 'admis').length,
    rattrapage: resultats.filter(r => r.decision === 'rattrapage').length,
    moyenne: resultats.reduce((sum, r) => sum + r.moyenne, 0) / resultats.length,
    tauxReussite: (resultats.filter(r => r.decision === 'admis').length / resultats.length) * 100
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Résultats"
        subtitle="Consultation des résultats par classe"
        breadcrumbs={[
          { label: 'Évaluations', path: '/admin/evaluations' },
          { label: 'Résultats' }
        ]}
        actions={
          <div className="d-flex gap-2">
            <Button variant="outline-primary">
              <i className="bi bi-download me-2"></i>
              Exporter
            </Button>
            <Button variant="primary">
              <i className="bi bi-printer me-2"></i>
              Imprimer PV
            </Button>
          </div>
        }
      />

      {/* Filtres */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col md={4}>
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
                <Form.Label>Semestre</Form.Label>
                <Form.Select
                  value={selectedSemestre}
                  onChange={(e) => setSelectedSemestre(e.target.value)}
                >
                  <option value="S1">Semestre 1</option>
                  <option value="S2">Semestre 2</option>
                  <option value="annuel">Annuel</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Année académique</Form.Label>
                <Form.Select defaultValue="2025-2026">
                  <option value="2025-2026">2025-2026</option>
                  <option value="2024-2025">2024-2025</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Button variant="primary" className="w-100">
                <i className="bi bi-search me-1"></i>
                Afficher
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Statistiques */}
      <Row className="g-3 mb-4">
        <Col sm={6} lg={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <div className="fs-3 fw-bold text-primary">{stats.total}</div>
              <small className="text-muted">Étudiants</small>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={6} lg={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <div className="fs-3 fw-bold text-success">{stats.admis}</div>
              <small className="text-muted">Admis</small>
              <ProgressBar 
                now={stats.tauxReussite} 
                variant="success" 
                className="mt-2" 
                style={{ height: '6px' }}
              />
            </Card.Body>
          </Card>
        </Col>
        <Col sm={6} lg={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <div className="fs-3 fw-bold text-warning">{stats.rattrapage}</div>
              <small className="text-muted">Rattrapage</small>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={6} lg={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <div className={`fs-3 fw-bold text-${getMoyenneColor(stats.moyenne)}`}>
                {stats.moyenne.toFixed(2)}/20
              </div>
              <small className="text-muted">Moyenne classe</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tableau des résultats */}
      <DataCard title={`Résultats - ${selectedClasse} - ${selectedSemestre}`}>
        <Table responsive hover className="mb-0">
          <thead className="table-light">
            <tr>
              <th style={{ width: '60px' }}>Rang</th>
              <th>Étudiant</th>
              <th style={{ width: '120px' }}>Matricule</th>
              <th style={{ width: '120px' }} className="text-center">Moyenne</th>
              <th style={{ width: '150px' }} className="text-center">Crédits</th>
              <th style={{ width: '120px' }} className="text-center">Décision</th>
              <th style={{ width: '100px' }} className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {resultats.sort((a, b) => a.rang - b.rang).map((etudiant) => (
              <tr key={etudiant.id}>
                <td className="text-center">
                  {etudiant.rang <= 3 ? (
                    <Badge bg={etudiant.rang === 1 ? 'warning' : etudiant.rang === 2 ? 'secondary' : 'danger'} className="px-2">
                      {etudiant.rang === 1 ? '🥇' : etudiant.rang === 2 ? '🥈' : '🥉'} {etudiant.rang}
                    </Badge>
                  ) : (
                    <span className="text-muted">{etudiant.rang}</span>
                  )}
                </td>
                <td>
                  <div className="d-flex align-items-center gap-2">
                    <Avatar name={`${etudiant.prenom} ${etudiant.nom}`} size="sm" />
                    <span className="fw-medium">{etudiant.nom} {etudiant.prenom}</span>
                  </div>
                </td>
                <td><code>{etudiant.matricule}</code></td>
                <td className="text-center">
                  <span className={`fw-bold text-${getMoyenneColor(etudiant.moyenne)}`}>
                    {etudiant.moyenne.toFixed(2)}/20
                  </span>
                </td>
                <td>
                  <div className="d-flex align-items-center gap-2">
                    <ProgressBar 
                      now={(etudiant.credits / etudiant.totalCredits) * 100}
                      variant={etudiant.credits === etudiant.totalCredits ? 'success' : 'info'}
                      style={{ height: '8px', flex: 1 }}
                    />
                    <small className="text-muted">{etudiant.credits}/{etudiant.totalCredits}</small>
                  </div>
                </td>
                <td className="text-center">{getDecisionBadge(etudiant.decision)}</td>
                <td className="text-center">
                  <Button size="sm" variant="outline-primary" title="Voir détails">
                    <i className="bi bi-eye"></i>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </DataCard>
    </div>
  );
};

export default ResultatsPage;
