import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Grid,
  InputAdornment,
} from '@mui/material';
import { TypeFrais, CreateTypeFrais, UpdateTypeFrais, CATEGORIES_FRAIS, PERIODES_APPLICATION } from '../../types/finance';

interface TypeFraisFormProps {
  initialData?: TypeFrais | null;
  onSubmit: (data: CreateTypeFrais | UpdateTypeFrais) => void;
  onCancel: () => void;
  loading?: boolean;
}

const TypeFraisForm: React.FC<TypeFraisFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [formData, setFormData] = useState<CreateTypeFrais>({
    code: '',
    libelle: '',
    categorie: 'scolarite',
    montant_defaut: undefined,
    est_obligatoire: false,
    est_recurrent: false,
    periode_application: undefined,
    description: '',
    compte_comptable: '',
    is_active: true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        code: initialData.code,
        libelle: initialData.libelle,
        categorie: initialData.categorie,
        montant_defaut: initialData.montant_defaut || undefined,
        est_obligatoire: initialData.est_obligatoire,
        est_recurrent: initialData.est_recurrent,
        periode_application: initialData.periode_application || undefined,
        description: initialData.description || '',
        compte_comptable: initialData.compte_comptable || '',
        is_active: initialData.is_active,
      });
    }
  }, [initialData]);

  const handleChange = (field: keyof CreateTypeFrais, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            required
            label="Code"
            value={formData.code}
            onChange={(e) => handleChange('code', e.target.value)}
            disabled={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            required
            label="Libellé"
            value={formData.libelle}
            onChange={(e) => handleChange('libelle', e.target.value)}
            disabled={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel>Catégorie</InputLabel>
            <Select
              value={formData.categorie}
              label="Catégorie"
              onChange={(e) => handleChange('categorie', e.target.value)}
              disabled={loading}
            >
              {CATEGORIES_FRAIS.map((cat) => (
                <MenuItem key={cat.value} value={cat.value}>
                  {cat.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Montant par défaut"
            type="number"
            value={formData.montant_defaut || ''}
            onChange={(e) => handleChange('montant_defaut', e.target.value ? Number(e.target.value) : undefined)}
            InputProps={{
              endAdornment: <InputAdornment position="end">XOF</InputAdornment>,
            }}
            disabled={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.est_obligatoire}
                onChange={(e) => handleChange('est_obligatoire', e.target.checked)}
                disabled={loading}
              />
            }
            label="Frais obligatoire"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.est_recurrent}
                onChange={(e) => handleChange('est_recurrent', e.target.checked)}
                disabled={loading}
              />
            }
            label="Frais récurrent"
          />
        </Grid>
        {formData.est_recurrent && (
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Période d'application</InputLabel>
              <Select
                value={formData.periode_application || ''}
                label="Période d'application"
                onChange={(e) => handleChange('periode_application', e.target.value)}
                disabled={loading}
              >
                {PERIODES_APPLICATION.map((periode) => (
                  <MenuItem key={periode.value} value={periode.value}>
                    {periode.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Compte comptable"
            value={formData.compte_comptable}
            onChange={(e) => handleChange('compte_comptable', e.target.value)}
            disabled={loading}
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
            disabled={loading}
          />
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={onCancel} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {initialData ? 'Modifier' : 'Créer'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TypeFraisForm;
