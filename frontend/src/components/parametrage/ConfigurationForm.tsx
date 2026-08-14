import React from 'react';
import {
  Box,
  Grid,
  TextField,
  FormControlLabel,
  Switch,
  MenuItem,
  Typography,
  Card,
  CardContent,
} from '@mui/material';
import {
  ConfigurationEtablissement,
  ConfigurationEtablissementUpdate,
  SYSTEMES_NOTATION,
  REFERENTIELS,
  THEMES,
} from '../../types/parametrage';

interface ConfigurationFormProps {
  configuration: ConfigurationEtablissement;
  onChange: (data: ConfigurationEtablissementUpdate) => void;
  readOnly?: boolean;
}

const ConfigurationForm: React.FC<ConfigurationFormProps> = ({
  configuration,
  onChange,
  readOnly = false,
}) => {
  const handleChange = (field: keyof ConfigurationEtablissementUpdate, value: any) => {
    onChange({ [field]: value });
  };

  return (
    <Box>
      {/* Informations générales */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            Informations générales
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nom complet"
                value={configuration.nom_complet}
                onChange={(e) => handleChange('nom_complet', e.target.value)}
                disabled={readOnly}
                required
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Nom court"
                value={configuration.nom_court}
                onChange={(e) => handleChange('nom_court', e.target.value)}
                disabled={readOnly}
                required
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Sigle"
                value={configuration.sigle || ''}
                onChange={(e) => handleChange('sigle', e.target.value)}
                disabled={readOnly}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Slogan"
                value={configuration.slogan || ''}
                onChange={(e) => handleChange('slogan', e.target.value)}
                disabled={readOnly}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Coordonnées */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            Coordonnées
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Adresse complète"
                value={configuration.adresse_complete || ''}
                onChange={(e) => handleChange('adresse_complete', e.target.value)}
                disabled={readOnly}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Ville"
                value={configuration.ville || ''}
                onChange={(e) => handleChange('ville', e.target.value)}
                disabled={readOnly}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Pays"
                value={configuration.pays}
                onChange={(e) => handleChange('pays', e.target.value)}
                disabled={readOnly}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Code postal"
                value={configuration.code_postal || ''}
                onChange={(e) => handleChange('code_postal', e.target.value)}
                disabled={readOnly}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Téléphone principal"
                value={configuration.telephone_principal || ''}
                onChange={(e) => handleChange('telephone_principal', e.target.value)}
                disabled={readOnly}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Téléphone secondaire"
                value={configuration.telephone_secondaire || ''}
                onChange={(e) => handleChange('telephone_secondaire', e.target.value)}
                disabled={readOnly}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Email principal"
                type="email"
                value={configuration.email_principal || ''}
                onChange={(e) => handleChange('email_principal', e.target.value)}
                disabled={readOnly}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Email scolarité"
                type="email"
                value={configuration.email_scolarite || ''}
                onChange={(e) => handleChange('email_scolarite', e.target.value)}
                disabled={readOnly}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Site web"
                value={configuration.site_web || ''}
                onChange={(e) => handleChange('site_web', e.target.value)}
                disabled={readOnly}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Paramètres académiques */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            Paramètres académiques
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="Système de notation"
                value={configuration.systeme_notation}
                onChange={(e) => handleChange('systeme_notation', e.target.value)}
                disabled={readOnly}
              >
                {SYSTEMES_NOTATION.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="Référentiel"
                value={configuration.referentiel}
                onChange={(e) => handleChange('referentiel', e.target.value)}
                disabled={readOnly}
              >
                {REFERENTIELS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Langue d'enseignement"
                value={configuration.langue_enseignement}
                onChange={(e) => handleChange('langue_enseignement', e.target.value)}
                disabled={readOnly}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Paramètres de notation */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            Paramètres de notation
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="number"
                label="Note minimale"
                value={configuration.note_minimale}
                onChange={(e) => handleChange('note_minimale', parseFloat(e.target.value))}
                disabled={readOnly}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="number"
                label="Note maximale"
                value={configuration.note_maximale}
                onChange={(e) => handleChange('note_maximale', parseFloat(e.target.value))}
                disabled={readOnly}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="number"
                label="Note de passage"
                value={configuration.note_passage}
                onChange={(e) => handleChange('note_passage', parseFloat(e.target.value))}
                disabled={readOnly}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="number"
                label="Précision (décimales)"
                value={configuration.precision_notes}
                onChange={(e) => handleChange('precision_notes', parseInt(e.target.value))}
                disabled={readOnly}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Paramètres financiers */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            Paramètres financiers
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Devise"
                value={configuration.devise}
                onChange={(e) => handleChange('devise', e.target.value)}
                disabled={readOnly}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={configuration.tva_applicable}
                    onChange={(e) => handleChange('tva_applicable', e.target.checked)}
                    disabled={readOnly}
                  />
                }
                label="TVA applicable"
              />
            </Grid>
            {configuration.tva_applicable && (
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Taux TVA (%)"
                  value={configuration.tva_taux_defaut || ''}
                  onChange={(e) => handleChange('tva_taux_defaut', parseFloat(e.target.value))}
                  disabled={readOnly}
                />
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Paramètres d'affichage */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            Paramètres d'affichage
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="color"
                label="Couleur primaire"
                value={configuration.couleur_primaire || '#1976d2'}
                onChange={(e) => handleChange('couleur_primaire', e.target.value)}
                disabled={readOnly}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="color"
                label="Couleur secondaire"
                value={configuration.couleur_secondaire || '#dc004e'}
                onChange={(e) => handleChange('couleur_secondaire', e.target.value)}
                disabled={readOnly}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                select
                label="Thème"
                value={configuration.theme}
                onChange={(e) => handleChange('theme', e.target.value)}
                disabled={readOnly}
              >
                {THEMES.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Fuseau horaire"
                value={configuration.fuseau_horaire}
                onChange={(e) => handleChange('fuseau_horaire', e.target.value)}
                disabled={readOnly}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Format de date"
                value={configuration.format_date}
                onChange={(e) => handleChange('format_date', e.target.value)}
                disabled={readOnly}
                helperText="Ex: DD/MM/YYYY"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Format d'heure"
                value={configuration.format_heure}
                onChange={(e) => handleChange('format_heure', e.target.value)}
                disabled={readOnly}
                helperText="Ex: HH:mm"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ConfigurationForm;
