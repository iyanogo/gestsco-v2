import React from 'react';
import { PageHeader } from '../../../components/layouts';
import PresencesManagement from '../../../components/emploiTemps/PresencesManagement';

const PresencesPage: React.FC = () => {
  return (
    <div className="fade-in">
      <PageHeader
        title="Appel / Présences"
        subtitle="Feuille d'appel par séance"
        breadcrumbs={[
          { label: 'Présences', path: '/admin/presences/appel' },
          { label: 'Appel' },
        ]}
      />
      <PresencesManagement showTitle={false} initialTab={0} />
    </div>
  );
};

export default PresencesPage;
