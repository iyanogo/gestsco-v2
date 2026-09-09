import React from 'react';
import { PageHeader } from '../../../components/layouts';
import PresencesManagement from '../../../components/emploiTemps/PresencesManagement';

const StatistiquesPresencesPage: React.FC = () => {
  return (
    <div className="fade-in">
      <PageHeader
        title="Statistiques de présence"
        subtitle="Taux par étudiant et absents fréquents"
        breadcrumbs={[
          { label: 'Présences', path: '/admin/presences/appel' },
          { label: 'Statistiques' },
        ]}
      />
      <PresencesManagement showTitle={false} initialTab={1} />
    </div>
  );
};

export default StatistiquesPresencesPage;
