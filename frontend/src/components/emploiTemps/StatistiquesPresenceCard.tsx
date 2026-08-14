import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Grid,
} from '@mui/material';
import { StatistiquesPresence } from '../../types/emploiTemps';
import { presenceService } from '../../services/presenceService';

interface StatistiquesPresenceCardProps {
  etudiantId: number;
  matiereId?: number | null;
  dateDebut?: string;
  dateFin?: string;
}

const StatistiquesPresenceCard: React.FC<StatistiquesPresenceCardProps> = ({
  etudiantId,
  matiereId,
  dateDebut,
  dateFin,
}) => {
  const [stats, setStats] = useState<StatistiquesPresence | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [etudiantId, matiereId, dateDebut, dateFin]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await presenceService.getTauxPresence(
        etudiantId,
        matiereId || undefined,
        dateDebut,
        dateFin
      );
      setStats(data);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  const getColorByTaux = (taux: number): string => {
    if (taux >= 90) return '#4caf50'; // Vert
    if (taux >= 70) return '#ff9800'; // Orange
    return '#f44336'; // Rouge
  };

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent>
          <Typography color="text.secondary">Aucune donnée disponible</Typography>
        </CardContent>
      </Card>
    );
  }

  const tauxColor = getColorByTaux(stats.taux_presence);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Statistiques de présence
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress
              variant="determinate"
              value={stats.taux_presence}
              size={120}
              thickness={4}
              sx={{ color: tauxColor }}
            />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
              }}
            >
              <Typography variant="h4" component="div" sx={{ color: tauxColor }}>
                {stats.taux_presence}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Présence
              </Typography>
            </Box>
          </Box>
        </Box>

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="h5" color="text.primary">
                {stats.total_seances}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total séances
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'success.light', borderRadius: 1 }}>
              <Typography variant="h5" color="success.dark">
                {stats.presences}
              </Typography>
              <Typography variant="caption" color="success.dark">
                Présences
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'error.light', borderRadius: 1 }}>
              <Typography variant="h5" color="error.dark">
                {stats.absences}
              </Typography>
              <Typography variant="caption" color="error.dark">
                Absences
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'warning.light', borderRadius: 1 }}>
              <Typography variant="h5" color="warning.dark">
                {stats.retards}
              </Typography>
              <Typography variant="caption" color="warning.dark">
                Retards
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {stats.taux_presence < 70 && (
          <Box sx={{ mt: 2, p: 1, bgcolor: 'error.light', borderRadius: 1 }}>
            <Typography variant="body2" color="error.dark" textAlign="center">
              ⚠️ Taux de présence insuffisant
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default StatistiquesPresenceCard;
