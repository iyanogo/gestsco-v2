import React from 'react';
import PresencesManagement from '../components/emploiTemps/PresencesManagement';

/** Page legacy MUI - délègue au composant partagé branché API. */
const PresencesPage: React.FC = () => {
  return <PresencesManagement showTitle />;
};

export default PresencesPage;
