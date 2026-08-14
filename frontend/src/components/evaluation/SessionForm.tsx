import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Grid,
  Typography,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';

import {
  SessionExamen,
  CreateSessionExamen,
  UpdateSessionExamen,
} from '../../types/evaluation';
import anneeAcademiqueService from '../../services/anneeAcademiqueService';

interface SessionFormProps {
  initialData?: SessionExamen | null;
  onSubmit: (data: CreateSessionExamen | UpdateSessionExamen) => Promise<void>;
  onCancel: () => void;
}

const SessionForm: React.FC<SessionFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState<CreateSessionExamen>({
    code: '',
    libelle: '',
    annee_academique_id: 0,
    type_session: 'normale',
    semestre: 1,
    date_debut: '',
    date_fin: '',
    date_limite_saisie_notes: '',
    date_deliberation: '',
  });

  const [anneesAcademiques, setAnneesAcademiques] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dates pour les DatePickers
  const [dateDebut, setDateDebut] = useState<Date | null>(null);
  const [dateFin, setDateFin] = useState<Date | null>(null);
  const [dateLimiteSaisie, setDateLimiteSaisie] = useState<Date | null>(null);
  const [dateDeliberation, setDateDeliberation] = useState<Date | null>(null);

  useEffect(() => {
    loadAnneesAcademiques();
    if (initialData) {
      setFormData({
        code: initialData.code,
        libelle: initialData.libelle,
        annee_academique_id: initialData.annee_academique_id,
        type_session: initialData.type_session,
        semestre: initialData.semestre,
        date_debut: initialData.date_debut,
        date_fin: initialData.date_fin,
        date_limite_saisie_notes: initialData.date_limite_saisie_notes || '',
        date_deliberation: initialData.date_deliberation || '',
      });
      setDateDebut(initialData.date_debut ? new Date(initialData.date_debut) : null);
      setDateFin(initialData.date_fin ? new Date(initialData.date_fin) : null);
      setDateLimiteSaisie(initialData.date_limite_saisie_notes ? new Date(initialData.date_limite_saisie_notes) : null);
      setDateDeliberation(initialData.date_deliberation ? new Date(initialData.date_deliberation) : null);
    }
  }, [initialData]);

  const loadAnneesAcademiques = async () => {
    try {
      const data = await anneeAcademiqueService.getAll();
      setAnneesAcademiques(data);
      if (!initialData && data.length > 0) {
        const active = data.find((a: any) => a.is_active);
        if (active) {
          setFormData((prev) => ({ ...prev, annee_academique_id: active.id }));
        }
      }
    } catch (error) {
      console.error('Erreur chargement années:', error);
    }
  };

  const handleChange = (field: keyof CreateSessionExamen, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleDateChange = (field: string, date: Date | null) => {
    const dateStr = date ? date.toISOString().split('T')[0] : '';
    
    switch (field) {
      case 'date_debut':
        setDateDebut(date);
        handleChange('date_debut', dateStr);
        break;
      case 'date_fin':
        setDateFin(date);
        handleChange('date_fin', dateStr);
        break;
      case 'date_limite_saisie_notes':
        setDateLimiteSaisie(date);
        handleChange('date_limite_saisie_notes', dateStr);
        break;
      case 'date_deliberation':
        setDateDeliberation(date);
        handleChange('date_deliberation', dateStr);
        break;
    }
  };

  const validateForm = (): boolean => {
    if (!formData.code.trim()) {
      setError('Le code est requis');
      return false;
    }
    if (!formData.libelle.trim()) {
      setError('Le libellé est requis');
      return false;
    }
    if (!formData.annee_academique_id) {
      setError("L'année académique est requise");
      return false;
    }
    if (!formData.date_debut) {
      setError('La date de début est requise');
      return false;
    }
    if (!formData.date_fin) {
      setError('La date de fin est requise');
      return false;
    }
    if (dateDebut && dateFin && dateFin < dateDebut) {
      setError('La date de fin doit être postérieure à la date de début');
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
          {initialData ? 'Modifier la session' : 'Nouvelle session d\'examen'}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Code"
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value)}
              required
              placeholder="Ex: SN-2024-S1"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Libellé"
              value={formData.libelle}
              onChange={(e) => handleChange('libelle', e.target.value)}
              required
              placeholder="Ex: Session Normale Semestre 1"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label="Année académique"
              value={formData.annee_academique_id || ''}
              onChange={(e) => handleChange('annee_academique_id', Number(e.target.value))}
              required
            >
              {anneesAcademiques.map((annee) => (
                <MenuItem key={annee.id} value={annee.id}>
                  {annee.libelle}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              select
              fullWidth
              label="Type de session"
              value={formData.type_session}
              onChange={(e) => handleChange('type_session', e.target.value)}
              required
            >
              <MenuItem value="normale">Normale</MenuItem>
              <MenuItem value="rattrapage">Rattrapage</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              select
              fullWidth
              label="Semestre"
              value={formData.semestre}
              onChange={(e) => handleChange('semestre', Number(e.target.value))}
              required
            >
              <MenuItem value={1}>Semestre 1</MenuItem>
              <MenuItem value={2}>Semestre 2</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <DatePicker
              label="Date de début"
              value={dateDebut}
              onChange={(date) => handleDateChange('date_debut', date)}
              slotProps={{
                textField: { fullWidth: true, required: true },
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <DatePicker
              label="Date de fin"
              value={dateFin}
              onChange={(date) => handleDateChange('date_fin', date)}
              minDate={dateDebut || undefined}
              slotProps={{
                textField: { fullWidth: true, required: true },
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <DatePicker
              label="Date limite saisie notes"
              value={dateLimiteSaisie}
              onChange={(date) => handleDateChange('date_limite_saisie_notes', date)}
              slotProps={{
                textField: { fullWidth: true },
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <DatePicker
              label="Date de délibération"
              value={dateDeliberation}
              onChange={(date) => handleDateChange('date_deliberation', date)}
              slotProps={{
                textField: { fullWidth: true },
              }}
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

export default SessionForm;
