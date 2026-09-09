import React from 'react';
import { PageHeader } from '../../../components/layouts';
import PaysConfigManagement from '../../../components/parametrage/PaysConfigManagement';

const PaysConfigPage: React.FC = () => {
  return (
    <div className="fade-in">
      <PageHeader
        title="Configurations pays"
        subtitle="Paramètres régionaux et systèmes éducatifs"
        breadcrumbs={[
          { label: 'Paramétrage', path: '/admin/parametrage/parametres' },
          { label: 'Pays' },
        ]}
      />
      <PaysConfigManagement showTitle={false} />
    </div>
  );
};

export default PaysConfigPage;
