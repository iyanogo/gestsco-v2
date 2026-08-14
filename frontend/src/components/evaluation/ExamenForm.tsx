import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Grid,
  Typography,
  Alert,
  FormControlLabel,
  Checkbox,
  Autocomplete,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';

import {
  Examen,
  CreateExamen,
  UpdateExamen,
  TypeEvaluation,
} from '../../types/evaluation';
import { getMatieres } from '../../services/matiereService';
import { getNiveaux } from '../../services/niveauService';

interface ExamenFormProps {
  initialData?: Examen | null;
  sessionId: number;
  onSubmit: (data: CreateExamen | UpdateExamen) => Promise<void>;
  onCancel: () => void;
}

const ExamenForm: React.FC<ExamenFormProps> = ({
  initialData,
  sessionId,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState<CreateExamen>({
    session_id: sessionId,
    matiere_id: 0,
    niveau_id: 0,
    type_evaluation: 'examen',
    date_examen: '',
    duree_minutes: 120,
    salle: '',
    coefficient: 1,
    note_sur: 20,
    bareme: '',
    anonymat: false,
    enseignant_id: undefined,
    description: '',
  });

  const [matieres, setMatieres] = useState<any[]>([]);
  const [niveaux, setNiveaux] = useState<any[]>([]);
  const [selectedMatiere, setSelectedMatiere] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateExamen, setDateExamen] = useState<Date | null>(null);

  useEffect(() => {
    loadReferenceData();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        session_id: initialData.session_id,
        matiere_id: initialData.matiere_id,
        niveau_id: initialData.niveau_id,
        type_evaluation: initialData.type_evaluation,
        date_examen: initialData.date_examen || '',
        duree_minutes: initialData.duree_minutes || 120,
        salle: initialData.salle || '',
        coefficient: initialData.coefficient,
        note_sur: initialData.note_sur,
        bareme: initialData.bareme || '',
        anonymat: initialData.anonymat,
        enseignant_id: initialData.enseignant_id,
        description: initialData.description || '',
      });
      setDateExamen(initialData.date_examen ? new Date(initialData.date_examen) : null);
    }
  }, [initialData]);

  useEffect(() => {
    if (matieres.length > 0 && formData.matiere_id) {
      const matiere = matieres.find((m) => m.id === formData.matiere_id);
      setSelectedMatiere(matiere || null);
    }
  }, [matieres, formData.matiere_id]);

  const loadReferenceData = async () => {
    try {
      const [matieresData, niveauxData] = await Promise.all([
        getMatieres(),
        getNiveaux(),
      ]);
      setMatieres(matieresData);
      setNiveaux(niveauxData);
    } catch (error) {
      console.error('Erreur chargement données référence:', error);
    }
  };

  const handleChange = (field: keyof CreateExamen, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleMatiereChange = (matiere: any | null) => {
    setSelectedMatiere(matiere);
    handleChange('matiere_id', matiere?.id || 0);
  };

  const handleDateChange = (date: Date | null) => {
    setDateExamen(date);
    handleChange('date_examen', date ? date.toISOString() : '');
  };

  const validateForm = (): boolean => {
    if (!formData.matiere_id) {
      setError('La matière est requise');
      return false;
    }
    if (!formData.niveau_id) {
      setError('Le niveau est requis');
      return false;
    }
    if (!formData.type_evaluation) {
      setError("Le type d'évaluation est requis");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Box component="form" onSubmit={handleSubmit}>
        <Typography variant="h6" gutterBottom>
          {initialData ? "Modifier l'examen" : 'Nouvel examen'}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Autocomplete
              options={matieres}
              value={selectedMatiere}
              onChange={(_, value) => handleMatiereChange(value)}
              getOptionLabel={(option) => `${option.code} - ${option.libelle}`}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Matière"
                  required
                  placeholder="Rechercher une matière..."
                />
              )}
              isOptionEqualToValue={(option, value) => option.id === value?.id}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label="Niveau"
              value={formData.niveau_id || ''}
              onChange={(e) => handleChange('niveau_id', Number(e.target.value))}
              required
            >
              {niveaux.map((niveau) => (
                <MenuItem key={niveau.id} value={niveau.id}>
                  {niveau.libelle}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label="Type d'évaluation"
              value={formData.type_evaluation}
              onChange={(e) => handleChange('type_evaluation', e.target.value as TypeEvaluation)}
              required
            >
              <MenuItem value="cc">Contrôle Continu</MenuItem>
              <MenuItem value="tp">Travaux Pratiques</MenuItem>
              <MenuItem value="examen">Examen</MenuItem>
              <MenuItem value="examen_final">Examen Final</MenuItem>
              <MenuItem value="projet">Projet</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <DateTimePicker
              label="Date et heure"
              value={dateExamen}
              onChange={handleDateChange}
              slotProps={{
                textField: { fullWidth: true },
              }}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              type="number"
              label="Durée (minutes)"
              value={formData.duree_minutes}
              onChange={(e) => handleChange('duree_minutes', Number(e.target.value))}
              inputProps={{ min: 15, max: 480 }}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Salle"
              value={formData.salle}
              onChange={(e) => handleChange('salle', e.target.value)}
              placeholder="Ex: Amphi A"
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              label="Coefficient"
              value={formData.coefficient}
              onChange={(e) => handleChange('coefficient', Number(e.target.value))}
              inputProps={{ min: 0.5, max: 10, step: 0.5 }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              label="Note sur"
              value={formData.note_sur}
              onChange={(e) => handleChange('note_sur', Number(e.target.value))}
              inputProps={{ min: 10, max: 100 }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Barème"
              value={formData.bareme}
              onChange={(e) => handleChange('bareme', e.target.value)}
              placeholder="Ex: QCM 10pts, Exercices 10pts"
            />
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.anonymat}
                  onChange={(e) => handleChange('anonymat', e.target.checked)}
                />
              }
              label="Examen anonyme (numéros d'anonymat)"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description / Instructions"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Instructions pour les surveillants, documents autorisés, etc."
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={onCancel} disabled={loading}>
            Annuler
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Enregistrement...' : initialData ? 'Modifier' : 'Créer'}
          </Button>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default ExamenForm;
