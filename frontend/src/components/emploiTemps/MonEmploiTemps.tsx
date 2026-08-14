import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Button,
  CircularProgress,
  TextField,
  MenuItem,
  Grid,
} from '@mui/material';
import {
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  PictureAsPdf as PdfIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { addDays, subDays, format, startOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { SeanceWithDetails, JourSemaine } from '../../types/emploiTemps';
import { seanceService } from '../../services/seanceService';
// import { emploiTempsService } from '../../services/emploiTempsService';
import EmploiTempsGrid from './EmploiTempsGrid';

interface MonEmploiTempsProps {
  userRole?: 'etudiant' | 'enseignant';
  userId?: number;
  niveauId?: number;
  filiereId?: number;
  onSeanceClick?: (seance: SeanceWithDetails) => void;
}

const MonEmploiTemps: React.FC<MonEmploiTempsProps> = ({
  userRole = 'etudiant',
  userId,
  niveauId,
  filiereId,
  onSeanceClick,
}) => {
  const [seances, setSeances] = useState<SeanceWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [semestre, setSemestre] = useState(1);

  useEffect(() => {
    loadSeances();
  }, [userRole, userId, niveauId, filiereId, currentWeekStart, semestre]);

  const loadSeances = async () => {
    setLoading(true);
    try {
      const dateDebutStr = format(currentWeekStart, 'yyyy-MM-dd');

      if (userRole === 'enseignant' && userId) {
        const dateFinStr = format(addDays(currentWeekStart, 6), 'yyyy-MM-dd');
        const data = await seanceService.getSeancesEnseignant(userId, dateDebutStr, dateFinStr);
        setSeances(data as SeanceWithDetails[]);
      } else if (niveauId) {
        const joursData = await seanceService.getSeancesSemaine(dateDebutStr, niveauId, filiereId);
        const allSeances = joursData.flatMap((jour: JourSemaine) => jour.seances);
        setSeances(allSeances);
      }
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

  const handleExportPDF = async () => {
    // TODO: Implémenter l'export PDF
    console.log('Export PDF');
  };

  const handlePrint = () => {
    window.print();
  };

  const weekEnd = addDays(currentWeekStart, 6);
  const weekLabel = `${format(currentWeekStart, 'd MMMM', { locale: fr })} - ${format(weekEnd, 'd MMMM yyyy', { locale: fr })}`;

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton onClick={handlePrevWeek}>
                <PrevIcon />
              </IconButton>
              <Typography variant="h6">{weekLabel}</Typography>
              <IconButton onClick={handleNextWeek}>
                <NextIcon />
              </IconButton>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Semestre"
              value={semestre}
              onChange={(e) => setSemestre(Number(e.target.value))}
            >
              <MenuItem value={1}>Semestre 1</MenuItem>
              <MenuItem value={2}>Semestre 2</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<PdfIcon />}
                onClick={handleExportPDF}
              >
                PDF
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<PrintIcon />}
                onClick={handlePrint}
              >
                Imprimer
              </Button>
            </Box>
          </Grid>
        </Grid>
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

export default MonEmploiTemps;
