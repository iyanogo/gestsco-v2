import React from 'react';
import { PageHeader } from '../../../components/layouts';
import EmploiTempsPlanning from '../../../components/emploiTemps/EmploiTempsPlanning';

const EmploiTempsPage: React.FC = () => {
  return (
    <div className="fade-in">
      <PageHeader
        title="Emploi du temps"
        subtitle="Planning des cours et activités"
        breadcrumbs={[
          { label: 'Emploi du temps', path: '/admin/emploi-temps' },
          { label: 'Planning' },
        ]}
      />

      <EmploiTempsPlanning showTitle={false} />
    </div>
  );
};

export default EmploiTempsPage;
