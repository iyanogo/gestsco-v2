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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Calculate as CalculateIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import regleCalculService from '../../services/regleCalculService';
import { usePermissions } from '../../hooks/usePermissions';
import { RegleCalcul, RegleCalculCreate } from '../../types/parametrage';

interface ReglesCalculManagementProps {
  showTitle?: boolean;
}

const ReglesCalculManagement: React.FC<ReglesCalculManagementProps> = ({ showTitle = true }) => {
  const { moduleActions } = usePermissions();
  const { canCreate, canUpdate, canDelete } = moduleActions('parametrage');
  const [regles, setRegles] = useState<RegleCalcul[]>([]);
  const [typesRegles, setTypesRegles] = useState<{ code: string; libelle: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRegle, setEditingRegle] = useState<RegleCalcul | null>(null);
  const [formData, setFormData] = useState<Partial<RegleCalculCreate>>({
    code: '',
    libelle: '',
    type_regle: 'moyenne_matiere',
    description: '',
    formule: '',
    ordre_execution: 0,
  });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const loadRegles = async () => {
    setLoading(true);
    try {
      const [data, types] = await Promise.all([
        regleCalculService.getAll(),
        regleCalculService.getTypes(),
      ]);
      setRegles(data);
      setTypesRegles(types);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      setSnackbar({ open: true, message: 'Erreur lors du chargement des règles', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRegles();
  }, []);

  const handleOpenDialog = (regle?: RegleCalcul) => {
    if (regle) {
      setEditingRegle(regle);
      setFormData({
        code: regle.code,
        libelle: regle.libelle,
        type_regle: regle.type_regle,
        description: regle.description || '',
        formule: regle.formule,
        ordre_execution: regle.ordre_execution,
      });
    } else {
      setEditingRegle(null);
      setFormData({
        code: '',
        libelle: '',
        type_regle: 'moyenne_matiere',
        description: '',
        formule: '',
        ordre_execution: 0,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingRegle(null);
  };

  const handleSave = async () => {
    try {
      if (editingRegle) {
        await regleCalculService.update(editingRegle.id, formData);
        setSnackbar({ open: true, message: 'Règle mise à jour avec succès', severity: 'success' });
      } else {
        await regleCalculService.create(formData as RegleCalculCreate);
        setSnackbar({ open: true, message: 'Règle créée avec succès', severity: 'success' });
      }
      handleCloseDialog();
      loadRegles();
    } catch (error) {
      console.error('Erreur:', error);
      setSnackbar({ open: true, message: 'Erreur lors de l\'enregistrement', severity: 'error' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette règle ?')) return;
    try {
      await regleCalculService.delete(id);
      setSnackbar({ open: true, message: 'Règle supprimée avec succès', severity: 'success' });
      loadRegles();
    } catch (error) {
      console.error('Erreur:', error);
      setSnackbar({ open: true, message: 'Erreur lors de la suppression', severity: 'error' });
    }
  };

  const getTypeLabel = (code: string) => typesRegles.find((t) => t.code === code)?.libelle || code;

  const addButton = canCreate ? (
    <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} size={showTitle ? 'medium' : 'small'}>
      Nouvelle règle
    </Button>
  ) : null;

  return (
    <Box>
      {showTitle ? (
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={1}>
            <CalculateIcon color="primary" />
            <Typography variant="h5">Règles de Calcul</Typography>
          </Box>
          {addButton}
        </Box>
      ) : (
        <Box display="flex" justifyContent="flex-end" mb={2}>{addButton}</Box>
      )}

      <Paper sx={{ p: 3 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : regles.length === 0 ? (
          <Alert severity="info">Aucune règle de calcul configurée.</Alert>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Libellé</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Formule</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {regles.map((regle) => (
                  <TableRow key={regle.id}>
                    <TableCell><code>{regle.code}</code></TableCell>
                    <TableCell>{regle.libelle}</TableCell>
                    <TableCell>
                      <Chip label={getTypeLabel(regle.type_regle)} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                        {regle.formule.length > 40 ? `${regle.formule.slice(0, 40)}…` : regle.formule}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {canUpdate && (
                        <Tooltip title="Modifier">
                          <IconButton size="small" onClick={() => handleOpenDialog(regle)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canDelete && !regle.est_systeme_defaut && (
                        <Tooltip title="Supprimer">
                          <IconButton size="small" color="error" onClick={() => handleDelete(regle.id)}>
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
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingRegle ? 'Modifier la règle' : 'Nouvelle règle de calcul'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                disabled={!!editingRegle}
                required
              />
            </Grid>
            <Grid item xs={8}>
              <TextField
                fullWidth
                label="Libellé"
                value={formData.libelle}
                onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                select
                label="Type de règle"
                value={formData.type_regle}
                onChange={(e) => setFormData({ ...formData, type_regle: e.target.value })}
              >
                {typesRegles.map((t) => (
                  <MenuItem key={t.code} value={t.code}>{t.libelle}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Ordre d'exécution"
                value={formData.ordre_execution}
                onChange={(e) => setFormData({ ...formData, ordre_execution: parseInt(e.target.value, 10) || 0 })}
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
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Formule"
                value={formData.formule}
                onChange={(e) => setFormData({ ...formData, formule: e.target.value })}
                multiline
                rows={3}
                required
                helperText="Expression de calcul (ex: sum(notes)/count(notes))"
                sx={{ '& textarea': { fontFamily: 'monospace' } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button onClick={handleSave} variant="contained">
            {editingRegle ? 'Mettre à jour' : 'Créer'}
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

export default ReglesCalculManagement;
