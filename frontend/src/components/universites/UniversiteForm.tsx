/**
 * Formulaire de création/édition d'université
 */

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  TextField,
  Button,
  Grid,
  Stack,
} from '@mui/material';
import type { Universite, CreateUniversite } from '../../types/reference';

interface UniversiteFormProps {
  initialData?: Universite | null;
  onSubmit: (data: CreateUniversite) => void;
  onCancel: () => void;
  loading?: boolean;
}

const UniversiteForm: React.FC<UniversiteFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const isEditMode = !!initialData;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUniversite>({
    defaultValues: {
      code: initialData?.code || '',
      nom: initialData?.nom || initialData?.libelle || '',
      sigle: initialData?.sigle || '',
      ville: initialData?.ville || '',
      adresse: initialData?.adresse || '',
      telephone: initialData?.telephone || '',
      fixe: initialData?.fixe || '',
      email: initialData?.email || '',
      site: initialData?.site || '',
    },
  });

  const onFormSubmit = (data: CreateUniversite) => {
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
              maxLength: { value: 20, message: 'Maximum 20 caractères' },
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
              maxLength: { value: 20, message: 'Maximum 20 caractères' },
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
            name="nom"
            control={control}
            rules={{
              required: 'Le nom est requis',
              maxLength: { value: 255, message: 'Maximum 255 caractères' },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Nom"
                fullWidth
                required
                error={!!errors.nom}
                helperText={errors.nom?.message}
                disabled={loading}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller
            name="ville"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Ville"
                fullWidth
                disabled={loading}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller
            name="adresse"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Adresse"
                fullWidth
                disabled={loading}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller
            name="telephone"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Téléphone"
                fullWidth
                disabled={loading}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller
            name="fixe"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Fixe"
                fullWidth
                disabled={loading}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller
            name="email"
            control={control}
            rules={{
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Email invalide',
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Email"
                type="email"
                fullWidth
                error={!!errors.email}
                helperText={errors.email?.message}
                disabled={loading}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller
            name="site"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Site web"
                fullWidth
                disabled={loading}
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

export default UniversiteForm;
