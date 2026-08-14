/**
 * Formulaire pour créer une inscription
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  FormHelperText,
  CircularProgress,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import type { CreateInscription } from '../../types/etudiant';
import { TYPES_INSCRIPTION, REGIMES_ETUDES } from '../../types/etudiant';
import { getFilieres } from '../../services/filiereService';
import { getNiveaux } from '../../services/niveauService';
import type { Filiere, Niveau } from '../../types/reference';

interface InscriptionFormProps {
  etudiantId: number;
  onSubmit: (data: CreateInscription) => void;
  onCancel: () => void;
  loading?: boolean;
}

interface FormData {
  annee_academique: string;
  filiere_id: string;
  niveau_id: string;
  type_inscription: string;
  regime_etudes: string;
  frais_inscription: string;
  frais_payes: string;
}

const InscriptionForm: React.FC<InscriptionFormProps> = ({
  etudiantId,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      annee_academique: '',
      filiere_id: '',
      niveau_id: '',
      type_inscription: 'nouvelle',
      regime_etudes: 'présentiel',
      frais_inscription: '',
      frais_payes: '0',
    },
  });

  const fraisInscription = watch('frais_inscription');

  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      try {
        const [filieresData, niveauxData] = await Promise.all([
          getFilieres(),
          getNiveaux(),
        ]);
        setFilieres(filieresData);
        setNiveaux(niveauxData);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, []);

  const handleFormSubmit = (data: FormData) => {
    const inscriptionData: CreateInscription = {
      etudiant_id: etudiantId,
      annee_academique: data.annee_academique,
      filiere_id: data.filiere_id ? parseInt(data.filiere_id) : undefined,
      niveau_id: data.niveau_id ? parseInt(data.niveau_id) : undefined,
      type_inscription: data.type_inscription || undefined,
      regime_etudes: data.regime_etudes || undefined,
      frais_inscription: data.frais_inscription ? parseFloat(data.frais_inscription) : undefined,
      frais_payes: data.frais_payes ? parseFloat(data.frais_payes) : 0,
    };
    onSubmit(inscriptionData);
  };

  const validateAnneeAcademique = (value: string) => {
    const pattern = /^\d{4}-\d{4}$/;
    if (!pattern.test(value)) {
      return 'Format invalide (ex: 2024-2025)';
    }
    const [debut, fin] = value.split('-').map(Number);
    if (fin !== debut + 1) {
      return 'L\'année de fin doit être l\'année de début + 1';
    }
    return true;
  };

  const validateFraisPayes = (value: string) => {
    const payes = parseFloat(value) || 0;
    const total = parseFloat(fraisInscription) || 0;
    if (payes > total) {
      return 'Les frais payés ne peuvent pas dépasser les frais d\'inscription';
    }
    return true;
  };

  if (loadingData) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
      <Stack spacing={3}>
        <Controller
          name="annee_academique"
          control={control}
          rules={{
            required: 'L\'année académique est requise',
            validate: validateAnneeAcademique,
          }}
          render={({ field }) => (
            <TextField
              {...field}
              label="Année académique *"
              fullWidth
              placeholder="2024-2025"
              error={!!errors.annee_academique}
              helperText={errors.annee_academique?.message || 'Format: YYYY-YYYY'}
            />
          )}
        />

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Controller
            name="filiere_id"
            control={control}
            rules={{ required: 'La filière est requise' }}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.filiere_id}>
                <InputLabel>Filière *</InputLabel>
                <Select {...field} label="Filière *">
                  {filieres.map((filiere) => (
                    <MenuItem key={filiere.id} value={filiere.id.toString()}>
                      {filiere.libelle || filiere.code}
                    </MenuItem>
                  ))}
                </Select>
                {errors.filiere_id && (
                  <FormHelperText>{errors.filiere_id.message}</FormHelperText>
                )}
              </FormControl>
            )}
          />

          <Controller
            name="niveau_id"
            control={control}
            rules={{ required: 'Le niveau est requis' }}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.niveau_id}>
                <InputLabel>Niveau *</InputLabel>
                <Select {...field} label="Niveau *">
                  {niveaux.map((niveau) => (
                    <MenuItem key={niveau.id} value={niveau.id.toString()}>
                      {niveau.libelle || niveau.code}
                    </MenuItem>
                  ))}
                </Select>
                {errors.niveau_id && (
                  <FormHelperText>{errors.niveau_id.message}</FormHelperText>
                )}
              </FormControl>
            )}
          />
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Controller
            name="type_inscription"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel>Type d'inscription</InputLabel>
                <Select {...field} label="Type d'inscription">
                  {TYPES_INSCRIPTION.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />

          <Controller
            name="regime_etudes"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel>Régime d'études</InputLabel>
                <Select {...field} label="Régime d'études">
                  {REGIMES_ETUDES.map((regime) => (
                    <MenuItem key={regime} value={regime}>
                      {regime.charAt(0).toUpperCase() + regime.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Controller
            name="frais_inscription"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Frais d'inscription (FCFA)"
                type="number"
                fullWidth
                inputProps={{ min: 0 }}
              />
            )}
          />

          <Controller
            name="frais_payes"
            control={control}
            rules={{ validate: validateFraisPayes }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Frais payés (FCFA)"
                type="number"
                fullWidth
                inputProps={{ min: 0 }}
                error={!!errors.frais_payes}
                helperText={errors.frais_payes?.message}
              />
            )}
          />
        </Stack>

        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button variant="outlined" onClick={onCancel} disabled={loading}>
            Annuler
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

export default InscriptionForm;
