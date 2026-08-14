/**
 * Formulaire pour ajouter un document
 */

import React from 'react';
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
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import type { CreateDocumentEtudiant } from '../../types/etudiant';
import { TYPES_DOCUMENT } from '../../types/etudiant';

interface DocumentFormProps {
  etudiantId: number;
  onSubmit: (data: CreateDocumentEtudiant) => void;
  onCancel: () => void;
  loading?: boolean;
}

interface FormData {
  type_document: string;
  libelle: string;
  numero_document: string;
  date_delivrance: string;
  lieu_delivrance: string;
  fichier_url: string;
}

const DocumentForm: React.FC<DocumentFormProps> = ({
  etudiantId,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      type_document: '',
      libelle: '',
      numero_document: '',
      date_delivrance: '',
      lieu_delivrance: '',
      fichier_url: '',
    },
  });

  const handleFormSubmit = (data: FormData) => {
    const documentData: CreateDocumentEtudiant = {
      etudiant_id: etudiantId,
      type_document: data.type_document,
      libelle: data.libelle || undefined,
      numero_document: data.numero_document || undefined,
      date_delivrance: data.date_delivrance || undefined,
      lieu_delivrance: data.lieu_delivrance || undefined,
      fichier_url: data.fichier_url || undefined,
    };
    onSubmit(documentData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
      <Stack spacing={3}>
        <Controller
          name="type_document"
          control={control}
          rules={{ required: 'Le type de document est requis' }}
          render={({ field }) => (
            <FormControl fullWidth error={!!errors.type_document}>
              <InputLabel>Type de document *</InputLabel>
              <Select {...field} label="Type de document *">
                {TYPES_DOCUMENT.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
              {errors.type_document && (
                <FormHelperText>{errors.type_document.message}</FormHelperText>
              )}
            </FormControl>
          )}
        />

        <Controller
          name="libelle"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Libellé"
              fullWidth
            />
          )}
        />

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Controller
            name="numero_document"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Numéro du document"
                fullWidth
              />
            )}
          />
          <Controller
            name="date_delivrance"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Date de délivrance"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            )}
          />
        </Stack>

        <Controller
          name="lieu_delivrance"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Lieu de délivrance"
              fullWidth
            />
          )}
        />

        <Controller
          name="fichier_url"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="URL du fichier"
              fullWidth
              placeholder="https://..."
              helperText="Entrez l'URL du fichier ou utilisez le système d'upload"
            />
          )}
        />

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

export default DocumentForm;
