import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Grid,
  FormControlLabel,
  Checkbox,
  Typography,
  Tabs,
  Tab,
  Alert,
  FormGroup,
  Divider,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import { format } from 'date-fns';
import {
  Seance,
  CreateSeance,
  UpdateSeance,
  CreateSeanceRecurrente,
  TYPES_SEANCE,
  JOURS_SEMAINE,
  CreneauHoraire,
  Salle,
  Conflits,
} from '../../types/emploiTemps';
import { creneauHoraireService } from '../../services/creneauHoraireService';
import { salleService } from '../../services/salleService';
import { seanceService } from '../../services/seanceService';

interface SeanceFormProps {
  initialData?: Seance | null;
  niveauId?: number;
  filiereId?: number;
  semestre?: number;
  anneeAcademiqueId?: number;
  onSubmit: (data: CreateSeance | UpdateSeance | CreateSeanceRecurrente) => void;
  onCancel: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
  </div>
);

const SeanceForm: React.FC<SeanceFormProps> = ({
  initialData,
  niveauId,
  filiereId,
  semestre,
  anneeAcademiqueId,
  onSubmit,
  onCancel,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [creneaux, setCreneaux] = useState<CreneauHoraire[]>([]);
  const [salles, setSalles] = useState<Salle[]>([]);
  const [matieres, ] = useState<any[]>([]);
  const [enseignants, ] = useState<any[]>([]);
  const [conflits, setConflits] = useState<Conflits | null>(null);
  const [, setCheckingConflits] = useState(false);

  const [formData, setFormData] = useState<CreateSeance>({
    matiere_id: 0,
    niveau_id: niveauId || 0,
    filiere_id: filiereId,
    enseignant_id: 0,
    salle_id: undefined,
    creneau_id: 0,
    type_seance: 'cours',
    date_seance: format(new Date(), 'yyyy-MM-dd'),
    semestre: semestre || 1,
    annee_academique_id: anneeAcademiqueId || 0,
    effectif_prevu: undefined,
    observations: '',
  });

  const [recurrence, setRecurrence] = useState({
    est_recurrente: false,
    date_fin_recurrence: '',
    jours_semaine: [] as number[],
  });

  useEffect(() => {
    loadData();
    if (initialData) {
      setFormData({
        matiere_id: initialData.matiere_id,
        niveau_id: initialData.niveau_id,
        filiere_id: initialData.filiere_id,
        enseignant_id: initialData.enseignant_id,
        salle_id: initialData.salle_id,
        creneau_id: initialData.creneau_id,
        type_seance: initialData.type_seance,
        date_seance: initialData.date_seance,
        semestre: initialData.semestre,
        annee_academique_id: initialData.annee_academique_id,
        effectif_prevu: initialData.effectif_prevu,
        observations: initialData.observations || '',
      });
    }
  }, [initialData]);

  useEffect(() => {
    if (formData.date_seance && formData.creneau_id) {
      checkConflits();
    }
  }, [formData.date_seance, formData.creneau_id, formData.salle_id, formData.enseignant_id]);

  const loadData = async () => {
    try {
      const [creneauxData, sallesData] = await Promise.all([
        creneauHoraireService.getCreneaux(),
        salleService.getSalles(),
      ]);
      setCreneaux(creneauxData);
      setSalles(sallesData);
      // TODO: Charger matieres et enseignants depuis leurs services respectifs
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  const checkConflits = async () => {
    if (!formData.date_seance || !formData.creneau_id) return;

    setCheckingConflits(true);
    try {
      const result = await seanceService.verifierConflits(
        formData.date_seance,
        formData.creneau_id,
        formData.salle_id,
        formData.enseignant_id
      );
      setConflits(result);
    } catch (error) {
      console.error('Erreur lors de la vérification des conflits:', error);
    } finally {
      setCheckingConflits(false);
    }
  };

  const handleChange = (field: keyof CreateSeance, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleJourSemaineChange = (jour: number, checked: boolean) => {
    let newJours: number[];
    if (checked) {
      newJours = [...recurrence.jours_semaine, jour].sort();
    } else {
      newJours = recurrence.jours_semaine.filter((j) => j !== jour);
    }
    setRecurrence((prev) => ({ ...prev, jours_semaine: newJours }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!initialData && recurrence.est_recurrente) {
      const data: CreateSeanceRecurrente = {
        seance_base: formData,
        date_fin_recurrence: recurrence.date_fin_recurrence,
        jours_semaine: recurrence.jours_semaine,
      };
      onSubmit(data);
    } else {
      onSubmit(formData);
    }
  };

  const hasConflits = conflits && (conflits.salle || conflits.enseignant);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Box component="form" onSubmit={handleSubmit}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 2 }}>
          <Tab label="Informations générales" />
          <Tab label="Enseignant et salle" />
          {!initialData && <Tab label="Récurrence" />}
          <Tab label="Détails" />
        </Tabs>

        {hasConflits && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {conflits?.salle && (
              <Typography variant="body2">
                ⚠️ Conflit de salle : La salle est déjà occupée
              </Typography>
            )}
            {conflits?.enseignant && (
              <Typography variant="body2">
                ⚠️ Conflit d'enseignant : L'enseignant a déjà une séance
              </Typography>
            )}
          </Alert>
        )}

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                required
                label="Matière"
                value={formData.matiere_id || ''}
                onChange={(e) => handleChange('matiere_id', Number(e.target.value))}
              >
                <MenuItem value="">Sélectionner une matière</MenuItem>
                {matieres.map((matiere) => (
                  <MenuItem key={matiere.id} value={matiere.id}>
                    {matiere.libelle}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                required
                label="Type de séance"
                value={formData.type_seance}
                onChange={(e) => handleChange('type_seance', e.target.value)}
              >
                {TYPES_SEANCE.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Date de la séance"
                value={formData.date_seance ? new Date(formData.date_seance) : null}
                onChange={(date) =>
                  handleChange('date_seance', date ? format(date, 'yyyy-MM-dd') : '')
                }
                slotProps={{ textField: { fullWidth: true, required: true } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                required
                label="Créneau horaire"
                value={formData.creneau_id || ''}
                onChange={(e) => handleChange('creneau_id', Number(e.target.value))}
              >
                {creneaux.map((creneau) => (
                  <MenuItem key={creneau.id} value={creneau.id}>
                    {creneau.libelle} ({creneau.heure_debut.substring(0, 5)} - {creneau.heure_fin.substring(0, 5)})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                required
                label="Enseignant"
                value={formData.enseignant_id || ''}
                onChange={(e) => handleChange('enseignant_id', Number(e.target.value))}
              >
                <MenuItem value="">Sélectionner un enseignant</MenuItem>
                {enseignants.map((enseignant) => (
                  <MenuItem key={enseignant.id} value={enseignant.id}>
                    {enseignant.full_name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Salle"
                value={formData.salle_id || ''}
                onChange={(e) => handleChange('salle_id', e.target.value ? Number(e.target.value) : undefined)}
                helperText="Optionnel - Laissez vide si la salle n'est pas encore définie"
              >
                <MenuItem value="">Aucune salle</MenuItem>
                {salles.map((salle) => (
                  <MenuItem key={salle.id} value={salle.id}>
                    {salle.libelle} ({salle.code}) - Capacité: {salle.capacite}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </TabPanel>

        {!initialData && (
          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={recurrence.est_recurrente}
                      onChange={(e) =>
                        setRecurrence((prev) => ({ ...prev, est_recurrente: e.target.checked }))
                      }
                    />
                  }
                  label="Séance récurrente"
                />
              </Grid>

              {recurrence.est_recurrente && (
                <>
                  <Grid item xs={12}>
                    <DatePicker
                      label="Date de fin de récurrence"
                      value={recurrence.date_fin_recurrence ? new Date(recurrence.date_fin_recurrence) : null}
                      onChange={(date) =>
                        setRecurrence((prev) => ({
                          ...prev,
                          date_fin_recurrence: date ? format(date, 'yyyy-MM-dd') : '',
                        }))
                      }
                      slotProps={{ textField: { fullWidth: true, required: recurrence.est_recurrente } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Jours de la semaine
                    </Typography>
                    <FormGroup row>
                      {JOURS_SEMAINE.filter((j) => j.value <= 6).map((jour) => (
                        <FormControlLabel
                          key={jour.value}
                          control={
                            <Checkbox
                              checked={recurrence.jours_semaine.includes(jour.value)}
                              onChange={(e) => handleJourSemaineChange(jour.value, e.target.checked)}
                            />
                          }
                          label={jour.label}
                        />
                      ))}
                    </FormGroup>
                  </Grid>
                </>
              )}
            </Grid>
          </TabPanel>
        )}

        <TabPanel value={tabValue} index={initialData ? 2 : 3}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Effectif prévu"
                value={formData.effectif_prevu || ''}
                onChange={(e) =>
                  handleChange('effectif_prevu', e.target.value ? Number(e.target.value) : undefined)
                }
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Observations"
                value={formData.observations}
                onChange={(e) => handleChange('observations', e.target.value)}
              />
            </Grid>
          </Grid>
        </TabPanel>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" variant="contained" disabled={!!hasConflits}>
            {initialData ? 'Modifier' : recurrence.est_recurrente ? 'Créer les séances' : 'Créer'}
          </Button>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default SeanceForm;
