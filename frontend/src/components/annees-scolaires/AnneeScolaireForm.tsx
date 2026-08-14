/**
 * Formulaire de création/édition d'année scolaire
 */

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Grid,
  Stack,
} from '@mui/material';
import type { Annee, CreateAnnee } from '../../types/reference';

interface AnneeScolaireFormProps {
  initialData?: Annee | null;
  onSubmit: (data: CreateAnnee) => void;
  onCancel: () => void;
  loading?: boolean;
}

const AnneeScolaireForm: React.FC<AnneeScolaireFormProps> = ({
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
  } = useForm<CreateAnnee>({
    defaultValues: {
      code: initialData?.code || '',
      libelle: initialData?.libelle || '',
      statut: initialData?.statut ?? false,
    },
  });

  const onFormSubmit = (data: CreateAnnee) => {
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
              pattern: {
                value: /^\d{4}-\d{4}$/,
                message: 'Format attendu: AAAA-AAAA (ex: 2024-2025)',
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Code"
                fullWidth
                required
                placeholder="2024-2025"
                error={!!errors.code}
                helperText={errors.code?.message}
                disabled={loading}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
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
                placeholder="Année scolaire 2024-2025"
                error={!!errors.libelle}
                helperText={errors.libelle?.message}
                disabled={loading}
              />
            )}
          />
        </Grid>
        <Grid item xs={12}>
          <Controller
            name="statut"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    {...field}
                    checked={field.value}
                    disabled={loading}
                  />
                }
                label="Année scolaire active (sera l'année par défaut)"
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

export default AnneeScolaireForm;
