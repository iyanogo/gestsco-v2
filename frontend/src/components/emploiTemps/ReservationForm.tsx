import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Grid,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
  Alert,
  Divider,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import { format, parse } from 'date-fns';
import { ReservationSalle, CreateReservationSalle, UpdateReservationSalle, Salle, EQUIPEMENTS_SALLE } from '../../types/emploiTemps';
import { salleService } from '../../services/salleService';

interface ReservationFormProps {
  initialData?: ReservationSalle | null;
  onSubmit: (data: CreateReservationSalle | UpdateReservationSalle) => void;
  onCancel: () => void;
}

const ReservationForm: React.FC<ReservationFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [salles, setSalles] = useState<Salle[]>([]);
  const [disponibiliteError, setDisponibiliteError] = useState<string | null>(null);
  const [checkingDisponibilite, setCheckingDisponibilite] = useState(false);
  const [selectedEquipements, setSelectedEquipements] = useState<string[]>([]);

  const [formData, setFormData] = useState<CreateReservationSalle>({
    salle_id: 0,
    date_reservation: format(new Date(), 'yyyy-MM-dd'),
    heure_debut: '08:00',
    heure_fin: '10:00',
    motif: '',
    description: '',
    nombre_participants: undefined,
    equipements_requis: '',
  });

  useEffect(() => {
    loadSalles();
    if (initialData) {
      setFormData({
        salle_id: initialData.salle_id,
        date_reservation: initialData.date_reservation,
        heure_debut: initialData.heure_debut,
        heure_fin: initialData.heure_fin,
        motif: initialData.motif,
        description: initialData.description || '',
        nombre_participants: initialData.nombre_participants,
        equipements_requis: initialData.equipements_requis || '',
      });
      if (initialData.equipements_requis) {
        setSelectedEquipements(initialData.equipements_requis.split(',').map((e) => e.trim()));
      }
    }
  }, [initialData]);

  useEffect(() => {
    if (formData.salle_id && formData.date_reservation && formData.heure_debut && formData.heure_fin) {
      checkDisponibilite();
    }
  }, [formData.salle_id, formData.date_reservation, formData.heure_debut, formData.heure_fin]);

  const loadSalles = async () => {
    try {
      const data = await salleService.getSalles();
      setSalles(data);
    } catch (error) {
      console.error('Erreur lors du chargement des salles:', error);
    }
  };

  const checkDisponibilite = async () => {
    setCheckingDisponibilite(true);
    setDisponibiliteError(null);
    try {
      const sallesDisponibles = await salleService.getSallesDisponibles(
        formData.date_reservation,
        formData.heure_debut,
        formData.heure_fin
      );
      const estDisponible = sallesDisponibles.some((s) => s.id === formData.salle_id);
      if (!estDisponible) {
        setDisponibiliteError('La salle n\'est pas disponible sur ce créneau');
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de disponibilité:', error);
    } finally {
      setCheckingDisponibilite(false);
    }
  };

  const handleChange = (field: keyof CreateReservationSalle, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEquipementChange = (equipement: string, checked: boolean) => {
    let newEquipements: string[];
    if (checked) {
      newEquipements = [...selectedEquipements, equipement];
    } else {
      newEquipements = selectedEquipements.filter((e) => e !== equipement);
    }
    setSelectedEquipements(newEquipements);
    setFormData((prev) => ({ ...prev, equipements_requis: newEquipements.join(', ') }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disponibiliteError) return;
    onSubmit(formData);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Box component="form" onSubmit={handleSubmit}>
        {disponibiliteError && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {disponibiliteError}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              select
              fullWidth
              required
              label="Salle"
              value={formData.salle_id || ''}
              onChange={(e) => handleChange('salle_id', Number(e.target.value))}
            >
              {salles.map((salle) => (
                <MenuItem key={salle.id} value={salle.id}>
                  {salle.libelle} ({salle.code}) - Capacité: {salle.capacite}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={4}>
            <DatePicker
              label="Date de réservation"
              value={formData.date_reservation ? new Date(formData.date_reservation) : null}
              onChange={(date) =>
                handleChange('date_reservation', date ? format(date, 'yyyy-MM-dd') : '')
              }
              slotProps={{ textField: { fullWidth: true, required: true } }}
              minDate={new Date()}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TimePicker
              label="Heure de début"
              value={formData.heure_debut ? parse(formData.heure_debut, 'HH:mm', new Date()) : null}
              onChange={(time) =>
                handleChange('heure_debut', time ? format(time, 'HH:mm') : '')
              }
              slotProps={{ textField: { fullWidth: true, required: true } }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TimePicker
              label="Heure de fin"
              value={formData.heure_fin ? parse(formData.heure_fin, 'HH:mm', new Date()) : null}
              onChange={(time) =>
                handleChange('heure_fin', time ? format(time, 'HH:mm') : '')
              }
              slotProps={{ textField: { fullWidth: true, required: true } }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label="Motif"
              value={formData.motif}
              onChange={(e) => handleChange('motif', e.target.value)}
              placeholder="Ex: Réunion de département, Soutenance, Formation..."
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Nombre de participants"
              value={formData.nombre_participants || ''}
              onChange={(e) =>
                handleChange('nombre_participants', e.target.value ? Number(e.target.value) : undefined)
              }
              inputProps={{ min: 1 }}
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" gutterBottom>
              Équipements requis
            </Typography>
            <FormGroup row>
              {EQUIPEMENTS_SALLE.map((equipement) => (
                <FormControlLabel
                  key={equipement.value}
                  control={
                    <Checkbox
                      checked={selectedEquipements.includes(equipement.value)}
                      onChange={(e) => handleEquipementChange(equipement.value, e.target.checked)}
                    />
                  }
                  label={equipement.label}
                />
              ))}
            </FormGroup>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Informations complémentaires..."
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button variant="outlined" onClick={onCancel}>
                Annuler
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={!!disponibiliteError || checkingDisponibilite}
              >
                {initialData ? 'Modifier' : 'Réserver'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

export default ReservationForm;
