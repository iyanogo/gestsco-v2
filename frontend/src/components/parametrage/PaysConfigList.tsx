import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Grid,
  Avatar,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Public as PublicIcon,
} from '@mui/icons-material';
import { PaysConfiguration } from '../../types/parametrage';

interface PaysConfigListProps {
  pays: PaysConfiguration[];
  loading: boolean;
  onEdit?: (pays: PaysConfiguration) => void;
  onDelete?: (id: number) => void;
}

const PaysConfigList: React.FC<PaysConfigListProps> = ({
  pays,
  loading,
  onEdit,
  onDelete,
}) => {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (pays.length === 0) {
    return (
      <Alert severity="info">
        Aucune configuration de pays disponible.
      </Alert>
    );
  }

  return (
    <Grid container spacing={2}>
      {pays.map((p) => (
        <Grid item xs={12} md={6} lg={4} key={p.id}>
          <Card variant="outlined">
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {p.drapeau_url ? (
                      <img src={p.drapeau_url} alt={p.code_pays} style={{ width: '100%' }} />
                    ) : (
                      <PublicIcon />
                    )}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{p.nom_pays}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {p.code_pays} | {p.region || p.continent}
                    </Typography>
                  </Box>
                </Box>
                {(onEdit || onDelete) && (
                  <Box>
                    {onEdit && (
                      <Tooltip title="Modifier">
                        <IconButton size="small" onClick={() => onEdit(p)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {onDelete && (
                      <Tooltip title="Supprimer">
                        <IconButton size="small" color="error" onClick={() => onDelete(p.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                )}
              </Box>

              <Box mt={2} display="flex" flexWrap="wrap" gap={1}>
                <Chip
                  label={p.devise_officielle}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={p.langue_officielle}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={p.systeme_educatif}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
              </Box>

              <Box mt={2}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Notation: {p.note_min_defaut} - {p.note_max_defaut} ({p.systeme_notation_defaut})
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Année académique: {p.debut_annee_academique} → {p.fin_annee_academique}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Fuseau: {p.fuseau_horaire}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default PaysConfigList;
