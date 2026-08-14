import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Chip,
  Tooltip,
} from '@mui/material';
import { Salle, Seance, getTypeSeanceColor } from '../../types/emploiTemps';
import { salleService } from '../../services/salleService';

interface OccupationSalleProps {
  salleId: number;
  date: string;
}

interface TimeSlot {
  start: number;
  end: number;
  type: 'seance' | 'reservation';
  label: string;
  details: string;
  color: string;
}

const OccupationSalle: React.FC<OccupationSalleProps> = ({ salleId, date }) => {
  const [salle, setSalle] = useState<Salle | null>(null);
  const [seances, setSeances] = useState<Seance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [salleId, date]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await salleService.getOccupationSalle(salleId, date, date);
      setSalle(data.salle);
      setSeances(data.seances);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'occupation:', error);
    } finally {
      setLoading(false);
    }
  };

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToPosition = (minutes: number): number => {
    const startOfDay = 7 * 60; // 7h00
    const endOfDay = 20 * 60; // 20h00
    const totalMinutes = endOfDay - startOfDay;
    return ((minutes - startOfDay) / totalMinutes) * 100;
  };

  const minutesToWidth = (start: number, end: number): number => {
    const startOfDay = 7 * 60;
    const endOfDay = 20 * 60;
    const totalMinutes = endOfDay - startOfDay;
    return ((end - start) / totalMinutes) * 100;
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const timeSlots: TimeSlot[] = seances.map((seance) => ({
    start: timeToMinutes('08:00'), // TODO: Récupérer depuis le créneau
    end: timeToMinutes('10:00'),
    type: 'seance',
    label: seance.code,
    details: `${seance.type_seance}`,
    color: getTypeSeanceColor(seance.type_seance),
  }));

  const hours = Array.from({ length: 14 }, (_, i) => 7 + i);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {salle && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6">{salle.libelle}</Typography>
          <Typography variant="body2" color="text.secondary">
            {salle.code} - Capacité: {salle.capacite} places
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Date: {new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Typography>
        </Paper>
      )}

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Planning du jour
        </Typography>

        <Box sx={{ position: 'relative', height: 80, mt: 2 }}>
          {/* Timeline background */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 40,
              backgroundColor: 'grey.100',
              borderRadius: 1,
            }}
          />

          {/* Hour markers */}
          {hours.map((hour) => (
            <Box
              key={hour}
              sx={{
                position: 'absolute',
                left: `${minutesToPosition(hour * 60)}%`,
                top: 45,
                transform: 'translateX(-50%)',
              }}
            >
              <Box
                sx={{
                  width: 1,
                  height: 8,
                  backgroundColor: 'grey.400',
                  position: 'absolute',
                  top: -13,
                  left: '50%',
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {hour}h
              </Typography>
            </Box>
          ))}

          {/* Time slots */}
          {timeSlots.map((slot, index) => (
            <Tooltip
              key={index}
              title={
                <Box>
                  <Typography variant="body2">{slot.label}</Typography>
                  <Typography variant="caption">
                    {formatTime(slot.start)} - {formatTime(slot.end)}
                  </Typography>
                  <br />
                  <Typography variant="caption">{slot.details}</Typography>
                </Box>
              }
            >
              <Box
                sx={{
                  position: 'absolute',
                  left: `${minutesToPosition(slot.start)}%`,
                  width: `${minutesToWidth(slot.start, slot.end)}%`,
                  top: 4,
                  height: 32,
                  backgroundColor: slot.color,
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  '&:hover': {
                    opacity: 0.8,
                  },
                }}
              >
                <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {slot.label}
                </Typography>
              </Box>
            </Tooltip>
          ))}
        </Box>

        {/* Legend */}
        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
          <Chip label="Séance" size="small" sx={{ backgroundColor: '#1976d2', color: 'white' }} />
          <Chip label="Réservation" size="small" sx={{ backgroundColor: '#4caf50', color: 'white' }} />
        </Box>

        {seances.length === 0 && (
          <Typography color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
            Aucune occupation prévue ce jour
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default OccupationSalle;
