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

import {
  Deliberation,
  CreateDeliberation,
  UpdateDeliberation,
  TypeDeliberation,
} from '../../types/evaluation';
import sessionExamenService from '../../services/sessionExamenService';
import { getNiveaux } from '../../services/niveauService';
import { getFilieres } from '../../services/filiereService';

interface DeliberationFormProps {
  initialData?: Deliberation | null;
  onSubmit: (data: CreateDeliberation | UpdateDeliberation) => Promise<void>;
  onCancel: () => void;
}

const DeliberationForm: React.FC<DeliberationFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState<CreateDeliberation>({
    session_id: 0,
    niveau_id: 0,
    filiere_id: 0,
    type_deliberation: 'semestrielle',
    semestre: 1,
    date_deliberation: new Date().toISOString().split('T')[0],
    president_jury: undefined,
    observations: '',
  });

  const [sessions, setSessions] = useState<any[]>([]);
  const [niveaux, setNiveaux] = useState<any[]>([]);
  const [filieres, setFilieres] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReferenceData();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        session_id: initialData.session_id,
        niveau_id: initialData.niveau_id,
        filiere_id: initialData.filiere_id,
        type_deliberation: initialData.type_deliberation,
        semestre: initialData.semestre || 1,
        date_deliberation: initialData.date_deliberation?.split('T')[0] || '',
        president_jury: initialData.president_jury,
        observations: initialData.observations || '',
      });
    }
  }, [initialData]);

  const loadReferenceData = async () => {
    try {
      const [sessionsData, niveauxData, filieresData] = await Promise.all([
        sessionExamenService.getSessions(),
        getNiveaux(),
        getFilieres(),
      ]);
      setSessions(sessionsData);
      setNiveaux(niveauxData);
      setFilieres(filieresData);
    } catch (error) {
      console.error('Erreur chargement données référence:', error);
    }
  };

  const handleChange = (field: keyof CreateDeliberation, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.session_id) {
      setError('La session est requise');
      return false;
    }
    if (!formData.niveau_id) {
      setError('Le niveau est requis');
      return false;
    }
    if (!formData.filiere_id) {
      setError('La filière est requise');
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
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h6" gutterBottom>
        {initialData ? 'Modifier la délibération' : 'Nouvelle délibération'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            select
            fullWidth
            label="Session"
            value={formData.session_id || ''}
            onChange={(e) => handleChange('session_id', Number(e.target.value))}
            required
          >
            {sessions.map((session) => (
              <MenuItem key={session.id} value={session.id}>
                {session.code} - {session.libelle}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            select
            fullWidth
            label="Type de délibération"
            value={formData.type_deliberation}
            onChange={(e) => handleChange('type_deliberation', e.target.value as TypeDeliberation)}
            required
          >
            <MenuItem value="semestrielle">Semestrielle</MenuItem>
            <MenuItem value="annuelle">Annuelle</MenuItem>
          </TextField>
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
            label="Filière"
            value={formData.filiere_id || ''}
            onChange={(e) => handleChange('filiere_id', Number(e.target.value))}
            required
          >
            {filieres.map((filiere) => (
              <MenuItem key={filiere.id} value={filiere.id}>
                {filiere.libelle}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {formData.type_deliberation === 'semestrielle' && (
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label="Semestre"
              value={formData.semestre || 1}
              onChange={(e) => handleChange('semestre', Number(e.target.value))}
            >
              <MenuItem value={1}>Semestre 1</MenuItem>
              <MenuItem value={2}>Semestre 2</MenuItem>
            </TextField>
          </Grid>
        )}

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="date"
            label="Date de délibération"
            value={formData.date_deliberation || ''}
            onChange={(e) => handleChange('date_deliberation', e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Observations"
            value={formData.observations || ''}
            onChange={(e) => handleChange('observations', e.target.value)}
            placeholder="Observations ou remarques sur la délibération..."
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
  );
};

export default DeliberationForm;
