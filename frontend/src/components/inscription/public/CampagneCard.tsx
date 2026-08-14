/**
 * Card pour afficher une campagne publique
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  Divider,
  Stack,
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  Payment as PaymentIcon,
  People as PeopleIcon,
} from '@mui/icons-material';

import { CampagneInscription } from '../../../types/inscription';

interface CampagneCardProps {
  campagne: CampagneInscription;
  placesRestantes?: number | null;
  onSelect: (campagne: CampagneInscription) => void;
}

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const formatMoney = (value: number): string => {
  return `${value.toLocaleString('fr-FR')} FCFA`;
};

const CampagneCard: React.FC<CampagneCardProps> = ({ campagne, placesRestantes, onSelect }) => {
  const isOpen = campagne.statut === 'ouverte';
  const totalFrais = campagne.frais_inscription + campagne.frais_dossier;

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        {/* En-tête avec badge */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Typography variant="h6" component="h2" fontWeight="bold">
            {campagne.libelle}
          </Typography>
          {isOpen && (
            <Chip
              label="Ouvert"
              color="success"
              size="small"
              sx={{ fontWeight: 'bold' }}
            />
          )}
        </Box>

        {/* Cycle */}
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {campagne.cycle?.libelle || 'Cycle non défini'}
        </Typography>

        <Divider sx={{ my: 2 }} />

        {/* Informations */}
        <Stack spacing={1.5}>
          {/* Dates */}
          <Box display="flex" alignItems="center" gap={1}>
            <CalendarIcon fontSize="small" color="action" />
            <Typography variant="body2">
              Du {formatDate(campagne.date_ouverture)} au {formatDate(campagne.date_cloture)}
            </Typography>
          </Box>

          {/* Frais */}
          <Box display="flex" alignItems="center" gap={1}>
            <PaymentIcon fontSize="small" color="action" />
            <Typography variant="body2">
              Frais total: <strong>{formatMoney(totalFrais)}</strong>
            </Typography>
          </Box>

          {/* Places */}
          {campagne.nombre_places && (
            <Box display="flex" alignItems="center" gap={1}>
              <PeopleIcon fontSize="small" color="action" />
              <Typography variant="body2">
                {placesRestantes !== null && placesRestantes !== undefined ? (
                  <>
                    <strong>{placesRestantes}</strong> places restantes sur {campagne.nombre_places}
                  </>
                ) : (
                  <>{campagne.nombre_places} places disponibles</>
                )}
              </Typography>
            </Box>
          )}
        </Stack>

        {/* Description */}
        {campagne.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 2,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {campagne.description}
          </Typography>
        )}
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          variant="contained"
          fullWidth
          onClick={() => onSelect(campagne)}
          disabled={!isOpen || (placesRestantes !== null && placesRestantes !== undefined && placesRestantes <= 0)}
        >
          {!isOpen
            ? 'Inscriptions fermées'
            : placesRestantes !== null && placesRestantes !== undefined && placesRestantes <= 0
            ? 'Complet'
            : "S'inscrire"}
        </Button>
      </CardActions>
    </Card>
  );
};

export default CampagneCard;
