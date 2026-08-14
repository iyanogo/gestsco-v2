import React, { useState } from 'react';
import { Row, Col, Card, Button, Form, Table, ProgressBar } from 'react-bootstrap';
import { PageHeader } from '../../../components/layouts';
import { DataCard, Avatar } from '../../../components/ui';

interface StatEtudiant {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  totalSeances: number;
  presences: number;
  absences: number;
  absencesJustifiees: number;
  retards: number;
  tauxPresence: number;
}

const StatistiquesPresencesPage: React.FC = () => {
  const [selectedClasse, setSelectedClasse] = useState('L3-INFO-A');
  const [selectedPeriode, setSelectedPeriode] = useState('semestre');

  const statistiques: StatEtudiant[] = [
    { id: 1, matricule: '2024-0125', nom: 'DIALLO', prenom: 'Amadou', totalSeances: 45, presences: 42, absences: 3, absencesJustifiees: 1, retards: 2, tauxPresence: 93 },
    { id: 2, matricule: '2024-0126', nom: 'TRAORE', prenom: 'Fatou', totalSeances: 45, presences: 45, absences: 0, absencesJustifiees: 0, retards: 0, tauxPresence: 100 },
    { id: 3, matricule: '2024-0127', nom: 'KONE', prenom: 'Ibrahim', totalSeances: 45, presences: 32, absences: 13, absencesJustifiees: 5, retards: 4, tauxPresence: 71 },
    { id: 4, matricule: '2024-0128', nom: 'OUEDRAOGO', prenom: 'Aïcha', totalSeances: 45, presences: 40, absences: 5, absencesJustifiees: 3, retards: 6, tauxPresence: 89 },
    { id: 5, matricule: '2024-0129', nom: 'SANOGO', prenom: 'Moussa', totalSeances: 45, presences: 38, absences: 7, absencesJustifiees: 2, retards: 3, tauxPresence: 84 },
    { id: 6, matricule: '2024-0130', nom: 'BARRY', prenom: 'Mariama', totalSeances: 45, presences: 44, absences: 1, absencesJustifiees: 1, retards: 1, tauxPresence: 98 },
    { id: 7, matricule: '2024-0131', nom: 'COULIBALY', prenom: 'Seydou', totalSeances: 45, presences: 41, absences: 4, absencesJustifiees: 2, retards: 2, tauxPresence: 91 },
    { id: 8, matricule: '2024-0132', nom: 'DIARRA', prenom: 'Aminata', totalSeances: 45, presences: 25, absences: 20, absencesJustifiees: 8, retards: 5, tauxPresence: 56 },
  ];

  const getTauxColor = (taux: number) => {
    if (taux >= 90) return 'success';
    if (taux >= 75) return 'info';
    if (taux >= 60) return 'warning';
    return 'danger';
  };

  // Statistiques globales
  const globalStats = {
    moyenneTaux: Math.round(statistiques.reduce((sum, s) => sum + s.tauxPresence, 0) / statistiques.length),
    totalAbsences: statistiques.reduce((sum, s) => sum + s.absences, 0),
    totalRetards: statistiques.reduce((sum, s) => sum + s.retards, 0),
    etudiantsEnAlerte: statistiques.filter(s => s.tauxPresence < 75).length
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Statistiques de présences"
        subtitle="Analyse des présences par classe et période"
        breadcrumbs={[
          { label: 'Présences', path: '/admin/presences' },
          { label: 'Statistiques' }
        ]}
        actions={
          <div className="d-flex gap-2">
            <Button variant="outline-primary">
              <i className="bi bi-download me-2"></i>
              Exporter PDF
            </Button>
            <Button variant="outline-success">
              <i className="bi bi-file-excel me-2"></i>
              Exporter Excel
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
            <Col md={4}>
              <Form.Group>
                <Form.Label>Période</Form.Label>
                <Form.Select
                  value={selectedPeriode}
                  onChange={(e) => setSelectedPeriode(e.target.value)}
                >
                  <option value="semaine">Cette semaine</option>
                  <option value="mois">Ce mois</option>
                  <option value="semestre">Ce semestre</option>
                  <option value="annee">Cette année</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Button variant="primary" className="w-100">
                <i className="bi bi-search me-2"></i>
                Afficher
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Statistiques globales */}
      <Row className="g-3 mb-4">
        <Col sm={6} lg={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <div className={`fs-2 fw-bold text-${getTauxColor(globalStats.moyenneTaux)}`}>
                {globalStats.moyenneTaux}%
              </div>
              <small className="text-muted">Taux moyen de présence</small>
              <ProgressBar 
                now={globalStats.moyenneTaux} 
                variant={getTauxColor(globalStats.moyenneTaux)} 
                className="mt-2" 
                style={{ height: '8px' }}
              />
            </Card.Body>
          </Card>
        </Col>
        <Col sm={6} lg={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <div className="fs-2 fw-bold text-danger">{globalStats.totalAbsences}</div>
              <small className="text-muted">Total absences</small>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={6} lg={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <div className="fs-2 fw-bold text-warning">{globalStats.totalRetards}</div>
              <small className="text-muted">Total retards</small>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={6} lg={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <div className="fs-2 fw-bold text-danger">{globalStats.etudiantsEnAlerte}</div>
              <small className="text-muted">Étudiants en alerte (&lt;75%)</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tableau détaillé */}
      <DataCard title={`Détail par étudiant - ${selectedClasse}`}>
        <Table responsive hover className="mb-0">
          <thead className="table-light">
            <tr>
              <th>Étudiant</th>
              <th className="text-center">Séances</th>
              <th className="text-center">Présences</th>
              <th className="text-center">Absences</th>
              <th className="text-center">Justifiées</th>
              <th className="text-center">Retards</th>
              <th style={{ width: '200px' }}>Taux de présence</th>
            </tr>
          </thead>
          <tbody>
            {statistiques.sort((a, b) => b.tauxPresence - a.tauxPresence).map((etudiant) => (
              <tr key={etudiant.id} className={etudiant.tauxPresence < 75 ? 'table-danger' : ''}>
                <td>
                  <div className="d-flex align-items-center gap-2">
                    <Avatar name={`${etudiant.prenom} ${etudiant.nom}`} size="sm" />
                    <div>
                      <div className="fw-medium">{etudiant.nom} {etudiant.prenom}</div>
                      <small className="text-muted">{etudiant.matricule}</small>
                    </div>
                  </div>
                </td>
                <td className="text-center">{etudiant.totalSeances}</td>
                <td className="text-center text-success fw-medium">{etudiant.presences}</td>
                <td className="text-center text-danger fw-medium">{etudiant.absences}</td>
                <td className="text-center text-info">{etudiant.absencesJustifiees}</td>
                <td className="text-center text-warning">{etudiant.retards}</td>
                <td>
                  <div className="d-flex align-items-center gap-2">
                    <ProgressBar 
                      now={etudiant.tauxPresence} 
                      variant={getTauxColor(etudiant.tauxPresence)}
                      style={{ height: '10px', flex: 1 }}
                    />
                    <span className={`fw-bold text-${getTauxColor(etudiant.tauxPresence)}`} style={{ minWidth: '45px' }}>
                      {etudiant.tauxPresence}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </DataCard>
    </div>
  );
};

export default StatistiquesPresencesPage;
