import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Grid,
} from '@mui/material';
import MonEmploiTemps from '../components/emploiTemps/MonEmploiTemps';
import MesPresences from '../components/emploiTemps/MesPresences';
import ProchainCours from '../components/emploiTemps/ProchainCours';
import { SeanceWithDetails } from '../types/emploiTemps';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

interface MonEmploiTempsPageProps {
  userRole?: 'etudiant' | 'enseignant';
  userId?: number;
  etudiantId?: number;
  niveauId?: number;
  filiereId?: number;
}

const MonEmploiTempsPage: React.FC<MonEmploiTempsPageProps> = ({
  userRole = 'etudiant',
  userId,
  etudiantId,
  niveauId,
  filiereId,
}) => {
  const [tabValue, setTabValue] = useState(0);

  const handleSeanceClick = (seance: SeanceWithDetails) => {
    console.log('Séance cliquée:', seance);
    // TODO: Ouvrir les détails de la séance
  };

  const handleViewEmploiTemps = () => {
    setTabValue(0);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Mon Emploi du Temps
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <ProchainCours
            userId={userId}
            userRole={userRole}
            niveauId={niveauId}
            filiereId={filiereId}
            onViewEmploiTemps={handleViewEmploiTemps}
          />
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Informations
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {userRole === 'etudiant'
                ? 'Consultez votre emploi du temps et vos présences.'
                : 'Consultez votre planning de cours.'}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {userRole === 'etudiant' && (
        <Paper sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
            <Tab label="Emploi du temps" />
            <Tab label="Mes présences" />
          </Tabs>
        </Paper>
      )}

      {userRole === 'etudiant' ? (
        <>
          <TabPanel value={tabValue} index={0}>
            <MonEmploiTemps
              userRole={userRole}
              userId={userId}
              niveauId={niveauId}
              filiereId={filiereId}
              onSeanceClick={handleSeanceClick}
            />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            {etudiantId && <MesPresences etudiantId={etudiantId} />}
          </TabPanel>
        </>
      ) : (
        <MonEmploiTemps
          userRole={userRole}
          userId={userId}
          niveauId={niveauId}
          filiereId={filiereId}
          onSeanceClick={handleSeanceClick}
        />
      )}
    </Box>
  );
};

export default MonEmploiTempsPage;
