import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Divider,
  CircularProgress,
  Stack,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Publish as PublishIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import {
  Deliberation,
  StatistiquesDeliberation,
  STATUT_DELIBERATION_LABELS,
  STATUT_DELIBERATION_COLORS,
} from '../../types/evaluation';
import deliberationService from '../../services/deliberationService';

interface DeliberationDetailsProps {
  deliberationId: number;
  onPublier?: () => void;
}

const DeliberationDetails: React.FC<DeliberationDetailsProps> = ({
  deliberationId,
  onPublier,
}) => {
  const [deliberation, setDeliberation] = useState<Deliberation | null>(null);
  const [stats, setStats] = useState<StatistiquesDeliberation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [deliberationId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [delibData, statsData] = await Promise.all([
        deliberationService.getDeliberationById(deliberationId),
        deliberationService.getStatistiques(deliberationId),
      ]);
      setDeliberation(delibData);
      setStats(statsData);
    } catch (error) {
      console.error('Erreur chargement délibération:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublier = async () => {
    try {
      await deliberationService.publierDeliberation(deliberationId);
      loadData();
      onPublier?.();
    } catch (error) {
      console.error('Erreur publication:', error);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd MMMM yyyy', { locale: fr });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!deliberation) {
    return (
      <Typography color="text.secondary" textAlign="center">
        Délibération non trouvée
      </Typography>
    );
  }

  return (
    <Box>
      {/* En-tête */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h5" gutterBottom>
              Délibération {deliberation.type_deliberation === 'semestrielle' ? 'Semestrielle' : 'Annuelle'}
              {deliberation.semestre && ` - Semestre ${deliberation.semestre}`}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Date: {formatDate(deliberation.date_deliberation)}
            </Typography>
            <Chip
              label={STATUT_DELIBERATION_LABELS[deliberation.statut] || deliberation.statut}
              color={STATUT_DELIBERATION_COLORS[deliberation.statut] || 'default'}
              sx={{ mt: 1 }}
            />
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
            >
              Télécharger PV
            </Button>
            {deliberation.statut === 'validee' && !deliberation.publiee && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<PublishIcon />}
                onClick={handlePublier}
              >
                Publier
              </Button>
            )}
          </Stack>
        </Stack>
      </Paper>

      {/* Informations générales */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Informations générales
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Session
                </Typography>
                <Typography variant="body1">
                  {deliberation.session?.code || `#${deliberation.session_id}`}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Niveau
                </Typography>
                <Typography variant="body1">
                  {deliberation.niveau?.libelle || `#${deliberation.niveau_id}`}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Filière
                </Typography>
                <Typography variant="body1">
                  {deliberation.filiere?.libelle || `#${deliberation.filiere_id}`}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Type
                </Typography>
                <Typography variant="body1">
                  {deliberation.type_deliberation === 'semestrielle' ? 'Semestrielle' : 'Annuelle'}
                </Typography>
              </Grid>
              {deliberation.date_validation && (
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Date validation
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(deliberation.date_validation)}
                  </Typography>
                </Grid>
              )}
              {deliberation.date_publication && (
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Date publication
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(deliberation.date_publication)}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>

        {/* Statistiques */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Statistiques
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Card sx={{ bgcolor: 'primary.light' }}>
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Typography variant="caption" color="primary.contrastText">
                      Effectif
                    </Typography>
                    <Typography variant="h4" color="primary.contrastText">
                      {stats?.nombre_etudiants || deliberation.nombre_etudiants}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card sx={{ bgcolor: 'success.light' }}>
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Typography variant="caption" color="success.contrastText">
                      Admis
                    </Typography>
                    <Typography variant="h4" color="success.contrastText">
                      {stats?.nombre_admis || deliberation.nombre_admis}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card sx={{ bgcolor: 'warning.light' }}>
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Typography variant="caption" color="warning.contrastText">
                      Ajournés
                    </Typography>
                    <Typography variant="h4" color="warning.contrastText">
                      {stats?.nombre_ajournes || deliberation.nombre_ajournes}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card sx={{ bgcolor: (stats?.taux_reussite || deliberation.taux_reussite || 0) >= 50 ? 'success.main' : 'error.main' }}>
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Typography variant="caption" color="white">
                      Taux réussite
                    </Typography>
                    <Typography variant="h4" color="white">
                      {(stats?.taux_reussite || deliberation.taux_reussite)?.toFixed(1)}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Observations */}
        {deliberation.observations && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Observations
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body1">
                {deliberation.observations}
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default DeliberationDetails;
