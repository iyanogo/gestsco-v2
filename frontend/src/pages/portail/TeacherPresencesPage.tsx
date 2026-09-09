import React from 'react';
import { PageHeader } from '../../components/layouts';
import PresencesManagement from '../../components/emploiTemps/PresencesManagement';

const TeacherPresencesPage: React.FC = () => (
  <div className="fade-in">
    <PageHeader
      title="Feuille d'appel"
      subtitle="Émargement pour vos séances - lecture et saisie limitées à votre périmètre"
      breadcrumbs={[
        { label: 'Tableau de bord', path: '/enseignant/dashboard' },
        { label: "Feuille d'appel" },
      ]}
    />
    <PresencesManagement showTitle={false} initialTab={0} portalMode="teacher" />
  </div>
);

export default TeacherPresencesPage;
