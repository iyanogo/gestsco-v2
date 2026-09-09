import React from 'react';
import { PageHeader } from '../../../components/layouts';
import TemplatesManagement from '../../../components/parametrage/TemplatesManagement';

const TemplatesListPage: React.FC = () => {
  return (
    <div className="fade-in">
      <PageHeader
        title="Templates de documents"
        subtitle="Modèles HTML pour bulletins, attestations, factures…"
        breadcrumbs={[
          { label: 'Documents', path: '/admin/documents/liste' },
          { label: 'Templates' },
        ]}
      />

      <TemplatesManagement showTitle={false} />
    </div>
  );
};

export default TemplatesListPage;
