/**
 * Page d'inscription par groupe via fichier Excel
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import InscriptionGroupeForm from '../components/inscription/InscriptionGroupeForm';

const InscriptionGroupePage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Inscription par groupe
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Importez un fichier Excel pour inscrire plusieurs étudiants en une seule opération.
      </Typography>
      
      <InscriptionGroupeForm />
    </Box>
  );
};

export default InscriptionGroupePage;
