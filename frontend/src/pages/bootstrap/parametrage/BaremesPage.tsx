import React from 'react';
import { PageHeader } from '../../../components/layouts';
import BaremesManagement from '../../../components/parametrage/BaremesManagement';

const BaremesPage: React.FC = () => {
  return (
    <div className="fade-in">
      <PageHeader
        title="Barèmes de notation"
        subtitle="Barèmes et mentions pour l'évaluation"
        breadcrumbs={[
          { label: 'Paramétrage', path: '/admin/parametrage/parametres' },
          { label: 'Barèmes' },
        ]}
      />
      <BaremesManagement showTitle={false} />
    </div>
  );
};

export default BaremesPage;
