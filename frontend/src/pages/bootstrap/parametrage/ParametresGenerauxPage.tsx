import React from 'react';
import { Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../../components/layouts';
import ParametrageGenerauxManagement from '../../../components/parametrage/ParametrageGenerauxManagement';

const ParametresGenerauxPage: React.FC = () => {
  return (
    <div className="fade-in">
      <PageHeader
        title="Paramètres généraux"
        subtitle="Paramètres système et configuration de l'établissement"
        breadcrumbs={[
          { label: 'Paramétrage', path: '/admin/parametrage/parametres' },
          { label: 'Paramètres généraux' },
        ]}
      />

      <Alert variant="info" className="mb-3">
        <i className="bi bi-info-circle me-2" />
        Les années académiques LMD (semestres, campagnes) se gèrent séparément dans{' '}
        <Link to="/admin/gestion-annees">Gestion des années LMD</Link>.
        Les années scolaires (référentiel) sont dans{' '}
        <Link to="/admin/parametrage/annees-scolaires">Années scolaires</Link>.
      </Alert>

      <ParametrageGenerauxManagement showTitle={false} />
    </div>
  );
};

export default ParametresGenerauxPage;
