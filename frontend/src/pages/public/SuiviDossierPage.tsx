/**
 * Page publique de suivi de dossier
 */

import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  InputAdornment,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

import SuiviDossier from '../../components/inscription/public/SuiviDossier';

const SuiviDossierPage: React.FC = () => {
  const [numeroDossier, setNumeroDossier] = useState('');
  const [searchedNumero, setSearchedNumero] = useState('');

  const handleSearch = () => {
    if (numeroDossier.trim()) {
      setSearchedNumero(numeroDossier.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5', py: 4 }}>
      <Container maxWidth="md">
        {/* En-tête */}
        <Box textAlign="center" sx={{ mb: 4 }}>
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Suivi de dossier
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Consultez l'état d'avancement de votre dossier de candidature
          </Typography>
        </Box>

        {/* Recherche */}
        <Paper sx={{ p: 4, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Entrez votre numéro de dossier
          </Typography>
          <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
            <TextField
              fullWidth
              placeholder="Ex: DOS-2024-00001"
              value={numeroDossier}
              onChange={(e) => setNumeroDossier(e.target.value)}
              onKeyPress={handleKeyPress}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              sx={{ minWidth: 150 }}
            >
              Rechercher
            </Button>
          </Box>
        </Paper>

        {/* Résultat */}
        {searchedNumero && (
          <SuiviDossier numeroDossier={searchedNumero} />
        )}

        {/* Footer */}
        <Box textAlign="center" sx={{ mt: 4 }}>
          <Typography variant="body2" color="text.secondary">
            Vous n'avez pas encore de dossier ?{' '}
            <a href="/inscription" style={{ color: '#1976d2' }}>
              Inscrivez-vous ici
            </a>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default SuiviDossierPage;
