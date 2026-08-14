import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import { addDays, subDays, format, startOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { SeanceWithDetails } from '../../types/emploiTemps';
import { seanceService } from '../../services/seanceService';
import EmploiTempsGrid from './EmploiTempsGrid';

interface PlanningEnseignantProps {
  enseignantId: number;
  dateDebut?: string;
  onSeanceClick?: (seance: SeanceWithDetails) => void;
}

const PlanningEnseignant: React.FC<PlanningEnseignantProps> = ({
  enseignantId,
  dateDebut,
  onSeanceClick,
}) => {
  const [seances, setSeances] = useState<SeanceWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
    dateDebut ? new Date(dateDebut) : startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  useEffect(() => {
    loadSeances();
  }, [enseignantId, currentWeekStart]);

  const loadSeances = async () => {
    setLoading(true);
    try {
      const dateDebutStr = format(currentWeekStart, 'yyyy-MM-dd');
      const dateFinStr = format(addDays(currentWeekStart, 6), 'yyyy-MM-dd');
      const data = await seanceService.getSeancesEnseignant(enseignantId, dateDebutStr, dateFinStr);
      setSeances(data as SeanceWithDetails[]);
    } catch (error) {
      console.error('Erreur lors du chargement des séances:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevWeek = () => {
    setCurrentWeekStart((prev) => subDays(prev, 7));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart((prev) => addDays(prev, 7));
  };

  const handleExportPDF = () => {
    // TODO: Implémenter l'export PDF
    console.log('Export PDF');
  };

  const weekEnd = addDays(currentWeekStart, 6);
  const weekLabel = `${format(currentWeekStart, 'd MMMM', { locale: fr })} - ${format(weekEnd, 'd MMMM yyyy', { locale: fr })}`;

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={handlePrevWeek}>
              <PrevIcon />
            </IconButton>
            <Typography variant="h6">{weekLabel}</Typography>
            <IconButton onClick={handleNextWeek}>
              <NextIcon />
            </IconButton>
          </Box>
          <Button
            variant="outlined"
            startIcon={<PdfIcon />}
            onClick={handleExportPDF}
          >
            Exporter PDF
          </Button>
        </Box>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : seances.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Aucune séance prévue cette semaine
          </Typography>
        </Paper>
      ) : (
        <EmploiTempsGrid
          seances={seances}
          editable={false}
          onSeanceClick={onSeanceClick}
        />
      )}
    </Box>
  );
};

export default PlanningEnseignant;
