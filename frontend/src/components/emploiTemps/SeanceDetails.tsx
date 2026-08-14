import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Grid,
  Divider,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Check as CheckIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { SeanceWithDetails, getStatutSeanceColor, getTypeSeanceLabel, STATUTS_SEANCE } from '../../types/emploiTemps';
import { seanceService } from '../../services/seanceService';

interface SeanceDetailsProps {
  seanceId: number;
  onEdit?: () => void;
  onConfirmer?: () => void;
  onAnnuler?: () => void;
  onReporter?: () => void;
  onSaisirPresences?: () => void;
}

const SeanceDetails: React.FC<SeanceDetailsProps> = ({
  seanceId,
  onEdit,
  onConfirmer,
  onAnnuler,
  onReporter,
  onSaisirPresences,
}) => {
  const [seance, setSeance] = useState<SeanceWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSeance();
  }, [seanceId]);

  const loadSeance = async () => {
    setLoading(true);
    try {
      const data = await seanceService.getSeanceById(seanceId);
      setSeance(data as SeanceWithDetails);
    } catch (error) {
      console.error('Erreur lors du chargement de la séance:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatutLabel = (statut: string) => {
    const found = STATUTS_SEANCE.find((s) => s.value === statut);
    return found?.label || statut;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!seance) {
    return (
      <Typography color="error">Séance non trouvée</Typography>
    );
  }

  const canConfirm = seance.statut === 'planifiee';
  const canCancel = ['planifiee', 'confirmee'].includes(seance.statut);
  const canReport = ['planifiee', 'confirmee'].includes(seance.statut);
  const canSaisirPresences = ['confirmee', 'en_cours', 'terminee'].includes(seance.statut);

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              {seance.matiere_libelle || `Matière #${seance.matiere_id}`}
            </Typography>
            <Chip
              label={getStatutLabel(seance.statut)}
              color={getStatutSeanceColor(seance.statut) as any}
              size="small"
            />
          </Box>
          <Chip
            label={getTypeSeanceLabel(seance.type_seance)}
            variant="outlined"
            size="small"
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Date
            </Typography>
            <Typography variant="body1">
              {formatDate(seance.date_seance)}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Créneau
            </Typography>
            <Typography variant="body1">
              {seance.creneau_libelle || `Créneau #${seance.creneau_id}`}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Salle
            </Typography>
            <Typography variant="body1">
              {seance.salle_libelle || 'Non définie'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Durée
            </Typography>
            <Typography variant="body1">
              {seance.duree_minutes} minutes
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Enseignant
        </Typography>
        <Typography variant="body1" gutterBottom>
          {seance.enseignant_nom || `Enseignant #${seance.enseignant_id}`}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Effectif prévu
            </Typography>
            <Typography variant="h6">
              {seance.effectif_prevu || '-'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Effectif présent
            </Typography>
            <Typography variant="h6" color={seance.effectif_present ? 'success.main' : 'text.secondary'}>
              {seance.effectif_present || '-'}
            </Typography>
          </Grid>
        </Grid>

        {seance.observations && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Observations
            </Typography>
            <Typography variant="body2">
              {seance.observations}
            </Typography>
          </>
        )}

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {onEdit && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<EditIcon />}
              onClick={onEdit}
            >
              Modifier
            </Button>
          )}
          {canConfirm && onConfirmer && (
            <Button
              variant="contained"
              size="small"
              color="success"
              startIcon={<CheckIcon />}
              onClick={onConfirmer}
            >
              Confirmer
            </Button>
          )}
          {canCancel && onAnnuler && (
            <Button
              variant="outlined"
              size="small"
              color="error"
              startIcon={<CancelIcon />}
              onClick={onAnnuler}
            >
              Annuler
            </Button>
          )}
          {canReport && onReporter && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<ScheduleIcon />}
              onClick={onReporter}
            >
              Reporter
            </Button>
          )}
          {canSaisirPresences && onSaisirPresences && (
            <Button
              variant="contained"
              size="small"
              startIcon={<AssignmentIcon />}
              onClick={onSaisirPresences}
            >
              Saisir présences
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default SeanceDetails;
