/**
 * Formulaire de création/édition d'établissement
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
import { getUniversites } from '../../services';
import type { Etablissement, CreateEtablissement, Universite } from '../../types/reference';

interface EtablissementFormProps {
  initialData?: Etablissement | null;
  onSubmit: (data: CreateEtablissement) => void;
  onCancel: () => void;
  loading?: boolean;
}

const EtablissementForm: React.FC<EtablissementFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const isEditMode = !!initialData;
  const [universites, setUniversites] = useState<Universite[]>([]);
  const [loadingUniversites, setLoadingUniversites] = useState(true);

  useEffect(() => {
    const loadUniversites = async () => {
      try {
        const data = await getUniversites();
        setUniversites(data);
      } catch (error) {
        console.error('Erreur chargement universités:', error);
      } finally {
        setLoadingUniversites(false);
      }
    };
    loadUniversites();
  }, []);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateEtablissement>({
    defaultValues: {
      code: initialData?.code || '',
      nom: initialData?.nom || '',
      sigle: initialData?.sigle || '',
      ville: initialData?.ville || '',
      adresse: initialData?.adresse || '',
      telephone: initialData?.telephone || '',
      fixe: initialData?.fixe || '',
      email: initialData?.email || '',
      universite_id: initialData?.universite_id || undefined,
      nom_directeur: initialData?.nom_directeur || '',
      prenom_directeur: initialData?.prenom_directeur || '',
      tel_directeur: initialData?.tel_directeur || '',
    },
  });

  const onFormSubmit = (data: CreateEtablissement) => {
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
            name="universite_id"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.universite_id}>
                <InputLabel>Université</InputLabel>
                <Select
                  {...field}
                  label="Université"
                  disabled={loading || loadingUniversites}
                  endAdornment={loadingUniversites ? <CircularProgress size={20} /> : null}
                >
                  <MenuItem value="">Aucune</MenuItem>
                  {universites.map((u) => (
                    <MenuItem key={u.id} value={u.id}>
                      {u.sigle || u.nom}
                    </MenuItem>
                  ))}
                </Select>
                {errors.universite_id && (
                  <FormHelperText>{errors.universite_id.message}</FormHelperText>
                )}
              </FormControl>
            )}
          />
        </Grid>
        <Grid item xs={12}>
          <Controller
            name="adresse"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Adresse"
                fullWidth
                multiline
                rows={2}
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
        <Grid item xs={12}>
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
        <Grid item xs={12} sm={4}>
          <Controller
            name="nom_directeur"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Nom du directeur"
                fullWidth
                disabled={loading}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller
            name="prenom_directeur"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Prénom du directeur"
                fullWidth
                disabled={loading}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller
            name="tel_directeur"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Tél. du directeur"
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

export default EtablissementForm;
