import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  CircularProgress,
  Paper,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

import { StatistiquesExamen as StatsType } from '../../types/evaluation';
import examenService from '../../services/examenService';
import noteService from '../../services/noteService';

interface StatistiquesExamenProps {
  examenId: number;
}

interface DistributionItem {
  range: string;
  count: number;
  color: string;
}

const StatistiquesExamen: React.FC<StatistiquesExamenProps> = ({ examenId }) => {
  const [stats, setStats] = useState<StatsType | null>(null);
  const [distribution, setDistribution] = useState<DistributionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [examenId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, notesData] = await Promise.all([
        examenService.getStatistiques(examenId),
        noteService.getNotesByExamen(examenId),
      ]);

      setStats(statsData);

      // Calculer la distribution des notes
      const ranges = [
        { min: 0, max: 5, label: '0-5', color: '#f44336' },
        { min: 5, max: 8, label: '5-8', color: '#ff9800' },
        { min: 8, max: 10, label: '8-10', color: '#ffeb3b' },
        { min: 10, max: 12, label: '10-12', color: '#8bc34a' },
        { min: 12, max: 14, label: '12-14', color: '#4caf50' },
        { min: 14, max: 16, label: '14-16', color: '#2196f3' },
        { min: 16, max: 20, label: '16-20', color: '#9c27b0' },
      ];

      const dist = ranges.map((r) => ({
        range: r.label,
        count: notesData.filter(
          (n: any) =>
            n.note_sur_20 !== null &&
            n.note_sur_20 >= r.min &&
            n.note_sur_20 < (r.max === 20 ? 21 : r.max)
        ).length,
        color: r.color,
      }));

      setDistribution(dist);
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!stats) {
    return (
      <Typography color="text.secondary" textAlign="center">
        Aucune statistique disponible
      </Typography>
    );
  }

  return (
    <Box>
      {/* Cards statistiques */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
            <CardContent>
              <Typography variant="overline">Moyenne générale</Typography>
              <Typography variant="h3">
                {stats.moyenne?.toFixed(2) || '-'}
              </Typography>
              <Typography variant="caption">/20</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3} md={2}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Note minimale
              </Typography>
              <Typography variant="h4" color="error.main">
                {stats.min?.toFixed(2) || '-'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3} md={2}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Note maximale
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.max?.toFixed(2) || '-'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3} md={2}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Présents
              </Typography>
              <Typography variant="h4" color="info.main">
                {stats.nombre_presents}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                / {stats.total} inscrits
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3} md={3}>
          <Card sx={{ bgcolor: stats.taux_reussite && stats.taux_reussite >= 50 ? 'success.light' : 'error.light' }}>
            <CardContent>
              <Typography variant="overline">Taux de réussite</Typography>
              <Typography variant="h3">
                {stats.taux_reussite?.toFixed(1) || '-'}%
              </Typography>
              <Typography variant="caption">
                (note ≥ 10/20)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Graphique de distribution */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Distribution des notes
        </Typography>
        <Box sx={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distribution} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis allowDecimals={false} />
              <Tooltip
                formatter={(value: number | undefined) => [`${value ?? 0} étudiant(s)`, 'Effectif']}
                labelFormatter={(label) => `Plage: ${label}`}
              />
              <Bar dataKey="count" name="Étudiants">
                {distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      {/* Résumé textuel */}
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Résumé
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" paragraph>
              <strong>Effectif total :</strong> {stats.total} étudiants inscrits
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>Présents :</strong> {stats.nombre_presents} ({((stats.nombre_presents / stats.total) * 100).toFixed(1)}%)
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>Absents :</strong> {stats.nombre_absents} ({((stats.nombre_absents / stats.total) * 100).toFixed(1)}%)
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" paragraph>
              <strong>Réussite (≥10) :</strong>{' '}
              {stats.taux_reussite ? `${Math.round((stats.nombre_presents * stats.taux_reussite) / 100)} étudiants` : '-'}
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>Échec (&lt;10) :</strong>{' '}
              {stats.taux_reussite
                ? `${stats.nombre_presents - Math.round((stats.nombre_presents * stats.taux_reussite) / 100)} étudiants`
                : '-'}
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>Écart :</strong> {stats.max && stats.min ? (stats.max - stats.min).toFixed(2) : '-'} points
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default StatistiquesExamen;
