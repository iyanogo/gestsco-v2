import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Skeleton,
  LinearProgress,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  AccountBalance as BalanceIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';
import { StatistiquesFinances } from '../../types/finance';
import { formatMontant, calculerTauxRecouvrement } from '../../utils/formatters';
import factureService from '../../services/factureService';

interface StatistiquesFinancesCardProps {
  anneeId?: number | null;
}

const StatistiquesFinancesCard: React.FC<StatistiquesFinancesCardProps> = ({ anneeId }) => {
  const [stats, setStats] = useState<StatistiquesFinances | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const data = await factureService.getStatistiquesFactures(anneeId || undefined);
        setStats(data);
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [anneeId]);

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Grid container spacing={2}>
            {[1, 2, 3, 4].map((i) => (
              <Grid item xs={6} md={3} key={i}>
                <Skeleton variant="rectangular" height={80} />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  const tauxRecouvrement = calculerTauxRecouvrement(stats.montant_total, stats.montant_paye);

  const statItems = [
    {
      label: 'Total facturé',
      value: formatMontant(stats.montant_total),
      icon: <ReceiptIcon />,
      color: 'primary.main',
    },
    {
      label: 'Total encaissé',
      value: formatMontant(stats.montant_paye),
      icon: <PaymentIcon />,
      color: 'success.main',
    },
    {
      label: 'Reste à encaisser',
      value: formatMontant(stats.montant_restant),
      icon: <BalanceIcon />,
      color: 'error.main',
    },
    {
      label: 'Taux de recouvrement',
      value: `${tauxRecouvrement}%`,
      icon: <TrendingIcon />,
      color: tauxRecouvrement >= 80 ? 'success.main' : tauxRecouvrement >= 50 ? 'warning.main' : 'error.main',
    },
  ];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Statistiques financières
        </Typography>
        <Grid container spacing={3}>
          {statItems.map((item, index) => (
            <Grid item xs={6} md={3} key={index}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  p: 2,
                  borderRadius: 1,
                  bgcolor: 'grey.50',
                }}
              >
                <Box sx={{ color: item.color, mb: 1 }}>{item.icon}</Box>
                <Typography variant="body2" color="text.secondary" align="center">
                  {item.label}
                </Typography>
                <Typography variant="h6" sx={{ color: item.color, fontWeight: 'bold' }}>
                  {item.value}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Progression du recouvrement</Typography>
            <Typography variant="body2" fontWeight="bold">
              {tauxRecouvrement}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={tauxRecouvrement}
            sx={{
              height: 10,
              borderRadius: 5,
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                bgcolor: tauxRecouvrement >= 80 ? 'success.main' : tauxRecouvrement >= 50 ? 'warning.main' : 'error.main',
              },
            }}
          />
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
          {stats.total_factures} facture(s) au total
        </Typography>
      </CardContent>
    </Card>
  );
};

export default StatistiquesFinancesCard;
