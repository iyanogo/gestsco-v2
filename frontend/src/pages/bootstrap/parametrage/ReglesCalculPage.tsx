import React from 'react';
import { PageHeader } from '../../../components/layouts';
import ReglesCalculManagement from '../../../components/parametrage/ReglesCalculManagement';

const ReglesCalculPage: React.FC = () => {
  return (
    <div className="fade-in">
      <PageHeader
        title="Règles de calcul"
        subtitle="Formules de moyennes, mentions et délibération"
        breadcrumbs={[
          { label: 'Paramétrage', path: '/admin/parametrage/parametres' },
          { label: 'Règles de calcul' },
        ]}
      />
      <ReglesCalculManagement showTitle={false} />
    </div>
  );
};

export default ReglesCalculPage;
