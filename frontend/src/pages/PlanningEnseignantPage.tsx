import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
  Divider,
} from '@mui/material';
import { Assignment as AssignmentIcon } from '@mui/icons-material';
import PlanningEnseignant from '../components/emploiTemps/PlanningEnseignant';
import { SeanceWithDetails, getTypeSeanceLabel, getTypeSeanceColor } from '../types/emploiTemps';
import { seanceService } from '../services/seanceService';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PlanningEnseignantPageProps {
  enseignantId: number;
}

const PlanningEnseignantPage: React.FC<PlanningEnseignantPageProps> = ({ enseignantId }) => {
  const [seancesAVenir, setSeancesAVenir] = useState<SeanceWithDetails[]>([]);
  const [stats, setStats] = useState({
    heuresSemaine: 0,
    nombreSeances: 0,
  });

  useEffect(() => {
    loadData();
  }, [enseignantId]);

  const loadData = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const nextWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd');
      const seances = await seanceService.getSeancesEnseignant(enseignantId, today, nextWeek);
      setSeancesAVenir(seances as SeanceWithDetails[]);

      // Calculer les stats
      const totalMinutes = seances.reduce((acc, s) => acc + s.duree_minutes, 0);
      setStats({
        heuresSemaine: Math.round(totalMinutes / 60),
        nombreSeances: seances.length,
      });
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  const handleSeanceClick = (seance: SeanceWithDetails) => {
    console.log('Séance cliquée:', seance);
    // TODO: Ouvrir les détails ou la saisie des présences
  };

  const handleSaisirPresences = (seance: SeanceWithDetails) => {
    // TODO: Naviguer vers la page de saisie des présences
    console.log('Saisir présences pour:', seance);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Mon Planning
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="primary">
                {stats.heuresSemaine}h
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Heures cette semaine
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="success.main">
                {stats.nombreSeances}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Séances à venir
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Prochaines séances
              </Typography>
              {seancesAVenir.length === 0 ? (
                <Typography color="text.secondary">Aucune séance prévue</Typography>
              ) : (
                <List dense>
                  {seancesAVenir.slice(0, 3).map((seance) => (
                    <ListItem
                      key={seance.id}
                      secondaryAction={
                        <Button
                          size="small"
                          startIcon={<AssignmentIcon />}
                          onClick={() => handleSaisirPresences(seance)}
                        >
                          Présences
                        </Button>
                      }
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2">
                              {seance.matiere_libelle || `Matière #${seance.matiere_id}`}
                            </Typography>
                            <Chip
                              label={getTypeSeanceLabel(seance.type_seance)}
                              size="small"
                              sx={{
                                backgroundColor: getTypeSeanceColor(seance.type_seance),
                                color: 'white',
                              }}
                            />
                          </Box>
                        }
                        secondary={
                          <>
                            {format(new Date(seance.date_seance), 'EEEE d MMMM', { locale: fr })}
                            {' - '}
                            {seance.salle_libelle || 'Salle non définie'}
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h5" gutterBottom>
        Planning de la semaine
      </Typography>

      <PlanningEnseignant
        enseignantId={enseignantId}
        onSeanceClick={handleSeanceClick}
      />
    </Box>
  );
};

export default PlanningEnseignantPage;
