/**
 * Formulaire de création/édition de matière
 */

import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  TextField,
  Button,
  Grid,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
} from '@mui/material';
import { getModules } from '../../services';
import type { Matiere, CreateMatiere, Module } from '../../types/reference';

interface MatiereFormProps {
  initialData?: Matiere | null;
  onSubmit: (data: CreateMatiere) => void;
  onCancel: () => void;
  loading?: boolean;
  selectedAnnee?: string;
}

const MatiereForm: React.FC<MatiereFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  selectedAnnee,
}) => {
  const isEditMode = !!initialData;
  const [modules, setModules] = useState<Module[]>([]);
  const [loadingModules, setLoadingModules] = useState(true);

  useEffect(() => {
    const loadModules = async () => {
      try {
        const data = await getModules();
        setModules(data);
      } catch (error) {
        console.error('Erreur chargement modules:', error);
      } finally {
        setLoadingModules(false);
      }
    };
    loadModules();
  }, []);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateMatiere>({
    defaultValues: {
      code: initialData?.code || '',
      libelle: initialData?.libelle || '',
      sigle: initialData?.sigle || '',
      annee: initialData?.annee || selectedAnnee || '',
      module_id: initialData?.module_id || undefined,
      tpe: initialData?.tpe || undefined,
      va: initialData?.va || undefined,
      vcvh: initialData?.vcvh || undefined,
      vp: initialData?.vp || undefined,
    },
  });

  const onFormSubmit = (data: CreateMatiere) => {
    onSubmit(data);
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onFormSubmit)} noValidate>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Controller
            name="code"
            control={control}
            rules={{
              required: 'Le code est requis',
              maxLength: { value: 255, message: 'Maximum 255 caractères' },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Code"
                fullWidth
                required
                error={!!errors.code}
                helperText={errors.code?.message}
                disabled={loading}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller
            name="sigle"
            control={control}
            rules={{
              maxLength: { value: 255, message: 'Maximum 255 caractères' },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Sigle"
                fullWidth
                error={!!errors.sigle}
                helperText={errors.sigle?.message}
                disabled={loading}
              />
            )}
          />
        </Grid>
        <Grid item xs={12}>
          <Controller
            name="libelle"
            control={control}
            rules={{
              required: 'Le libellé est requis',
              maxLength: { value: 255, message: 'Maximum 255 caractères' },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Libellé"
                fullWidth
                required
                error={!!errors.libelle}
                helperText={errors.libelle?.message}
                disabled={loading}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller
            name="module_id"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.module_id}>
                <InputLabel>Module</InputLabel>
                <Select
                  {...field}
                  label="Module"
                  disabled={loading || loadingModules}
                  endAdornment={loadingModules ? <CircularProgress size={20} /> : null}
                >
                  <MenuItem value="">Aucun</MenuItem>
                  {modules.map((m) => (
                    <MenuItem key={m.id} value={m.id}>
                      {m.code} - {m.libelle}
                    </MenuItem>
                  ))}
                </Select>
                {errors.module_id && (
                  <FormHelperText>{errors.module_id.message}</FormHelperText>
                )}
              </FormControl>
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller
            name="annee"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Année scolaire"
                fullWidth
                placeholder="2024-2025"
                disabled={loading}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller
            name="tpe"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="TPE"
                type="number"
                fullWidth
                disabled={loading}
                inputProps={{ step: 0.1 }}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller
            name="va"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="VA"
                type="number"
                fullWidth
                disabled={loading}
                inputProps={{ step: 0.1 }}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller
            name="vcvh"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="VCVH"
                type="number"
                fullWidth
                disabled={loading}
                inputProps={{ step: 0.1 }}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller
            name="vp"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="VP"
                type="number"
                fullWidth
                disabled={loading}
                inputProps={{ step: 0.1 }}
              />
            )}
          />
        </Grid>
      </Grid>
      <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
        <Button onClick={onCancel} disabled={loading}>
          Annuler
        </Button>
        <Button type="submit" variant="contained" disabled={loading}>
          {isEditMode ? 'Modifier' : 'Créer'}
        </Button>
      </Stack>
    </Box>
  );
};

export default MatiereForm;
