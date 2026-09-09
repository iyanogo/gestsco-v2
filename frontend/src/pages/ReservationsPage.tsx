import React from 'react';
import ReservationsManagement from '../components/emploiTemps/ReservationsManagement';

/** Page legacy MUI - délègue au composant partagé branché API. */
const ReservationsPage: React.FC = () => {
  return <ReservationsManagement showTitle />;
};

export default ReservationsPage;
