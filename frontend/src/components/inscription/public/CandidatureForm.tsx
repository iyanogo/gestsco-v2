/**
 * Formulaire de candidature public
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
  SelectChangeEvent,
  FormHelperText,
} from '@mui/material';

import { CreateDossierCandidature } from '../../../types/inscription';
import { Filiere } from '../../../types/reference';
import { getFilieres } from '../../../services/filiereService';

interface CandidatureFormProps {
  campagneId: number;
  initialData?: Partial<CreateDossierCandidature>;
  onChange: (data: Partial<CreateDossierCandidature>, isValid: boolean) => void;
}

const CandidatureForm: React.FC<CandidatureFormProps> = ({
  campagneId,
  initialData,
  onChange,
}) => {
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<Partial<CreateDossierCandidature>>({
    campagne_id: campagneId,
    candidat_nom: '',
    candidat_prenom: '',
    candidat_email: '',
    candidat_telephone: '',
    candidat_date_naissance: '',
    candidat_lieu_naissance: '',
    candidat_sexe: undefined,
    candidat_nationalite: 'Burkinabè',
    candidat_adresse: '',
    filiere_souhaitee_1: undefined,
    filiere_souhaitee_2: undefined,
    filiere_souhaitee_3: undefined,
    diplome_precedent: '',
    etablissement_precedent: '',
    annee_obtention_diplome: '',
    moyenne_generale: undefined,
    ...initialData,
  });

  useEffect(() => {
    const fetchFilieres = async () => {
      try {
        const data = await getFilieres();
        setFilieres(data);
      } catch (error) {
        console.error('Erreur lors du chargement des filières:', error);
      }
    };
    fetchFilieres();
  }, []);

  const validateForm = (data: Partial<CreateDossierCandidature>): boolean => {
    const newErrors: Record<string, string> = {};

    if (!data.candidat_nom?.trim()) {
      newErrors.candidat_nom = 'Le nom est obligatoire';
    }
    if (!data.candidat_prenom?.trim()) {
      newErrors.candidat_prenom = 'Le prénom est obligatoire';
    }
    if (!data.candidat_email?.trim()) {
      newErrors.candidat_email = 'L\'email est obligatoire';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.candidat_email)) {
      newErrors.candidat_email = 'Email invalide';
    }
    if (!data.candidat_telephone?.trim()) {
      newErrors.candidat_telephone = 'Le téléphone est obligatoire';
    }
    if (!data.filiere_souhaitee_1) {
      newErrors.filiere_souhaitee_1 = 'Veuillez sélectionner au moins une filière';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const newData = { ...formData, [name]: value };
    setFormData(newData);
    const isValid = validateForm(newData);
    onChange(newData, isValid);
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    let parsedValue: string | number | undefined = value;
    
    // Parse numeric values for filiere selections
    if (name.startsWith('filiere_souhaitee') && value) {
      parsedValue = parseInt(value);
    }
    
    const newData = { ...formData, [name]: parsedValue || undefined };
    setFormData(newData);
    const isValid = validateForm(newData);
    onChange(newData, isValid);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = value ? parseFloat(value) : undefined;
    const newData = { ...formData, [name]: numValue };
    setFormData(newData);
    const isValid = validateForm(newData);
    onChange(newData, isValid);
  };

  return (
    <Box>
      {/* Informations personnelles */}
      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
        Informations personnelles
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            required
            label="Nom"
            name="candidat_nom"
            value={formData.candidat_nom || ''}
            onChange={handleChange}
            error={!!errors.candidat_nom}
            helperText={errors.candidat_nom}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            required
            label="Prénom"
            name="candidat_prenom"
            value={formData.candidat_prenom || ''}
            onChange={handleChange}
            error={!!errors.candidat_prenom}
            helperText={errors.candidat_prenom}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            required
            type="email"
            label="Email"
            name="candidat_email"
            value={formData.candidat_email || ''}
            onChange={handleChange}
            error={!!errors.candidat_email}
            helperText={errors.candidat_email}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            required
            label="Téléphone"
            name="candidat_telephone"
            value={formData.candidat_telephone || ''}
            onChange={handleChange}
            error={!!errors.candidat_telephone}
            helperText={errors.candidat_telephone}
            placeholder="+226 XX XX XX XX"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            type="date"
            label="Date de naissance"
            name="candidat_date_naissance"
            value={formData.candidat_date_naissance || ''}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Lieu de naissance"
            name="candidat_lieu_naissance"
            value={formData.candidat_lieu_naissance || ''}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Sexe</InputLabel>
            <Select
              name="candidat_sexe"
              value={formData.candidat_sexe || ''}
              label="Sexe"
              onChange={handleSelectChange}
            >
              <MenuItem value="">-</MenuItem>
              <MenuItem value="M">Masculin</MenuItem>
              <MenuItem value="F">Féminin</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Nationalité"
            name="candidat_nationalite"
            value={formData.candidat_nationalite || ''}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Adresse"
            name="candidat_adresse"
            value={formData.candidat_adresse || ''}
            onChange={handleChange}
          />
        </Grid>
      </Grid>

      {/* Filières souhaitées */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Filières souhaitées
      </Typography>
      <Alert severity="info" sx={{ mb: 2 }}>
        Sélectionnez jusqu'à 3 filières par ordre de préférence. Le premier choix est obligatoire.
      </Alert>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth required error={!!errors.filiere_souhaitee_1}>
            <InputLabel>1er choix *</InputLabel>
            <Select
              name="filiere_souhaitee_1"
              value={formData.filiere_souhaitee_1?.toString() || ''}
              label="1er choix *"
              onChange={handleSelectChange}
            >
              <MenuItem value="">-</MenuItem>
              {filieres.map((filiere) => (
                <MenuItem key={filiere.id} value={filiere.id.toString()}>
                  {filiere.libelle}
                </MenuItem>
              ))}
            </Select>
            {errors.filiere_souhaitee_1 && (
              <FormHelperText>{errors.filiere_souhaitee_1}</FormHelperText>
            )}
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>2ème choix</InputLabel>
            <Select
              name="filiere_souhaitee_2"
              value={formData.filiere_souhaitee_2?.toString() || ''}
              label="2ème choix"
              onChange={handleSelectChange}
            >
              <MenuItem value="">-</MenuItem>
              {filieres
                .filter((f) => f.id !== formData.filiere_souhaitee_1)
                .map((filiere) => (
                  <MenuItem key={filiere.id} value={filiere.id.toString()}>
                    {filiere.libelle}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>3ème choix</InputLabel>
            <Select
              name="filiere_souhaitee_3"
              value={formData.filiere_souhaitee_3?.toString() || ''}
              label="3ème choix"
              onChange={handleSelectChange}
            >
              <MenuItem value="">-</MenuItem>
              {filieres
                .filter(
                  (f) =>
                    f.id !== formData.filiere_souhaitee_1 &&
                    f.id !== formData.filiere_souhaitee_2
                )
                .map((filiere) => (
                  <MenuItem key={filiere.id} value={filiere.id.toString()}>
                    {filiere.libelle}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Diplômes et parcours */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Diplômes et parcours
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Diplôme précédent"
            name="diplome_precedent"
            value={formData.diplome_precedent || ''}
            onChange={handleChange}
            placeholder="Ex: Baccalauréat série D"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Établissement précédent"
            name="etablissement_precedent"
            value={formData.etablissement_precedent || ''}
            onChange={handleChange}
            placeholder="Ex: Lycée Philippe Zinda Kaboré"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Année d'obtention"
            name="annee_obtention_diplome"
            value={formData.annee_obtention_diplome || ''}
            onChange={handleChange}
            placeholder="Ex: 2024"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="number"
            label="Moyenne générale (/20)"
            name="moyenne_generale"
            value={formData.moyenne_generale || ''}
            onChange={handleNumberChange}
            inputProps={{ min: 0, max: 20, step: 0.01 }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default CandidatureForm;
