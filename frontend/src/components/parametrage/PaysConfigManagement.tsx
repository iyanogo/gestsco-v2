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
  MenuItem,
} from '@mui/material';
import { Public as PublicIcon, Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { usePermissions } from '../../hooks/usePermissions';
import { PaysConfigList } from './index';
import paysService from '../../services/paysService';
import { PaysConfiguration, PaysConfigurationCreate, SYSTEMES_NOTATION } from '../../types/parametrage';

interface PaysConfigManagementProps {
  showTitle?: boolean;
}

const PaysConfigManagement: React.FC<PaysConfigManagementProps> = ({ showTitle = true }) => {
  const { moduleActions } = usePermissions();
  const { canCreate, canUpdate, canDelete } = moduleActions('parametrage');
  const [pays, setPays] = useState<PaysConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPays, setEditingPays] = useState<PaysConfiguration | null>(null);
  const [formData, setFormData] = useState<Partial<PaysConfigurationCreate>>({
    code_pays: '',
    nom_pays: '',
    nom_pays_en: '',
    continent: 'Afrique',
    region: 'Afrique de l\'Ouest',
    systeme_educatif: 'LMD',
    langue_officielle: 'Français',
    devise_officielle: 'XOF',
    symbole_devise: 'FCFA',
    fuseau_horaire: 'Africa/Ouagadougou',
    note_min_defaut: 0,
    note_max_defaut: 20,
  });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const loadPays = async () => {
    setLoading(true);
    try {
      const data = await paysService.getAll();
      setPays(data);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      setSnackbar({ open: true, message: 'Erreur lors du chargement des pays', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPays();
  }, []);

  const handleOpenDialog = (p?: PaysConfiguration) => {
    if (p) {
      setEditingPays(p);
      setFormData({
        code_pays: p.code_pays,
        nom_pays: p.nom_pays,
        nom_pays_en: p.nom_pays_en || '',
        continent: p.continent,
        region: p.region || '',
        systeme_educatif: p.systeme_educatif,
        langue_officielle: p.langue_officielle,
        devise_officielle: p.devise_officielle,
        symbole_devise: p.symbole_devise || '',
        fuseau_horaire: p.fuseau_horaire,
        note_min_defaut: p.note_min_defaut,
        note_max_defaut: p.note_max_defaut,
      });
    } else {
      setEditingPays(null);
      setFormData({
        code_pays: '',
        nom_pays: '',
        nom_pays_en: '',
        continent: 'Afrique',
        region: 'Afrique de l\'Ouest',
        systeme_educatif: 'LMD',
        langue_officielle: 'Français',
        devise_officielle: 'XOF',
        symbole_devise: 'FCFA',
        fuseau_horaire: 'Africa/Ouagadougou',
        note_min_defaut: 0,
        note_max_defaut: 20,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPays(null);
  };

  const handleSave = async () => {
    try {
      if (editingPays) {
        await paysService.update(editingPays.id, formData);
        setSnackbar({ open: true, message: 'Configuration mise à jour avec succès', severity: 'success' });
      } else {
        await paysService.create(formData as PaysConfigurationCreate);
        setSnackbar({ open: true, message: 'Configuration créée avec succès', severity: 'success' });
      }
      handleCloseDialog();
      loadPays();
    } catch (error) {
      console.error('Erreur:', error);
      setSnackbar({ open: true, message: 'Erreur lors de l\'enregistrement', severity: 'error' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette configuration ?')) return;
    try {
      await paysService.delete(id);
      setSnackbar({ open: true, message: 'Configuration supprimée avec succès', severity: 'success' });
      loadPays();
    } catch (error) {
      console.error('Erreur:', error);
      setSnackbar({ open: true, message: 'Erreur lors de la suppression', severity: 'error' });
    }
  };

  const handleInitialiser = async () => {
    try {
      const result = await paysService.initialiser();
      setSnackbar({
        open: true,
        message: `${result.pays_crees} configurations de pays initialisées`,
        severity: 'success',
      });
      loadPays();
    } catch (error) {
      console.error('Erreur:', error);
      setSnackbar({ open: true, message: 'Erreur lors de l\'initialisation', severity: 'error' });
    }
  };

  const actionButtons = (canCreate || canUpdate) ? (
    <Box display="flex" gap={1}>
      {canCreate && (
        <Button variant="outlined" size={showTitle ? 'medium' : 'small'} startIcon={<RefreshIcon />} onClick={handleInitialiser}>
          Initialiser
        </Button>
      )}
      {canCreate && (
        <Button variant="contained" size={showTitle ? 'medium' : 'small'} startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Nouveau pays
        </Button>
      )}
    </Box>
  ) : null;

  return (
    <Box>
      {showTitle ? (
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={1}>
            <PublicIcon color="primary" />
            <Typography variant="h5">Configurations Pays</Typography>
          </Box>
          {actionButtons}
        </Box>
      ) : (
        <Box display="flex" justifyContent="flex-end" mb={2}>{actionButtons}</Box>
      )}

      <Paper sx={{ p: 3 }}>
        <PaysConfigList
          pays={pays}
          loading={loading}
          onEdit={canUpdate ? handleOpenDialog : undefined}
          onDelete={canDelete ? handleDelete : undefined}
        />
      </Paper>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingPays ? 'Modifier la configuration' : 'Nouvelle configuration pays'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Code pays (ISO)"
                value={formData.code_pays}
                onChange={(e) => setFormData({ ...formData, code_pays: e.target.value.toUpperCase() })}
                disabled={!!editingPays}
                required
                inputProps={{ maxLength: 3 }}
                helperText="Ex: BFA, CIV, SEN"
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Nom du pays"
                value={formData.nom_pays}
                onChange={(e) => setFormData({ ...formData, nom_pays: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Nom (anglais)"
                value={formData.nom_pays_en}
                onChange={(e) => setFormData({ ...formData, nom_pays_en: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Continent"
                value={formData.continent}
                onChange={(e) => setFormData({ ...formData, continent: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Région"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                select
                label="Système éducatif"
                value={formData.systeme_educatif}
                onChange={(e) => setFormData({ ...formData, systeme_educatif: e.target.value })}
              >
                {SYSTEMES_NOTATION.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Langue officielle"
                value={formData.langue_officielle}
                onChange={(e) => setFormData({ ...formData, langue_officielle: e.target.value })}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Devise"
                value={formData.devise_officielle}
                onChange={(e) => setFormData({ ...formData, devise_officielle: e.target.value })}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Symbole devise"
                value={formData.symbole_devise}
                onChange={(e) => setFormData({ ...formData, symbole_devise: e.target.value })}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Fuseau horaire"
                value={formData.fuseau_horaire}
                onChange={(e) => setFormData({ ...formData, fuseau_horaire: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Note minimale par défaut"
                value={formData.note_min_defaut}
                onChange={(e) => setFormData({ ...formData, note_min_defaut: parseFloat(e.target.value) })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Note maximale par défaut"
                value={formData.note_max_defaut}
                onChange={(e) => setFormData({ ...formData, note_max_defaut: parseFloat(e.target.value) })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button onClick={handleSave} variant="contained">
            {editingPays ? 'Mettre à jour' : 'Créer'}
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

export default PaysConfigManagement;
