import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
} from '@mui/material';
import {
  Grade as GradeIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { BaremesList } from '../components/parametrage';
import baremeService from '../services/baremeService';
import { BaremeNotation, BaremeNotationCreate, MentionNotationCreate } from '../types/parametrage';

const BaremesPage: React.FC = () => {
  const [baremes, setBaremes] = useState<BaremeNotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBareme, setEditingBareme] = useState<BaremeNotation | null>(null);
  const [formData, setFormData] = useState<Partial<BaremeNotationCreate>>({
    code: '',
    libelle: '',
    description: '',
    note_min: 0,
    note_max: 20,
  });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const loadBaremes = async () => {
    setLoading(true);
    try {
      const data = await baremeService.getAll();
      // Charger les mentions pour chaque barème
      const baremesWithMentions = await Promise.all(
        data.map(async (b) => {
          const full = await baremeService.getById(b.id);
          return full;
        })
      );
      setBaremes(baremesWithMentions);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors du chargement des barèmes',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBaremes();
  }, []);

  const handleOpenDialog = (bareme?: BaremeNotation) => {
    if (bareme) {
      setEditingBareme(bareme);
      setFormData({
        code: bareme.code,
        libelle: bareme.libelle,
        description: bareme.description || '',
        note_min: bareme.note_min,
        note_max: bareme.note_max,
      });
    } else {
      setEditingBareme(null);
      setFormData({
        code: '',
        libelle: '',
        description: '',
        note_min: 0,
        note_max: 20,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingBareme(null);
  };

  const handleSave = async () => {
    try {
      if (editingBareme) {
        await baremeService.update(editingBareme.id, formData);
        setSnackbar({
          open: true,
          message: 'Barème mis à jour avec succès',
          severity: 'success',
        });
      } else {
        await baremeService.create(formData as BaremeNotationCreate);
        setSnackbar({
          open: true,
          message: 'Barème créé avec succès',
          severity: 'success',
        });
      }
      handleCloseDialog();
      loadBaremes();
    } catch (error) {
      console.error('Erreur:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors de l\'enregistrement',
        severity: 'error',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce barème ?')) return;

    try {
      await baremeService.delete(id);
      setSnackbar({
        open: true,
        message: 'Barème supprimé avec succès',
        severity: 'success',
      });
      loadBaremes();
    } catch (error) {
      console.error('Erreur:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors de la suppression',
        severity: 'error',
      });
    }
  };

  const handleAddMention = async (baremeId: number, data: MentionNotationCreate) => {
    try {
      await baremeService.createMention(baremeId, data);
      setSnackbar({
        open: true,
        message: 'Mention ajoutée avec succès',
        severity: 'success',
      });
      loadBaremes();
    } catch (error) {
      console.error('Erreur:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors de l\'ajout de la mention',
        severity: 'error',
      });
    }
  };

  const handleDeleteMention = async (mentionId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette mention ?')) return;

    try {
      await baremeService.deleteMention(mentionId);
      setSnackbar({
        open: true,
        message: 'Mention supprimée avec succès',
        severity: 'success',
      });
      loadBaremes();
    } catch (error) {
      console.error('Erreur:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors de la suppression',
        severity: 'error',
      });
    }
  };

  const handleInitialiser = async () => {
    try {
      const result = await baremeService.initialiser();
      setSnackbar({
        open: true,
        message: `${result.baremes_crees} barèmes initialisés`,
        severity: 'success',
      });
      loadBaremes();
    } catch (error) {
      console.error('Erreur:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors de l\'initialisation',
        severity: 'error',
      });
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <GradeIcon color="primary" />
          <Typography variant="h5">Barèmes de Notation</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleInitialiser}
          >
            Initialiser
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Nouveau barème
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 3 }}>
        <BaremesList
          baremes={baremes}
          loading={loading}
          onEdit={handleOpenDialog}
          onDelete={handleDelete}
          onAddMention={handleAddMention}
          onDeleteMention={handleDeleteMention}
        />
      </Paper>

      {/* Dialog pour créer/modifier un barème */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingBareme ? 'Modifier le barème' : 'Nouveau barème'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                disabled={!!editingBareme}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Libellé"
                value={formData.libelle}
                onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Note minimale"
                value={formData.note_min}
                onChange={(e) => setFormData({ ...formData, note_min: parseFloat(e.target.value) })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Note maximale"
                value={formData.note_max}
                onChange={(e) => setFormData({ ...formData, note_max: parseFloat(e.target.value) })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button onClick={handleSave} variant="contained">
            {editingBareme ? 'Mettre à jour' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BaremesPage;
