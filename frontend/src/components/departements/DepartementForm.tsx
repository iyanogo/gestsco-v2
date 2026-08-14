/**
 * Formulaire de création/édition de département
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
import { getEtablissements } from '../../services';
import type { Departement, CreateDepartement, Etablissement } from '../../types/reference';

interface DepartementFormProps {
  initialData?: Departement | null;
  onSubmit: (data: CreateDepartement) => void;
  onCancel: () => void;
  loading?: boolean;
}

const DepartementForm: React.FC<DepartementFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const isEditMode = !!initialData;
  const [etablissements, setEtablissements] = useState<Etablissement[]>([]);
  const [loadingEtablissements, setLoadingEtablissements] = useState(true);

  useEffect(() => {
    const loadEtablissements = async () => {
      try {
        const data = await getEtablissements();
        setEtablissements(data);
      } catch (error) {
        console.error('Erreur chargement établissements:', error);
      } finally {
        setLoadingEtablissements(false);
      }
    };
    loadEtablissements();
  }, []);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateDepartement>({
    defaultValues: {
      code: initialData?.code || '',
      libelle: initialData?.libelle || '',
      sigle: initialData?.sigle || '',
      etablissement_id: initialData?.etablissement_id || undefined,
    },
  });

  const onFormSubmit = (data: CreateDepartement) => {
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
        <Grid item xs={12}>
          <Controller
            name="etablissement_id"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.etablissement_id}>
                <InputLabel>Établissement</InputLabel>
                <Select
                  {...field}
                  label="Établissement"
                  disabled={loading || loadingEtablissements}
                  endAdornment={loadingEtablissements ? <CircularProgress size={20} /> : null}
                >
                  <MenuItem value="">Aucun</MenuItem>
                  {etablissements.map((e) => (
                    <MenuItem key={e.id} value={e.id}>
                      {e.sigle || e.nom}
                    </MenuItem>
                  ))}
                </Select>
                {errors.etablissement_id && (
                  <FormHelperText>{errors.etablissement_id.message}</FormHelperText>
                )}
              </FormControl>
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

export default DepartementForm;
