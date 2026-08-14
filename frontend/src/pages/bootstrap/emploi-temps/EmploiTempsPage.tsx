import React, { useState } from 'react';
import { Row, Col, Card, Button, Badge, Form, ButtonGroup } from 'react-bootstrap';
import { PageHeader } from '../../../components/layouts';
import { DataCard } from '../../../components/ui';

interface Cours {
  id: number;
  matiere: string;
  enseignant: string;
  salle: string;
  classe: string;
  couleur: string;
}

interface CreneauHoraire {
  heure: string;
  lundi?: Cours;
  mardi?: Cours;
  mercredi?: Cours;
  jeudi?: Cours;
  vendredi?: Cours;
  samedi?: Cours;
}

const EmploiTempsPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'semaine' | 'jour'>('semaine');
  const [selectedClasse, setSelectedClasse] = useState('L3-INFO-A');
  const [currentWeek, setCurrentWeek] = useState('06/01/2026 - 11/01/2026');

  const creneaux: CreneauHoraire[] = [
    {
      heure: '08:00 - 10:00',
      lundi: { id: 1, matiere: 'Algorithmique avancée', enseignant: 'Dr. BOUDA', salle: 'Salle 101', classe: 'L3-INFO-A', couleur: 'primary' },
      mardi: { id: 2, matiere: 'Base de données', enseignant: 'M. OUEDRAOGO', salle: 'Salle 205', classe: 'L3-INFO-A', couleur: 'success' },
      mercredi: { id: 3, matiere: 'Réseaux', enseignant: 'Dr. SANOGO', salle: 'Labo Réseau', classe: 'L3-INFO-A', couleur: 'info' },
      jeudi: { id: 4, matiere: 'Anglais', enseignant: 'Mme BARRY', salle: 'Salle 102', classe: 'L3-INFO-A', couleur: 'warning' },
      vendredi: { id: 5, matiere: 'Projet tutoré', enseignant: 'Dr. BOUDA', salle: 'Labo Info 1', classe: 'L3-INFO-A', couleur: 'danger' },
    },
    {
      heure: '10:15 - 12:15',
      lundi: { id: 6, matiere: 'Programmation Web', enseignant: 'M. KONE', salle: 'Labo Info 2', classe: 'L3-INFO-A', couleur: 'success' },
      mardi: { id: 7, matiere: 'Systèmes d\'exploitation', enseignant: 'Dr. TRAORE', salle: 'Salle 301', classe: 'L3-INFO-A', couleur: 'info' },
      jeudi: { id: 8, matiere: 'Génie logiciel', enseignant: 'M. DIALLO', salle: 'Salle 205', classe: 'L3-INFO-A', couleur: 'primary' },
      vendredi: { id: 9, matiere: 'Mathématiques', enseignant: 'Dr. COULIBALY', salle: 'Amphi A', classe: 'L3-INFO-A', couleur: 'secondary' },
    },
    {
      heure: '14:00 - 16:00',
      lundi: { id: 10, matiere: 'TP Algorithmique', enseignant: 'Dr. BOUDA', salle: 'Labo Info 1', classe: 'L3-INFO-A', couleur: 'primary' },
      mercredi: { id: 11, matiere: 'TP Base de données', enseignant: 'M. OUEDRAOGO', salle: 'Labo Info 2', classe: 'L3-INFO-A', couleur: 'success' },
      vendredi: { id: 12, matiere: 'TP Réseaux', enseignant: 'Dr. SANOGO', salle: 'Labo Réseau', classe: 'L3-INFO-A', couleur: 'info' },
    },
    {
      heure: '16:15 - 18:15',
      mardi: { id: 13, matiere: 'Conférence', enseignant: 'Invité', salle: 'Amphi B', classe: 'L3-INFO-A', couleur: 'dark' },
      jeudi: { id: 14, matiere: 'Travaux dirigés', enseignant: 'M. KONE', salle: 'Salle 102', classe: 'L3-INFO-A', couleur: 'warning' },
    },
  ];

  const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const joursLabels = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  const renderCoursCell = (cours?: Cours) => {
    if (!cours) {
      return <div className="text-center text-muted py-3">-</div>;
    }

    return (
      <Card className={`border-0 bg-${cours.couleur} bg-opacity-10 h-100`}>
        <Card.Body className="p-2">
          <div className={`fw-bold text-${cours.couleur} small`}>{cours.matiere}</div>
          <div className="text-muted" style={{ fontSize: '0.75rem' }}>
            <i className="bi bi-person me-1"></i>{cours.enseignant}
          </div>
          <div className="text-muted" style={{ fontSize: '0.75rem' }}>
            <i className="bi bi-geo-alt me-1"></i>{cours.salle}
          </div>
        </Card.Body>
      </Card>
    );
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Emploi du temps"
        subtitle="Planning des cours et activités"
        breadcrumbs={[
          { label: 'Emploi du temps', path: '/admin/emploi-temps' },
          { label: 'Planning' }
        ]}
        actions={
          <div className="d-flex gap-2">
            <Button variant="outline-primary">
              <i className="bi bi-printer me-2"></i>
              Imprimer
            </Button>
            <Button variant="primary">
              <i className="bi bi-plus-lg me-2"></i>
              Ajouter un cours
            </Button>
          </div>
        }
      />

      {/* Filtres et navigation */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="align-items-center g-3">
            <Col md={3}>
              <Form.Group>
                <Form.Label className="small text-muted mb-1">Classe</Form.Label>
                <Form.Select
                  value={selectedClasse}
                  onChange={(e) => setSelectedClasse(e.target.value)}
                >
                  <option value="L3-INFO-A">L3 Informatique A</option>
                  <option value="L3-INFO-B">L3 Informatique B</option>
                  <option value="L2-INFO-A">L2 Informatique A</option>
                  <option value="L2-GEST">L2 Gestion</option>
                  <option value="M1-INFO">M1 Informatique</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Label className="small text-muted mb-1">Semaine</Form.Label>
              <div className="d-flex align-items-center gap-2">
                <Button variant="outline-secondary" size="sm" onClick={() => setCurrentWeek('30/12/2025 - 04/01/2026')}>
                  <i className="bi bi-chevron-left"></i>
                </Button>
                <span className="fw-medium flex-grow-1 text-center">{currentWeek}</span>
                <Button variant="outline-secondary" size="sm" onClick={() => setCurrentWeek('13/01/2026 - 18/01/2026')}>
                  <i className="bi bi-chevron-right"></i>
                </Button>
              </div>
            </Col>
            <Col md={3}>
              <Form.Label className="small text-muted mb-1">Vue</Form.Label>
              <ButtonGroup className="w-100">
                <Button
                  variant={viewMode === 'semaine' ? 'primary' : 'outline-primary'}
                  onClick={() => setViewMode('semaine')}
                >
                  <i className="bi bi-calendar-week me-1"></i>
                  Semaine
                </Button>
                <Button
                  variant={viewMode === 'jour' ? 'primary' : 'outline-primary'}
                  onClick={() => setViewMode('jour')}
                >
                  <i className="bi bi-calendar-day me-1"></i>
                  Jour
                </Button>
              </ButtonGroup>
            </Col>
            <Col md={2} className="text-end">
              <Form.Label className="small text-muted mb-1 d-block">&nbsp;</Form.Label>
              <Button variant="outline-secondary" onClick={() => setCurrentWeek('06/01/2026 - 11/01/2026')}>
                <i className="bi bi-calendar-check me-1"></i>
                Aujourd'hui
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Grille emploi du temps */}
      <DataCard title={`Emploi du temps - ${selectedClasse}`}>
        <div className="table-responsive">
          <table className="table table-bordered mb-0" style={{ tableLayout: 'fixed' }}>
            <thead className="table-light">
              <tr>
                <th style={{ width: '100px' }} className="text-center">Horaire</th>
                {joursLabels.map((jour, index) => (
                  <th key={index} className="text-center">{jour}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {creneaux.map((creneau, index) => (
                <tr key={index}>
                  <td className="text-center align-middle bg-light">
                    <small className="fw-medium">{creneau.heure}</small>
                  </td>
                  {jours.map((jour) => (
                    <td key={jour} className="p-1" style={{ minHeight: '80px' }}>
                      {renderCoursCell((creneau as any)[jour])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Légende */}
        <div className="mt-4 pt-3 border-top">
          <h6 className="text-muted mb-3">Légende des matières</h6>
          <div className="d-flex flex-wrap gap-3">
            <Badge bg="primary" className="px-3 py-2">Algorithmique</Badge>
            <Badge bg="success" className="px-3 py-2">Base de données / Web</Badge>
            <Badge bg="info" className="px-3 py-2">Réseaux</Badge>
            <Badge bg="warning" className="px-3 py-2">Langues / TD</Badge>
            <Badge bg="danger" className="px-3 py-2">Projets</Badge>
            <Badge bg="secondary" className="px-3 py-2">Mathématiques</Badge>
            <Badge bg="dark" className="px-3 py-2">Conférences</Badge>
          </div>
        </div>
      </DataCard>
    </div>
  );
};

export default EmploiTempsPage;
