/**
 * Formulaire de création/édition de niveau
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
import type { Niveau, CreateNiveau } from '../../types/reference';

interface NiveauFormProps {
  initialData?: Niveau | null;
  onSubmit: (data: CreateNiveau) => void;
  onCancel: () => void;
  loading?: boolean;
}

const NiveauForm: React.FC<NiveauFormProps> = ({
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
  } = useForm<CreateNiveau>({
    defaultValues: {
      code: initialData?.code || '',
      libelle: initialData?.libelle || '',
    },
  });

  const onFormSubmit = (data: CreateNiveau) => {
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

export default NiveauForm;
