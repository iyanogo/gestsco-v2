import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Tooltip,
} from '@mui/material';
import { SeanceWithDetails, CreneauHoraire, JOURS_SEMAINE, getTypeSeanceColor } from '../../types/emploiTemps';
import { creneauHoraireService } from '../../services/creneauHoraireService';

interface EmploiTempsGridProps {
  seances: SeanceWithDetails[];
  editable?: boolean;
  onSeanceClick?: (seance: SeanceWithDetails) => void;
  onCellClick?: (jour: number, creneauId: number) => void;
}

const EmploiTempsGrid: React.FC<EmploiTempsGridProps> = ({
  seances,
  editable = false,
  onSeanceClick,
  onCellClick,
}) => {
  const [creneaux, setCreneaux] = useState<CreneauHoraire[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCreneaux();
  }, []);

  const loadCreneaux = async () => {
    try {
      const data = await creneauHoraireService.getCreneaux();
      setCreneaux(data.sort((a, b) => a.ordre - b.ordre));
    } catch (error) {
      console.error('Erreur lors du chargement des créneaux:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeanceForCell = (jour: number, creneauId: number): SeanceWithDetails | undefined => {
    return seances.find(
      (s) => s.jour_semaine === jour && s.creneau_id === creneauId
    );
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  const handleCellClick = (jour: number, creneauId: number, seance?: SeanceWithDetails) => {
    if (seance && onSeanceClick) {
      onSeanceClick(seance);
    } else if (editable && onCellClick) {
      onCellClick(jour, creneauId);
    }
  };

  // Jours affichés (Lundi à Samedi)
  const joursAffiches = JOURS_SEMAINE.filter((j) => j.value <= 6);

  if (loading) {
    return <Typography>Chargement...</Typography>;
  }

  return (
    <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
      <Table size="small" sx={{ minWidth: 800 }}>
        <TableHead>
          <TableRow>
            <TableCell
              sx={{
                fontWeight: 'bold',
                backgroundColor: 'primary.main',
                color: 'white',
                width: 120,
              }}
            >
              Créneau
            </TableCell>
            {joursAffiches.map((jour) => (
              <TableCell
                key={jour.value}
                align="center"
                sx={{
                  fontWeight: 'bold',
                  backgroundColor: 'primary.main',
                  color: 'white',
                  minWidth: 140,
                }}
              >
                {jour.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {creneaux.map((creneau) => (
            <TableRow key={creneau.id} hover>
              <TableCell
                sx={{
                  backgroundColor: 'grey.100',
                  fontWeight: 'medium',
                  verticalAlign: 'top',
                  py: 1,
                }}
              >
                <Typography variant="body2" fontWeight="bold">
                  {creneau.libelle}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatTime(creneau.heure_debut)} - {formatTime(creneau.heure_fin)}
                </Typography>
              </TableCell>
              {joursAffiches.map((jour) => {
                const seance = getSeanceForCell(jour.value, creneau.id);
                return (
                  <TableCell
                    key={jour.value}
                    align="center"
                    sx={{
                      cursor: seance || editable ? 'pointer' : 'default',
                      p: 0.5,
                      verticalAlign: 'top',
                      '&:hover': {
                        backgroundColor: seance || editable ? 'action.hover' : 'inherit',
                      },
                    }}
                    onClick={() => handleCellClick(jour.value, creneau.id, seance)}
                  >
                    {seance ? (
                      <SeanceCell seance={seance} />
                    ) : editable ? (
                      <Box
                        sx={{
                          height: 60,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px dashed',
                          borderColor: 'grey.300',
                          borderRadius: 1,
                          color: 'grey.400',
                        }}
                      >
                        <Typography variant="caption">+ Ajouter</Typography>
                      </Box>
                    ) : null}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

interface SeanceCellProps {
  seance: SeanceWithDetails;
}

const SeanceCell: React.FC<SeanceCellProps> = ({ seance }) => {
  const typeColor = getTypeSeanceColor(seance.type_seance);

  return (
    <Tooltip
      title={
        <Box>
          <Typography variant="body2">{seance.matiere_libelle}</Typography>
          <Typography variant="caption">Enseignant: {seance.enseignant_nom}</Typography>
          <br />
          <Typography variant="caption">Salle: {seance.salle_libelle || 'Non définie'}</Typography>
        </Box>
      }
    >
      <Box
        sx={{
          backgroundColor: typeColor,
          color: 'white',
          borderRadius: 1,
          p: 1,
          minHeight: 60,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <Typography variant="body2" fontWeight="bold" noWrap>
          {seance.matiere_code || seance.matiere_libelle?.substring(0, 10)}
        </Typography>
        <Typography variant="caption" noWrap>
          {seance.type_seance.toUpperCase()}
        </Typography>
        <Typography variant="caption" noWrap>
          {seance.salle_code || '-'}
        </Typography>
      </Box>
    </Tooltip>
  );
};

export default EmploiTempsGrid;
