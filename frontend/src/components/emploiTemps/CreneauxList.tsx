import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Grid,
  Chip,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { CreneauHoraire, PERIODES_CRENEAU } from '../../types/emploiTemps';
import { creneauHoraireService } from '../../services/creneauHoraireService';

interface CreneauxListProps {
  onEdit: (creneau: CreneauHoraire) => void;
  onDelete: (creneau: CreneauHoraire) => void;
  refresh?: number;
}

const CreneauxList: React.FC<CreneauxListProps> = ({ onEdit, onDelete, refresh }) => {
  const [creneaux, setCreneaux] = useState<CreneauHoraire[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCreneaux();
  }, [refresh]);

  const loadCreneaux = async () => {
    setLoading(true);
    try {
      const data = await creneauHoraireService.getCreneaux();
      setCreneaux(data);
    } catch (error) {
      console.error('Erreur lors du chargement des créneaux:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPeriodeColor = (periode: string): 'warning' | 'info' | 'secondary' => {
    const colors: Record<string, 'warning' | 'info' | 'secondary'> = {
      matin: 'warning',
      apres_midi: 'info',
      soir: 'secondary',
    };
    return colors[periode] || 'info';
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  const groupedCreneaux = PERIODES_CRENEAU.map((periode) => ({
    ...periode,
    creneaux: creneaux
      .filter((c) => c.periode === periode.value)
      .sort((a, b) => a.ordre - b.ordre),
  }));

  if (loading) {
    return <Typography>Chargement...</Typography>;
  }

  return (
    <Box>
      {groupedCreneaux.map((groupe) => (
        <Box key={groupe.value} sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Chip
              label={groupe.label}
              color={getPeriodeColor(groupe.value)}
              sx={{ mr: 2 }}
            />
            <Divider sx={{ flex: 1 }} />
          </Box>

          {groupe.creneaux.length === 0 ? (
            <Typography color="text.secondary" sx={{ ml: 2 }}>
              Aucun créneau pour cette période
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {groupe.creneaux.map((creneau) => (
                <Grid item xs={12} sm={6} md={4} key={creneau.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {creneau.libelle}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Code: {creneau.code}
                          </Typography>
                        </Box>
                        <Box>
                          <Tooltip title="Modifier">
                            <IconButton size="small" onClick={() => onEdit(creneau)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Supprimer">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => onDelete(creneau)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                        <TimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body1">
                          {formatTime(creneau.heure_debut)} - {formatTime(creneau.heure_fin)}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                        <Chip
                          label={`${creneau.duree_minutes} min`}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={`Ordre: ${creneau.ordre}`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default CreneauxList;
