import React from 'react';
import { PageHeader } from '../../components/layouts';
import MonEmploiTemps from '../../components/emploiTemps/MonEmploiTemps';

const TeacherEmploiTempsPage: React.FC = () => (
  <div className="fade-in">
    <PageHeader
      title="Mon emploi du temps"
      subtitle="Planning hebdomadaire de vos séances"
      breadcrumbs={[
        { label: 'Tableau de bord', path: '/enseignant/dashboard' },
        { label: 'Emploi du temps' },
      ]}
    />
    <MonEmploiTemps userRole="enseignant" />
  </div>
);

export default TeacherEmploiTempsPage;
