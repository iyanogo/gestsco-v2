import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Grid,
  FormControlLabel,
  Checkbox,
  Typography,
  FormGroup,
  Divider,
} from '@mui/material';
import { Salle, CreateSalle, UpdateSalle, TYPES_SALLE, EQUIPEMENTS_SALLE, Batiment } from '../../types/emploiTemps';
import { batimentService } from '../../services/batimentService';

interface SalleFormProps {
  initialData?: Salle | null;
  onSubmit: (data: CreateSalle | UpdateSalle) => void;
  onCancel: () => void;
}

const SalleForm: React.FC<SalleFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [batiments, setBatiments] = useState<Batiment[]>([]);
  const [formData, setFormData] = useState<CreateSalle>({
    code: '',
    libelle: '',
    batiment_id: 0,
    type_salle: 'cours',
    etage: 0,
    capacite: 30,
    superficie: undefined,
    equipements: '',
    description: '',
    is_accessible_pmr: false,
    is_active: true,
  });
  const [selectedEquipements, setSelectedEquipements] = useState<string[]>([]);

  useEffect(() => {
    loadBatiments();
    if (initialData) {
      setFormData({
        code: initialData.code,
        libelle: initialData.libelle,
        batiment_id: initialData.batiment_id,
        type_salle: initialData.type_salle,
        etage: initialData.etage || 0,
        capacite: initialData.capacite,
        superficie: initialData.superficie,
        equipements: initialData.equipements || '',
        description: initialData.description || '',
        is_accessible_pmr: initialData.is_accessible_pmr,
        is_active: initialData.is_active,
      });
      if (initialData.equipements) {
        setSelectedEquipements(initialData.equipements.split(',').map((e) => e.trim()));
      }
    }
  }, [initialData]);

  const loadBatiments = async () => {
    try {
      const data = await batimentService.getBatiments();
      setBatiments(data);
    } catch (error) {
      console.error('Erreur lors du chargement des bâtiments:', error);
    }
  };

  const handleChange = (field: keyof CreateSalle, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEquipementChange = (equipement: string, checked: boolean) => {
    let newEquipements: string[];
    if (checked) {
      newEquipements = [...selectedEquipements, equipement];
    } else {
      newEquipements = selectedEquipements.filter((e) => e !== equipement);
    }
    setSelectedEquipements(newEquipements);
    setFormData((prev) => ({ ...prev, equipements: newEquipements.join(', ') }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            required
            label="Code"
            value={formData.code}
            onChange={(e) => handleChange('code', e.target.value)}
            helperText="Ex: S101, AMPHI-A"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            required
            label="Libellé"
            value={formData.libelle}
            onChange={(e) => handleChange('libelle', e.target.value)}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            select
            fullWidth
            required
            label="Bâtiment"
            value={formData.batiment_id || ''}
            onChange={(e) => handleChange('batiment_id', Number(e.target.value))}
          >
            {batiments.map((batiment) => (
              <MenuItem key={batiment.id} value={batiment.id}>
                {batiment.libelle}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            select
            fullWidth
            required
            label="Type de salle"
            value={formData.type_salle}
            onChange={(e) => handleChange('type_salle', e.target.value)}
          >
            {TYPES_SALLE.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            type="number"
            label="Étage"
            value={formData.etage}
            onChange={(e) => handleChange('etage', Number(e.target.value))}
            inputProps={{ min: 0 }}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            required
            type="number"
            label="Capacité"
            value={formData.capacite}
            onChange={(e) => handleChange('capacite', Number(e.target.value))}
            inputProps={{ min: 1 }}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            type="number"
            label="Superficie (m²)"
            value={formData.superficie || ''}
            onChange={(e) => handleChange('superficie', e.target.value ? Number(e.target.value) : undefined)}
            inputProps={{ min: 0, step: 0.1 }}
          />
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 1 }} />
          <Typography variant="subtitle2" gutterBottom>
            Équipements
          </Typography>
          <FormGroup row>
            {EQUIPEMENTS_SALLE.map((equipement) => (
              <FormControlLabel
                key={equipement.value}
                control={
                  <Checkbox
                    checked={selectedEquipements.includes(equipement.value)}
                    onChange={(e) => handleEquipementChange(equipement.value, e.target.checked)}
                  />
                }
                label={equipement.label}
              />
            ))}
          </FormGroup>
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.is_accessible_pmr}
                onChange={(e) => handleChange('is_accessible_pmr', e.target.checked)}
              />
            }
            label="Accessible aux personnes à mobilité réduite (PMR)"
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
          />
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={onCancel}>
              Annuler
            </Button>
            <Button type="submit" variant="contained">
              {initialData ? 'Modifier' : 'Créer'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SalleForm;
