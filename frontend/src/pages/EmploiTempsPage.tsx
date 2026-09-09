import React from 'react';
import EmploiTempsPlanning from '../components/emploiTemps/EmploiTempsPlanning';

/** Page legacy MUI - délègue au composant partagé branché API. */
const EmploiTempsPage: React.FC = () => {
  return <EmploiTempsPlanning showTitle />;
};

export default EmploiTempsPage;
