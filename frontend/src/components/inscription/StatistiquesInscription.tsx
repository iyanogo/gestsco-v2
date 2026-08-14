/**
 * Composant pour afficher les statistiques d'inscription
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  LinearProgress,
  Skeleton,
} from '@mui/material';
import {
  Description as DossierIcon,
  CheckCircle as ValidIcon,
  School as AdmisIcon,
  Cancel as RefuseIcon,
  HourglassEmpty as EnCoursIcon,
} from '@mui/icons-material';

import { CampagneStatistiques, PlacesRestantes } from '../../types/inscription';
import { campagneInscriptionService } from '../../services';

interface StatistiquesInscriptionProps {
  campagneId?: number | null;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, loading }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          {loading ? (
            <Skeleton width={60} height={40} />
          ) : (
            <Typography variant="h4" fontWeight="bold">
              {value}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            backgroundColor: `${color}20`,
            borderRadius: 2,
            p: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {React.cloneElement(icon as React.ReactElement, { sx: { color, fontSize: 32 } })}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const StatistiquesInscription: React.FC<StatistiquesInscriptionProps> = ({ campagneId }) => {
  const [stats, setStats] = useState<CampagneStatistiques | null>(null);
  const [places, setPlaces] = useState<PlacesRestantes | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!campagneId) {
        setStats(null);
        setPlaces(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [statsData, placesData] = await Promise.all([
          campagneInscriptionService.getStatistiques(campagneId),
          campagneInscriptionService.getPlacesRestantes(campagneId),
        ]);
        setStats(statsData);
        setPlaces(placesData);
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [campagneId]);

  const tauxRemplissage = places?.places_totales && places.places_restantes !== null
    ? Math.round(((places.places_totales - places.places_restantes) / places.places_totales) * 100)
    : null;

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Total dossiers"
            value={stats?.total_dossiers || 0}
            icon={<DossierIcon />}
            color="#1976d2"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Dossiers complets"
            value={stats?.dossiers_complets || 0}
            icon={<EnCoursIcon />}
            color="#ff9800"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Dossiers validés"
            value={stats?.dossiers_valides || 0}
            icon={<ValidIcon />}
            color="#4caf50"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Candidats admis"
            value={stats?.admis || 0}
            icon={<AdmisIcon />}
            color="#2196f3"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Dossiers refusés"
            value={stats?.refuses || 0}
            icon={<RefuseIcon />}
            color="#f44336"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Taux de remplissage */}
      {places?.places_totales && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Taux de remplissage
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <Box flexGrow={1}>
                <LinearProgress
                  variant="determinate"
                  value={tauxRemplissage || 0}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: '#e0e0e0',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 5,
                      backgroundColor: tauxRemplissage && tauxRemplissage > 90 ? '#f44336' : '#4caf50',
                    },
                  }}
                />
              </Box>
              <Typography variant="h6" fontWeight="bold">
                {tauxRemplissage}%
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {places.places_occupees} / {places.places_totales} places occupées
              ({places.places_restantes} restantes)
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default StatistiquesInscription;
