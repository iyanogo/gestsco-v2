import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
} from '@mui/material';
import {
  People as PeopleIcon,
  School as SchoolIcon,
  CheckCircle as ActiveIcon,
  Pause as SuspendedIcon,
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { getStatistiques } from '@/services/etudiantService';
import type { EtudiantStatistiques } from '@/types/etudiant';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

const StatCard = ({ title, value, icon, color }: StatCardProps) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography color="text.secondary" variant="body2" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" component="div">
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            backgroundColor: color,
            borderRadius: 2,
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

export const DashboardPage = () => {
  const { user } = useAuth();
  const [etudiantStats, setEtudiantStats] = useState<EtudiantStatistiques | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await getStatistiques();
        setEtudiantStats(data);
      } catch (error) {
        console.error('Erreur chargement statistiques:', error);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  const getStatValue = (key: string): number => {
    if (!etudiantStats?.par_statut) return 0;
    return etudiantStats.par_statut[key] || 0;
  };

  const stats = [
    {
      title: 'Total Étudiants',
      value: loading ? '...' : (etudiantStats?.total || 0).toLocaleString('fr-FR'),
      icon: <PeopleIcon sx={{ color: 'white', fontSize: 32 }} />,
      color: '#1976d2',
    },
    {
      title: 'Étudiants Actifs',
      value: loading ? '...' : getStatValue('actif').toLocaleString('fr-FR'),
      icon: <ActiveIcon sx={{ color: 'white', fontSize: 32 }} />,
      color: '#2e7d32',
    },
    {
      title: 'Suspendus',
      value: loading ? '...' : getStatValue('suspendu').toLocaleString('fr-FR'),
      icon: <SuspendedIcon sx={{ color: 'white', fontSize: 32 }} />,
      color: '#ed6c02',
    },
    {
      title: 'Diplômés',
      value: loading ? '...' : (getStatValue('diplômé') + getStatValue('diplome')).toLocaleString('fr-FR'),
      icon: <SchoolIcon sx={{ color: 'white', fontSize: 32 }} />,
      color: '#9c27b0',
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Tableau de bord
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Bienvenue, {user?.full_name || user?.email} !
        </Typography>
      </Box>

      <Grid container spacing={3} mb={4}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Activité récente
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Aucune activité récente à afficher.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Informations du compte
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {user?.email}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Rôle
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {user?.is_superuser ? 'Administrateur' : 'Utilisateur'}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Statut
                </Typography>
                <Typography variant="body1">
                  {user?.is_active ? 'Actif' : 'Inactif'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DashboardPage;
