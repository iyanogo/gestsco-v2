/**
 * Composant Card pour afficher les infos d'un étudiant
 */

import React from 'react';
import {
  Card,
  CardContent,
  Avatar,
  Typography,
  Chip,
  Stack,
  Box,
  Divider,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Cake as CakeIcon,
} from '@mui/icons-material';
import type { Etudiant } from '../../types/etudiant';
import { STATUT_COLORS } from '../../types/etudiant';

interface EtudiantCardProps {
  etudiant: Etudiant;
  onClick?: () => void;
}

const EtudiantCard: React.FC<EtudiantCardProps> = ({ etudiant, onClick }) => {
  const calculateAge = (dateNaissance?: string): number | null => {
    if (!dateNaissance) return null;
    const today = new Date();
    const birthDate = new Date(dateNaissance);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR');
    } catch {
      return dateString;
    }
  };

  const age = calculateAge(etudiant.date_naissance);
  const statut = etudiant.statut || 'actif';

  return (
    <Card
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        } : {},
      }}
      onClick={onClick}
    >
      <CardContent>
        <Stack spacing={2}>
          {/* En-tête avec photo et nom */}
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              src={etudiant.photo_url}
              sx={{ width: 64, height: 64 }}
            >
              <PersonIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" component="div">
                {etudiant.nom?.toUpperCase()} {etudiant.prenom}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {etudiant.matricule || 'Sans matricule'}
              </Typography>
              <Chip
                label={statut}
                size="small"
                color={STATUT_COLORS[statut] || 'default'}
                sx={{ mt: 0.5 }}
              />
            </Box>
          </Stack>

          <Divider />

          {/* Informations de contact */}
          <Stack spacing={1}>
            {etudiant.email && (
              <Stack direction="row" spacing={1} alignItems="center">
                <EmailIcon fontSize="small" color="action" />
                <Typography variant="body2">{etudiant.email}</Typography>
              </Stack>
            )}
            {etudiant.telephone && (
              <Stack direction="row" spacing={1} alignItems="center">
                <PhoneIcon fontSize="small" color="action" />
                <Typography variant="body2">{etudiant.telephone}</Typography>
              </Stack>
            )}
            {etudiant.date_naissance && (
              <Stack direction="row" spacing={1} alignItems="center">
                <CakeIcon fontSize="small" color="action" />
                <Typography variant="body2">
                  {formatDate(etudiant.date_naissance)}
                  {age !== null && ` (${age} ans)`}
                </Typography>
              </Stack>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default EtudiantCard;
