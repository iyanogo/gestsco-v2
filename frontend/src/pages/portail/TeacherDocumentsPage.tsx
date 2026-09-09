import React from 'react';
import { Card, Col, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/layouts';

const DOC_LINKS = [
  {
    title: 'Stages encadrés',
    description: 'Consultez les rapports et informations de vos stages encadrés.',
    icon: 'briefcase',
    path: '/enseignant/stages',
    variant: 'primary',
  },
  {
    title: 'Résultats de mes matières',
    description: 'Relevés nominatifs et statistiques par session d\'examen.',
    icon: 'graph-up',
    path: '/enseignant/resultats',
    variant: 'success',
  },
  {
    title: 'Historique des notes',
    description: 'Consultation en lecture seule des résultats publiés.',
    icon: 'clock-history',
    path: '/enseignant/notes/historique',
    variant: 'info',
  },
  {
    title: 'Feuille d\'appel',
    description: 'Historique et émargement des séances.',
    icon: 'clipboard-check',
    path: '/enseignant/presences/historique',
    variant: 'secondary',
  },
] as const;

const TeacherDocumentsPage: React.FC = () => (
  <div className="fade-in">
    <PageHeader
      title="Documents"
      subtitle="Accès rapide à vos ressources pédagogiques"
      breadcrumbs={[
        { label: 'Tableau de bord', path: '/enseignant/dashboard' },
        { label: 'Documents' },
      ]}
    />

    <Row className="g-4">
      {DOC_LINKS.map((item) => (
        <Col key={item.path} md={6} xl={3}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="d-flex flex-column">
              <div className={`text-${item.variant} mb-3`}>
                <i className={`bi bi-${item.icon} fs-2`}></i>
              </div>
              <Card.Title className="h6">{item.title}</Card.Title>
              <Card.Text className="text-muted small flex-grow-1">{item.description}</Card.Text>
              <Link to={item.path} className={`btn btn-outline-${item.variant} btn-sm mt-2`}>
                Accéder
              </Link>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>

    <Card className="mt-4 border-0 bg-light">
      <Card.Body>
        <Card.Title className="h6 mb-2">
          <i className="bi bi-info-circle me-2"></i>
          À propos
        </Card.Title>
        <Card.Text className="text-muted small mb-0">
          Les procès-verbaux de soutenance sont générés depuis la fiche stage (espace
          administration). Contactez la scolarité pour tout document institutionnel
          supplémentaire.
        </Card.Text>
      </Card.Body>
    </Card>
  </div>
);

export default TeacherDocumentsPage;
