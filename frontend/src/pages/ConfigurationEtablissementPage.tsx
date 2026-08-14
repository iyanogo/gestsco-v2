import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  Snackbar,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Save as SaveIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { ConfigurationForm } from '../components/parametrage';
import configurationService from '../services/configurationService';
import { getEtablissements } from '../services/etablissementService';
import { ConfigurationEtablissement, ConfigurationEtablissementUpdate, ConfigurationEtablissementCreate } from '../types/parametrage';

interface Etablissement {
  id: number;
  nom?: string;
  sigle?: string;
  code?: string;
}

const ConfigurationEtablissementPage: React.FC = () => {
  const [configuration, setConfiguration] = useState<ConfigurationEtablissement | null>(null);
  const [pendingChanges, setPendingChanges] = useState<ConfigurationEtablissementUpdate>({});
  const [etablissements, setEtablissements] = useState<Etablissement[]>([]);
  const [selectedEtablissementId, setSelectedEtablissementId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const loadEtablissements = async () => {
    try {
      const data = await getEtablissements();
      setEtablissements(data);
      if (data.length > 0 && !selectedEtablissementId) {
        setSelectedEtablissementId(data[0].id);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des établissements:', error);
    }
  };

  const loadConfiguration = async (etabId: number) => {
    setLoading(true);
    try {
      const data = await configurationService.getByEtablissement(etabId);
      setConfiguration(data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setConfiguration(null);
      } else {
        console.error('Erreur lors du chargement:', error);
        setSnackbar({
          open: true,
          message: 'Erreur lors du chargement de la configuration',
          severity: 'error',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEtablissements();
  }, []);

  useEffect(() => {
    if (selectedEtablissementId) {
      loadConfiguration(selectedEtablissementId);
    }
  }, [selectedEtablissementId]);

  const handleCreateConfiguration = async () => {
    if (!selectedEtablissementId) return;
    
    const selectedEtab = etablissements.find(e => e.id === selectedEtablissementId);
    if (!selectedEtab) return;

    setCreating(true);
    try {
      const newConfig: ConfigurationEtablissementCreate = {
        etablissement_id: selectedEtablissementId,
        nom_complet: selectedEtab.nom || 'Établissement',
        nom_court: selectedEtab.sigle || selectedEtab.nom || 'Établissement',
      };
      const created = await configurationService.create(newConfig);
      setConfiguration(created);
      setSnackbar({
        open: true,
        message: 'Configuration créée avec succès',
        severity: 'success',
      });
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors de la création de la configuration',
        severity: 'error',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleChange = (data: ConfigurationEtablissementUpdate) => {
    setPendingChanges({ ...pendingChanges, ...data });
    if (configuration) {
      setConfiguration({ ...configuration, ...data } as ConfigurationEtablissement);
    }
  };

  const handleSave = async () => {
    if (!configuration) return;

    setSaving(true);
    try {
      await configurationService.update(configuration.id, pendingChanges);
      setPendingChanges({});
      setSnackbar({
        open: true,
        message: 'Configuration enregistrée avec succès',
        severity: 'success',
      });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors de l\'enregistrement',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  if (!configuration) {
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={1}>
            <BusinessIcon color="primary" />
            <Typography variant="h5">Configuration de l'Établissement</Typography>
          </Box>
        </Box>

        {etablissements.length > 0 && (
          <Box mb={3}>
            <FormControl sx={{ minWidth: 300 }}>
              <InputLabel>Établissement</InputLabel>
              <Select
                value={selectedEtablissementId || ''}
                label="Établissement"
                onChange={(e) => setSelectedEtablissementId(e.target.value as number)}
              >
                {etablissements.map((etab) => (
                  <MenuItem key={etab.id} value={etab.id}>
                    {etab.nom} {etab.sigle ? `(${etab.sigle})` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        <Alert 
          severity="warning" 
          action={
            <Button 
              color="inherit" 
              size="small" 
              startIcon={creating ? <CircularProgress size={16} /> : <AddIcon />}
              onClick={handleCreateConfiguration}
              disabled={creating || !selectedEtablissementId}
            >
              Créer la configuration
            </Button>
          }
        >
          Aucune configuration trouvée pour cet établissement.
        </Alert>

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
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <BusinessIcon color="primary" />
          <Typography variant="h5">Configuration de l'Établissement</Typography>
          {etablissements.length > 1 && (
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <Select
                value={selectedEtablissementId || ''}
                onChange={(e) => setSelectedEtablissementId(e.target.value as number)}
                displayEmpty
              >
                {etablissements.map((etab) => (
                  <MenuItem key={etab.id} value={etab.id}>
                    {etab.sigle || etab.nom}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving || Object.keys(pendingChanges).length === 0}
        >
          Enregistrer
        </Button>
      </Box>

      <Paper sx={{ p: 3 }}>
        <ConfigurationForm
          configuration={configuration}
          onChange={handleChange}
        />
      </Paper>

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

export default ConfigurationEtablissementPage;
