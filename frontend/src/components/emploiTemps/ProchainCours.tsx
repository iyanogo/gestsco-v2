import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  AccessTime as TimeIcon,
  Room as RoomIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { differenceInMinutes, format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { SeanceWithDetails, getTypeSeanceColor, getTypeSeanceLabel } from '../../types/emploiTemps';
import { seanceService } from '../../services/seanceService';

interface ProchainCoursProps {
  userId?: number;
  userRole?: 'etudiant' | 'enseignant';
  niveauId?: number;
  filiereId?: number;
  onViewEmploiTemps?: () => void;
}

const ProchainCours: React.FC<ProchainCoursProps> = ({
  userId,
  userRole = 'etudiant',
  niveauId,
  filiereId,
  onViewEmploiTemps,
}) => {
  const [prochainCours, setProchainCours] = useState<SeanceWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState<string | null>(null);

  useEffect(() => {
    loadProchainCours();
  }, [userId, userRole, niveauId, filiereId]);

  useEffect(() => {
    if (prochainCours) {
      const interval = setInterval(() => {
        updateCountdown();
      }, 60000); // Update every minute
      updateCountdown();
      return () => clearInterval(interval);
    }
  }, [prochainCours]);

  const loadProchainCours = async () => {
    setLoading(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      let seances: SeanceWithDetails[] = [];

      if (userRole === 'enseignant' && userId) {
        const data = await seanceService.getSeancesEnseignant(userId, today);
        seances = data as SeanceWithDetails[];
      } else if (niveauId) {
        const data = await seanceService.getSeances({
          date: today,
          niveau_id: niveauId,
          filiere_id: filiereId,
        });
        seances = data as SeanceWithDetails[];
      }

      // Trouver la prochaine séance
      const prochaine = seances
        .filter((s) => s.statut !== 'annulee')
        .sort((a, b) => a.creneau_id - b.creneau_id)
        .find((_s) => {
          // TODO: Comparer avec l'heure du créneau
          return true;
        });

      setProchainCours(prochaine || null);
    } catch (error) {
      console.error('Erreur lors du chargement du prochain cours:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCountdown = () => {
    if (!prochainCours) return;

    // TODO: Calculer le temps restant basé sur l'heure du créneau
    const now = new Date();
    const coursDate = parseISO(prochainCours.date_seance);
    const diff = differenceInMinutes(coursDate, now);

    if (diff > 0 && diff <= 120) {
      const hours = Math.floor(diff / 60);
      const minutes = diff % 60;
      if (hours > 0) {
        setCountdown(`${hours}h ${minutes}min`);
      } else {
        setCountdown(`${minutes} min`);
      }
    } else {
      setCountdown(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress size={24} />
        </CardContent>
      </Card>
    );
  }

  if (!prochainCours) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Prochain cours
          </Typography>
          <Typography color="text.secondary">
            Aucun cours prévu aujourd'hui
          </Typography>
          {onViewEmploiTemps && (
            <Button
              variant="text"
              size="small"
              onClick={onViewEmploiTemps}
              sx={{ mt: 1 }}
            >
              Voir l'emploi du temps
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const typeColor = getTypeSeanceColor(prochainCours.type_seance);

  return (
    <Card sx={{ borderLeft: 4, borderColor: typeColor }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6">
              {prochainCours.matiere_libelle || `Matière #${prochainCours.matiere_id}`}
            </Typography>
            <Chip
              label={getTypeSeanceLabel(prochainCours.type_seance)}
              size="small"
              sx={{ backgroundColor: typeColor, color: 'white', mt: 0.5 }}
            />
          </Box>
          {countdown && (
            <Chip
              label={`Dans ${countdown}`}
              color="warning"
              variant="outlined"
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon fontSize="small" color="action" />
            <Typography variant="body2">
              {prochainCours.enseignant_nom || `Enseignant #${prochainCours.enseignant_id}`}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <RoomIcon fontSize="small" color="action" />
            <Typography variant="body2">
              {prochainCours.salle_libelle || 'Salle non définie'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimeIcon fontSize="small" color="action" />
            <Typography variant="body2">
              {prochainCours.creneau_libelle || `Créneau #${prochainCours.creneau_id}`}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarIcon fontSize="small" color="action" />
            <Typography variant="body2">
              {format(parseISO(prochainCours.date_seance), 'EEEE d MMMM', { locale: fr })}
            </Typography>
          </Box>
        </Box>

        {onViewEmploiTemps && (
          <Button
            variant="text"
            size="small"
            onClick={onViewEmploiTemps}
            sx={{ mt: 2 }}
          >
            Voir l'emploi du temps complet
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ProchainCours;
