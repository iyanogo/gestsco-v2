import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Business as BusinessIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { ParametresList, ConfigurationForm } from './index';
import parametreService from '../../services/parametreService';
import configurationService from '../../services/configurationService';
import { usePermissions } from '../../hooks/usePermissions';
import { getEtablissements } from '../../services/etablissementService';
import {
  ConfigurationEtablissement,
  ConfigurationEtablissementCreate,
  ConfigurationEtablissementUpdate,
  ParametreSysteme,
} from '../../types/parametrage';

interface EtablissementOption {
  id: number;
  nom?: string;
  sigle?: string;
  code?: string;
}

interface ParametrageGenerauxManagementProps {
  showTitle?: boolean;
}

const ParametrageGenerauxManagement: React.FC<ParametrageGenerauxManagementProps> = ({
  showTitle = true,
}) => {
  const { moduleActions } = usePermissions();
  const { canCreate, canUpdate } = moduleActions('parametrage');
  const [activeTab, setActiveTab] = useState(0);

  const [parametresParCategorie, setParametresParCategorie] = useState<
    Record<string, ParametreSysteme[]>
  >({});
  const [loadingParametres, setLoadingParametres] = useState(true);

  const [configuration, setConfiguration] = useState<ConfigurationEtablissement | null>(null);
  const [pendingChanges, setPendingChanges] = useState<ConfigurationEtablissementUpdate>({});
  const [etablissements, setEtablissements] = useState<EtablissementOption[]>([]);
  const [selectedEtablissementId, setSelectedEtablissementId] = useState<number | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const loadParametres = async () => {
    setLoadingParametres(true);
    try {
      const data = await parametreService.getParCategorie();
      setParametresParCategorie(data);
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors du chargement des paramètres système',
        severity: 'error',
      });
    } finally {
      setLoadingParametres(false);
    }
  };

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
    setLoadingConfig(true);
    setPendingChanges({});
    try {
      const data = await configurationService.getByEtablissement(etabId);
      setConfiguration(data);
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        setConfiguration(null);
      } else {
        console.error('Erreur lors du chargement de la configuration:', error);
        setSnackbar({
          open: true,
          message: 'Erreur lors du chargement de la configuration établissement',
          severity: 'error',
        });
      }
    } finally {
      setLoadingConfig(false);
    }
  };

  useEffect(() => {
    loadParametres();
    loadEtablissements();
  }, []);

  useEffect(() => {
    if (selectedEtablissementId) {
      loadConfiguration(selectedEtablissementId);
    }
  }, [selectedEtablissementId]);

  const handleUpdateValeur = async (cle: string, valeur: unknown) => {
    await parametreService.updateValeur(cle, valeur);
    setSnackbar({
      open: true,
      message: 'Paramètre mis à jour',
      severity: 'success',
    });
    await loadParametres();
  };

  const handleInitialiserParametres = async () => {
    try {
      const result = await parametreService.initialiser();
      setSnackbar({
        open: true,
        message: `${result.parametres_crees} paramètre(s) initialisé(s)`,
        severity: 'success',
      });
      await loadParametres();
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
      setSnackbar({
        open: true,
        message: 'Initialisation réservée aux super-utilisateurs ou déjà effectuée',
        severity: 'error',
      });
    }
  };

  const handleCreateConfiguration = async () => {
    if (!selectedEtablissementId) return;

    const selectedEtab = etablissements.find((e) => e.id === selectedEtablissementId);
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
        message: 'Configuration créée',
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

  const handleConfigChange = (data: ConfigurationEtablissementUpdate) => {
    setPendingChanges({ ...pendingChanges, ...data });
    if (configuration) {
      setConfiguration({ ...configuration, ...data } as ConfigurationEtablissement);
    }
  };

  const handleSaveConfiguration = async () => {
    if (!configuration) return;

    setSaving(true);
    try {
      await configurationService.update(configuration.id, pendingChanges);
      setPendingChanges({});
      setSnackbar({
        open: true,
        message: 'Configuration enregistrée',
        severity: 'success',
      });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors de l\'enregistrement de la configuration',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const renderSystemeTab = () => (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={2} gap={1}>
        {canCreate && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={handleInitialiserParametres}
          >
            Initialiser par défaut
          </Button>
        )}
      </Box>
      <ParametresList
        parametresParCategorie={parametresParCategorie}
        loading={loadingParametres}
        onUpdateValeur={canUpdate ? handleUpdateValeur : undefined}
        onRefresh={loadParametres}
      />
    </Box>
  );

  const renderEtablissementTab = () => {
    if (loadingConfig) {
      return (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      );
    }

    if (!configuration) {
      return (
        <Box textAlign="center" py={4}>
          <Typography color="text.secondary" gutterBottom>
            Aucune configuration pour cet établissement.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateConfiguration}
            disabled={creating || !selectedEtablissementId || !canCreate}
          >
            {creating ? 'Création…' : 'Créer la configuration'}
          </Button>
        </Box>
      );
    }

    return (
      <Box>
        <Box display="flex" justifyContent="flex-end" mb={2}>
          {canUpdate && (
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
              onClick={handleSaveConfiguration}
              disabled={saving || Object.keys(pendingChanges).length === 0}
            >
              Enregistrer
            </Button>
          )}
        </Box>
        <ConfigurationForm configuration={configuration} onChange={handleConfigChange} />
      </Box>
    );
  };

  return (
    <Box>
      {showTitle && (
        <Typography variant="h6" gutterBottom>
          Paramétrage général
        </Typography>
      )}

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2 }}>
        <Tab icon={<SettingsIcon />} iconPosition="start" label="Paramètres système" />
        <Tab icon={<BusinessIcon />} iconPosition="start" label="Configuration établissement" />
      </Tabs>

      {activeTab === 1 && etablissements.length > 0 && (
        <FormControl fullWidth size="small" sx={{ mb: 2, maxWidth: 400 }}>
          <InputLabel>Établissement</InputLabel>
          <Select
            value={selectedEtablissementId ?? ''}
            label="Établissement"
            onChange={(e) => setSelectedEtablissementId(Number(e.target.value))}
          >
            {etablissements.map((etab) => (
              <MenuItem key={etab.id} value={etab.id}>
                {etab.sigle || etab.code || etab.nom || `Établissement #${etab.id}`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {activeTab === 1 && etablissements.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Aucun établissement dans le référentiel. Créez-en un avant de configurer l&apos;établissement.
        </Alert>
      )}

      <Paper sx={{ p: 2 }}>
        {activeTab === 0 ? renderSystemeTab() : renderEtablissementTab()}
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

export default ParametrageGenerauxManagement;
