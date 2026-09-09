import React from 'react';
import { Card, Col, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/layouts';

const DOC_LINKS = [
  {
    title: 'Mon dossier administratif',
    description: 'Pièces justificatives déposées (acte de naissance, bac, photo…).',
    icon: 'folder2-open',
    path: '/etudiant/documents/dossier',
    variant: 'primary',
  },
  {
    title: 'Mes bulletins',
    description: 'Bulletins semestriels et annuels avec téléchargement PDF.',
    icon: 'file-earmark-text',
    path: '/etudiant/bulletins',
    variant: 'primary',
  },
  {
    title: 'Relevés de notes',
    description: 'Historique complet de vos résultats par année.',
    icon: 'file-text',
    path: '/etudiant/releves',
    variant: 'success',
  },
  {
    title: 'Mes factures',
    description: 'Consultation et téléchargement de vos factures.',
    icon: 'receipt',
    path: '/etudiant/finances/factures',
    variant: 'info',
  },
  {
    title: 'Mon compte',
    description: 'Situation financière et relevé de compte.',
    icon: 'cash-stack',
    path: '/etudiant/finances/compte',
    variant: 'warning',
  },
  {
    title: 'Mon stage',
    description: 'Informations sur votre stage en cours ou passé.',
    icon: 'briefcase',
    path: '/etudiant/stages',
    variant: 'secondary',
  },
  {
    title: 'Mes résultats',
    description: 'Synthèse de vos moyennes et crédits.',
    icon: 'graph-up',
    path: '/etudiant/notes',
    variant: 'dark',
  },
] as const;

const StudentDocumentsPage: React.FC = () => (
  <div className="fade-in">
    <PageHeader
      title="Mes documents"
      subtitle="Accès rapide à vos documents académiques et administratifs"
      breadcrumbs={[
        { label: 'Tableau de bord', path: '/etudiant/dashboard' },
        { label: 'Mes documents' },
      ]}
    />

    <Row className="g-4">
      {DOC_LINKS.map((item) => (
        <Col key={item.path} md={6} xl={4}>
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
          Les attestations de réussite sont disponibles auprès de la scolarité une fois
          votre année validée. Les bulletins PDF sont générés à partir de vos résultats
          officiels publiés en base.
        </Card.Text>
      </Card.Body>
    </Card>
  </div>
);

export default StudentDocumentsPage;
