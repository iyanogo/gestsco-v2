/**
 * Formulaire de création/édition de module
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
import { getFilieres } from '../../services';
import type { Module, CreateModule, Filiere } from '../../types/reference';

interface ModuleFormProps {
  initialData?: Module | null;
  onSubmit: (data: CreateModule) => void;
  onCancel: () => void;
  loading?: boolean;
  selectedAnnee?: string;
}

const ModuleForm: React.FC<ModuleFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  selectedAnnee,
}) => {
  const isEditMode = !!initialData;
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getFilieres();
        setFilieres(data);
      } catch (error) {
        console.error('Erreur chargement données:', error);
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, []);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateModule>({
    defaultValues: {
      code: initialData?.code || '',
      libelle: initialData?.libelle || '',
      sigle: initialData?.sigle || '',
      annee: initialData?.annee || selectedAnnee || '',
      vol_horaire: initialData?.vol_horaire || '',
      filiere_id: initialData?.filiere_id || undefined,
      tpe: initialData?.tpe || undefined,
      va: initialData?.va || undefined,
      vcvh: initialData?.vcvh || undefined,
      vp: initialData?.vp || undefined,
    },
  });

  const onFormSubmit = (data: CreateModule) => {
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
            name="filiere_id"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.filiere_id}>
                <InputLabel>Filière</InputLabel>
                <Select
                  {...field}
                  label="Filière"
                  disabled={loading || loadingData}
                  endAdornment={loadingData ? <CircularProgress size={20} /> : null}
                >
                  <MenuItem value="">Aucune</MenuItem>
                  {filieres.map((f) => (
                    <MenuItem key={f.id} value={f.id}>
                      {f.sigle || f.libelle}
                    </MenuItem>
                  ))}
                </Select>
                {errors.filiere_id && (
                  <FormHelperText>{errors.filiere_id.message}</FormHelperText>
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
            name="vol_horaire"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Volume horaire"
                fullWidth
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
        <Grid item xs={12} sm={4}>
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
        <Grid item xs={12} sm={4}>
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
        <Grid item xs={12} sm={4}>
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

export default ModuleForm;
