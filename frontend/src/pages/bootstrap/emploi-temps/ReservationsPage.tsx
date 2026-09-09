import React from 'react';
import { PageHeader } from '../../../components/layouts';
import ReservationsManagement from '../../../components/emploiTemps/ReservationsManagement';

const ReservationsPage: React.FC = () => {
  return (
    <div className="fade-in">
      <PageHeader
        title="Réservations de salles"
        subtitle="Demandes ponctuelles et workflow d'approbation"
        breadcrumbs={[
          { label: 'Emploi du temps', path: '/admin/emploi-temps' },
          { label: 'Réservations' },
        ]}
      />
      <ReservationsManagement showTitle={false} />
    </div>
  );
};

export default ReservationsPage;
