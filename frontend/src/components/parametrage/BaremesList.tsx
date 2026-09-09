import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Collapse,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { BaremeNotation, MentionNotationCreate } from '../../types/parametrage';

interface BaremesListProps {
  baremes: BaremeNotation[];
  loading: boolean;
  onEdit?: (bareme: BaremeNotation) => void;
  onDelete?: (id: number) => void;
  onAddMention?: (baremeId: number, data: MentionNotationCreate) => Promise<void>;
  onDeleteMention?: (mentionId: number) => void;
}

const BaremesList: React.FC<BaremesListProps> = ({
  baremes,
  loading,
  onEdit,
  onDelete,
  onAddMention,
  onDeleteMention,
}) => {
  const [expandedBareme, setExpandedBareme] = useState<number | null>(null);
  const [mentionDialog, setMentionDialog] = useState<{ open: boolean; baremeId: number | null }>({
    open: false,
    baremeId: null,
  });
  const [newMention, setNewMention] = useState<Partial<MentionNotationCreate>>({
    code: '',
    libelle: '',
    note_min: 0,
    note_max: 20,
    couleur: '#4CAF50',
    ordre: 0,
  });

  const handleToggleExpand = (baremeId: number) => {
    setExpandedBareme(expandedBareme === baremeId ? null : baremeId);
  };

  const handleOpenMentionDialog = (baremeId: number) => {
    setMentionDialog({ open: true, baremeId });
    setNewMention({
      code: '',
      libelle: '',
      note_min: 0,
      note_max: 20,
      couleur: '#4CAF50',
      ordre: 0,
    });
  };

  const handleCloseMentionDialog = () => {
    setMentionDialog({ open: false, baremeId: null });
  };

  const handleSaveMention = async () => {
    if (!onAddMention) return;
    if (mentionDialog.baremeId && newMention.code && newMention.libelle) {
      await onAddMention(mentionDialog.baremeId, {
        bareme_id: mentionDialog.baremeId,
        code: newMention.code!,
        libelle: newMention.libelle!,
        note_min: newMention.note_min!,
        note_max: newMention.note_max!,
        couleur: newMention.couleur,
        ordre: newMention.ordre,
      });
      handleCloseMentionDialog();
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (baremes.length === 0) {
    return (
      <Alert severity="info">
        Aucun barème de notation configuré.
      </Alert>
    );
  }

  return (
    <Box>
      {baremes.map((bareme) => (
        <Card key={bareme.id} variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center" gap={1}>
                <IconButton size="small" onClick={() => handleToggleExpand(bareme.id)}>
                  {expandedBareme === bareme.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
                <Box>
                  <Typography variant="h6">
                    {bareme.libelle}
                    {bareme.est_systeme_defaut && (
                      <Tooltip title="Barème par défaut">
                        <StarIcon color="warning" sx={{ ml: 1, fontSize: 18 }} />
                      </Tooltip>
                    )}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Code: {bareme.code} | Notes: {bareme.note_min} - {bareme.note_max}
                  </Typography>
                </Box>
              </Box>
              <Box>
                <Chip
                  label={`${bareme.mentions?.length || 0} mentions`}
                  size="small"
                  sx={{ mr: 1 }}
                />
                {onEdit && (
                  <Tooltip title="Modifier">
                    <IconButton size="small" onClick={() => onEdit(bareme)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                )}
                {onDelete && (
                  <Tooltip title="Supprimer">
                    <IconButton size="small" color="error" onClick={() => onDelete(bareme.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>

            <Collapse in={expandedBareme === bareme.id}>
              <Box mt={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="subtitle2">Mentions</Typography>
                  {onAddMention && (
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => handleOpenMentionDialog(bareme.id)}
                    >
                      Ajouter une mention
                    </Button>
                  )}
                </Box>
                
                {bareme.mentions && bareme.mentions.length > 0 ? (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Code</TableCell>
                          <TableCell>Libellé</TableCell>
                          <TableCell align="center">Note min</TableCell>
                          <TableCell align="center">Note max</TableCell>
                          <TableCell align="center">Couleur</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {bareme.mentions
                          .sort((a, b) => a.ordre - b.ordre)
                          .map((mention) => (
                            <TableRow key={mention.id}>
                              <TableCell>{mention.code}</TableCell>
                              <TableCell>{mention.libelle}</TableCell>
                              <TableCell align="center">{mention.note_min}</TableCell>
                              <TableCell align="center">{mention.note_max}</TableCell>
                              <TableCell align="center">
                                <Box
                                  sx={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    backgroundColor: mention.couleur || '#ccc',
                                    display: 'inline-block',
                                  }}
                                />
                              </TableCell>
                              <TableCell align="right">
                                {onDeleteMention && (
                                  <Tooltip title="Supprimer">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => onDeleteMention(mention.id)}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Aucune mention définie
                  </Typography>
                )}
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      ))}

      {/* Dialog pour ajouter une mention */}
      <Dialog open={mentionDialog.open} onClose={handleCloseMentionDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Ajouter une mention</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Code"
                value={newMention.code}
                onChange={(e) => setNewMention({ ...newMention, code: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Libellé"
                value={newMention.libelle}
                onChange={(e) => setNewMention({ ...newMention, libelle: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Note minimale"
                value={newMention.note_min}
                onChange={(e) => setNewMention({ ...newMention, note_min: parseFloat(e.target.value) })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Note maximale"
                value={newMention.note_max}
                onChange={(e) => setNewMention({ ...newMention, note_max: parseFloat(e.target.value) })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="color"
                label="Couleur"
                value={newMention.couleur}
                onChange={(e) => setNewMention({ ...newMention, couleur: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Ordre"
                value={newMention.ordre}
                onChange={(e) => setNewMention({ ...newMention, ordre: parseInt(e.target.value) })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMentionDialog}>Annuler</Button>
          <Button onClick={handleSaveMention} variant="contained">
            Ajouter
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BaremesList;
