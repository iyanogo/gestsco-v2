/**
 * Formulaire de création/édition d'un étudiant avec onglets
 */

import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Tab,
  Tabs,
  Stack,
  FormHelperText,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import type { Etudiant, CreateEtudiant } from '../../types/etudiant';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`etudiant-tabpanel-${index}`}
      aria-labelledby={`etudiant-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

interface EtudiantFormProps {
  initialData?: Etudiant | null;
  onSubmit: (data: CreateEtudiant) => void;
  onCancel: () => void;
  loading?: boolean;
}

const EtudiantForm: React.FC<EtudiantFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [tabValue, setTabValue] = useState(0);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateEtudiant>({
    defaultValues: {
      nom: initialData?.nom || '',
      prenom: initialData?.prenom || '',
      date_naissance: initialData?.date_naissance || '',
      lieu_naissance: initialData?.lieu_naissance || '',
      sexe: initialData?.sexe || '',
      nationalite: initialData?.nationalite || 'Burkinabè',
      email: initialData?.email || '',
      telephone: initialData?.telephone || '',
      telephone_urgence: initialData?.telephone_urgence || '',
      adresse: initialData?.adresse || '',
      ville: initialData?.ville || '',
      pays: initialData?.pays || 'Burkina Faso',
      nom_pere: initialData?.nom_pere || '',
      profession_pere: initialData?.profession_pere || '',
      nom_mere: initialData?.nom_mere || '',
      profession_mere: initialData?.profession_mere || '',
      personne_contact: initialData?.personne_contact || '',
      telephone_contact: initialData?.telephone_contact || '',
    },
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Informations personnelles" />
          <Tab label="Contacts" />
          <Tab label="Informations familiales" />
        </Tabs>
      </Box>

      {/* Onglet 1: Informations personnelles */}
      <TabPanel value={tabValue} index={0}>
        <Stack spacing={3}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Controller
              name="nom"
              control={control}
              rules={{ required: 'Le nom est requis' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Nom"
                  fullWidth
                  required
                  error={!!errors.nom}
                  helperText={errors.nom?.message}
                />
              )}
            />
            <Controller
              name="prenom"
              control={control}
              rules={{ required: 'Le prénom est requis' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Prénom"
                  fullWidth
                  required
                  error={!!errors.prenom}
                  helperText={errors.prenom?.message}
                />
              )}
            />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Controller
              name="date_naissance"
              control={control}
              rules={{ required: 'La date de naissance est requise' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Date de naissance"
                  type="date"
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.date_naissance}
                  helperText={errors.date_naissance?.message}
                />
              )}
            />
            <Controller
              name="lieu_naissance"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Lieu de naissance"
                  fullWidth
                />
              )}
            />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControl error={!!errors.sexe} required>
              <FormLabel>Sexe</FormLabel>
              <Controller
                name="sexe"
                control={control}
                rules={{ required: 'Le sexe est requis' }}
                render={({ field }) => (
                  <RadioGroup row {...field}>
                    <FormControlLabel value="M" control={<Radio />} label="Masculin" />
                    <FormControlLabel value="F" control={<Radio />} label="Féminin" />
                  </RadioGroup>
                )}
              />
              {errors.sexe && (
                <FormHelperText>{errors.sexe.message}</FormHelperText>
              )}
            </FormControl>

            <Controller
              name="nationalite"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Nationalité"
                  fullWidth
                />
              )}
            />
          </Stack>
        </Stack>
      </TabPanel>

      {/* Onglet 2: Contacts */}
      <TabPanel value={tabValue} index={1}>
        <Stack spacing={3}>
          <Controller
            name="email"
            control={control}
            rules={{
              required: 'L\'email est requis',
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
                required
                error={!!errors.email}
                helperText={errors.email?.message}
              />
            )}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Controller
              name="telephone"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Téléphone"
                  fullWidth
                />
              )}
            />
            <Controller
              name="telephone_urgence"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Téléphone d'urgence"
                  fullWidth
                />
              )}
            />
          </Stack>

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
              />
            )}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Controller
              name="ville"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Ville"
                  fullWidth
                />
              )}
            />
            <Controller
              name="pays"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Pays"
                  fullWidth
                />
              )}
            />
          </Stack>
        </Stack>
      </TabPanel>

      {/* Onglet 3: Informations familiales */}
      <TabPanel value={tabValue} index={2}>
        <Stack spacing={3}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Controller
              name="nom_pere"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Nom du père"
                  fullWidth
                />
              )}
            />
            <Controller
              name="profession_pere"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Profession du père"
                  fullWidth
                />
              )}
            />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Controller
              name="nom_mere"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Nom de la mère"
                  fullWidth
                />
              )}
            />
            <Controller
              name="profession_mere"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Profession de la mère"
                  fullWidth
                />
              )}
            />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Controller
              name="personne_contact"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Personne à contacter"
                  fullWidth
                />
              )}
            />
            <Controller
              name="telephone_contact"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Téléphone du contact"
                  fullWidth
                />
              )}
            />
          </Stack>
        </Stack>
      </TabPanel>

      {/* Boutons */}
      <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
        <Button variant="outlined" onClick={onCancel} disabled={loading}>
          Annuler
        </Button>
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </Stack>
    </Box>
  );
};

export default EtudiantForm;
