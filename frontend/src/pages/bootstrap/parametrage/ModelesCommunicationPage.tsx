import React from 'react';
import { PageHeader } from '../../../components/layouts';
import ModelesCommunicationManagement from '../../../components/parametrage/ModelesCommunicationManagement';

const ModelesCommunicationPage: React.FC = () => {
  return (
    <div className="fade-in">
      <PageHeader
        title="Modèles email & SMS"
        subtitle="Templates de communication automatisée"
        breadcrumbs={[
          { label: 'Paramétrage', path: '/admin/parametrage/parametres' },
          { label: 'Modèles communication' },
        ]}
      />
      <ModelesCommunicationManagement showTitle={false} />
    </div>
  );
};

export default ModelesCommunicationPage;
