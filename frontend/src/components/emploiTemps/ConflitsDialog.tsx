import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Box,
  Divider,
} from '@mui/material';
import {
  MeetingRoom as RoomIcon,
  Person as PersonIcon,
  Warning as WarningIcon,
  Lightbulb as SuggestionIcon,
} from '@mui/icons-material';
import { Conflits } from '../../types/emploiTemps';

interface ConflitsDialogProps {
  open: boolean;
  onClose: () => void;
  conflits: Conflits;
}

const ConflitsDialog: React.FC<ConflitsDialogProps> = ({ open, onClose, conflits }) => {
  const hasConflitSalle = conflits.salle !== null;
  const hasConflitEnseignant = conflits.enseignant !== null;
  const hasConflits = hasConflitSalle || hasConflitEnseignant;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon color="warning" />
        Conflits détectés
      </DialogTitle>
      <DialogContent>
        {!hasConflits ? (
          <Alert severity="success">
            Aucun conflit détecté. La séance peut être créée.
          </Alert>
        ) : (
          <>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Des conflits ont été détectés. Veuillez les résoudre avant de continuer.
            </Alert>

            {hasConflitSalle && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="error" gutterBottom>
                  Conflit de salle
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <RoomIcon color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`Séance ${conflits.salle?.code}`}
                      secondary={`La salle est déjà occupée par cette séance`}
                    />
                  </ListItem>
                </List>
                <Box sx={{ pl: 2, mt: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SuggestionIcon fontSize="small" color="info" />
                    <strong>Suggestion:</strong> Choisissez une autre salle ou un autre créneau
                  </Typography>
                </Box>
              </Box>
            )}

            {hasConflitSalle && hasConflitEnseignant && <Divider sx={{ my: 2 }} />}

            {hasConflitEnseignant && (
              <Box>
                <Typography variant="subtitle2" color="error" gutterBottom>
                  Conflit d'enseignant
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <PersonIcon color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`Séance ${conflits.enseignant?.code}`}
                      secondary={`L'enseignant a déjà une séance à ce créneau`}
                    />
                  </ListItem>
                </List>
                <Box sx={{ pl: 2, mt: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SuggestionIcon fontSize="small" color="info" />
                    <strong>Suggestion:</strong> Choisissez un autre enseignant ou un autre créneau
                  </Typography>
                </Box>
              </Box>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Compris
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConflitsDialog;
