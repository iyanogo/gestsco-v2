/**
 * Formulaire pour créer/modifier une campagne d'inscription
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tab,
  Tabs,
  Alert,
  SelectChangeEvent,
} from '@mui/material';

import { CampagneInscription, CreateCampagneInscription, UpdateCampagneInscription, AnneeAcademique } from '../../types/inscription';
import { Cycle } from '../../types/reference';
import { anneeAcademiqueService } from '../../services';
import { getCycles } from '../../services/cycleService';

interface CampagneFormProps {
  initialData?: CampagneInscription | null;
  onSubmit: (data: CreateCampagneInscription | UpdateCampagneInscription) => Promise<void>;
  onCancel: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const CampagneForm: React.FC<CampagneFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [annees, setAnnees] = useState<AnneeAcademique[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    code: initialData?.code || '',
    libelle: initialData?.libelle || '',
    annee_academique_id: initialData?.annee_academique_id?.toString() || '',
    cycle_id: initialData?.cycle_id?.toString() || '',
    description: initialData?.description || '',
    conditions: initialData?.conditions || '',
    date_ouverture: initialData?.date_ouverture?.split('T')[0] || '',
    date_cloture: initialData?.date_cloture?.split('T')[0] || '',
    date_limite_paiement: initialData?.date_limite_paiement?.split('T')[0] || '',
    frais_inscription: initialData?.frais_inscription?.toString() || '0',
    frais_dossier: initialData?.frais_dossier?.toString() || '0',
    nombre_places: initialData?.nombre_places?.toString() || '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [anneesData, cyclesData] = await Promise.all([
          anneeAcademiqueService.getAnnees(),
          getCycles(),
        ]);
        setAnnees(anneesData);
        setCycles(cyclesData);
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.code || !formData.libelle) {
      setError('Le code et le libellé sont obligatoires');
      return false;
    }
    if (!formData.annee_academique_id || !formData.cycle_id) {
      setError('L\'année académique et le cycle sont obligatoires');
      return false;
    }
    if (!formData.date_ouverture || !formData.date_cloture) {
      setError('Les dates d\'ouverture et de clôture sont obligatoires');
      return false;
    }
    if (new Date(formData.date_cloture) <= new Date(formData.date_ouverture)) {
      setError('La date de clôture doit être postérieure à la date d\'ouverture');
      return false;
    }
    const fraisInscription = parseFloat(formData.frais_inscription);
    const fraisDossier = parseFloat(formData.frais_dossier);
    if (fraisInscription < 0 || fraisDossier < 0) {
      setError('Les frais doivent être positifs ou nuls');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setLoading(true);
    try {
      const data: CreateCampagneInscription = {
        code: formData.code,
        libelle: formData.libelle,
        annee_academique_id: parseInt(formData.annee_academique_id),
        cycle_id: parseInt(formData.cycle_id),
        description: formData.description || undefined,
        conditions: formData.conditions || undefined,
        date_ouverture: formData.date_ouverture,
        date_cloture: formData.date_cloture,
        date_limite_paiement: formData.date_limite_paiement || undefined,
        frais_inscription: parseFloat(formData.frais_inscription) || 0,
        frais_dossier: parseFloat(formData.frais_dossier) || 0,
        nombre_places: formData.nombre_places ? parseInt(formData.nombre_places) : undefined,
      };
      await onSubmit(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
        <Tab label="Informations générales" />
        <Tab label="Dates et frais" />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Code"
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="Ex: CAMP-2024-LIC"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Libellé"
              name="libelle"
              value={formData.libelle}
              onChange={handleChange}
              placeholder="Ex: Campagne Licence 2024-2025"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Année académique</InputLabel>
              <Select
                name="annee_academique_id"
                value={formData.annee_academique_id}
                label="Année académique"
                onChange={handleSelectChange}
              >
                {annees.map((annee) => (
                  <MenuItem key={annee.id} value={annee.id.toString()}>
                    {annee.libelle}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Cycle</InputLabel>
              <Select
                name="cycle_id"
                value={formData.cycle_id}
                label="Cycle"
                onChange={handleSelectChange}
              >
                {cycles.map((cycle) => (
                  <MenuItem key={cycle.id} value={cycle.id.toString()}>
                    {cycle.libelle}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Description de la campagne..."
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Conditions d'inscription"
              name="conditions"
              value={formData.conditions}
              onChange={handleChange}
              placeholder="Conditions requises pour s'inscrire..."
            />
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              required
              type="date"
              label="Date d'ouverture"
              name="date_ouverture"
              value={formData.date_ouverture}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              required
              type="date"
              label="Date de clôture"
              name="date_cloture"
              value={formData.date_cloture}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="date"
              label="Date limite paiement"
              name="date_limite_paiement"
              value={formData.date_limite_paiement}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              label="Frais d'inscription (FCFA)"
              name="frais_inscription"
              value={formData.frais_inscription}
              onChange={handleChange}
              inputProps={{ min: 0 }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              label="Frais de dossier (FCFA)"
              name="frais_dossier"
              value={formData.frais_dossier}
              onChange={handleChange}
              inputProps={{ min: 0 }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              label="Nombre de places"
              name="nombre_places"
              value={formData.nombre_places}
              onChange={handleChange}
              inputProps={{ min: 0 }}
              placeholder="Laisser vide si illimité"
            />
          </Grid>
        </Grid>
      </TabPanel>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button variant="outlined" onClick={onCancel} disabled={loading}>
          Annuler
        </Button>
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? 'Enregistrement...' : initialData ? 'Modifier' : 'Créer'}
        </Button>
      </Box>
    </Box>
  );
};

export default CampagneForm;
