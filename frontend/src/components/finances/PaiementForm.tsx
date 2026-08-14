import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  InputAdornment,
  Typography,
  Divider,
} from '@mui/material';
import { Facture, CreatePaiement, MODES_PAIEMENT } from '../../types/finance';
import { formatMontant } from '../../utils/formatters';

interface PaiementFormProps {
  facture?: Facture | null;
  onSubmit: (data: CreatePaiement) => void;
  onCancel: () => void;
  loading?: boolean;
}

const PaiementForm: React.FC<PaiementFormProps> = ({
  facture,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [formData, setFormData] = useState<CreatePaiement>({
    facture_id: facture?.id || 0,
    etudiant_id: facture?.etudiant_id || 0,
    montant: 0,
    mode_paiement: 'especes',
    reference_transaction: '',
    banque: '',
    numero_cheque: '',
    observations: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (facture) {
      setFormData((prev) => ({
        ...prev,
        facture_id: facture.id,
        etudiant_id: facture.etudiant_id,
        montant: facture.montant_restant,
      }));
    }
  }, [facture]);

  const handleChange = (field: keyof CreatePaiement, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.montant || formData.montant <= 0) {
      newErrors.montant = 'Le montant doit être supérieur à 0';
    }
    if (facture && formData.montant > facture.montant_restant) {
      newErrors.montant = `Le montant ne peut pas dépasser ${formatMontant(facture.montant_restant)}`;
    }
    if (!formData.mode_paiement) {
      newErrors.mode_paiement = 'Veuillez sélectionner un mode de paiement';
    }
    if (formData.mode_paiement === 'cheque' && !formData.numero_cheque) {
      newErrors.numero_cheque = 'Le numéro de chèque est requis';
    }
    if ((formData.mode_paiement === 'virement' || formData.mode_paiement === 'mobile_money') && !formData.reference_transaction) {
      newErrors.reference_transaction = 'La référence de transaction est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const showBanqueField = ['cheque', 'virement'].includes(formData.mode_paiement);
  const showChequeField = formData.mode_paiement === 'cheque';
  const showReferenceField = ['virement', 'mobile_money', 'carte_bancaire'].includes(formData.mode_paiement);

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {facture && (
        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Facture: {facture.numero_facture}
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={4}>
              <Typography variant="body2" color="text.secondary">Montant total</Typography>
              <Typography variant="h6">{formatMontant(facture.montant_total)}</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="body2" color="text.secondary">Déjà payé</Typography>
              <Typography variant="h6" color="success.main">{formatMontant(facture.montant_paye)}</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="body2" color="text.secondary">Reste à payer</Typography>
              <Typography variant="h6" color="error.main">{formatMontant(facture.montant_restant)}</Typography>
            </Grid>
          </Grid>
        </Box>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            required
            label="Montant"
            type="number"
            value={formData.montant}
            onChange={(e) => handleChange('montant', Number(e.target.value))}
            error={!!errors.montant}
            helperText={errors.montant}
            InputProps={{
              endAdornment: <InputAdornment position="end">XOF</InputAdornment>,
            }}
            disabled={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required error={!!errors.mode_paiement}>
            <InputLabel>Mode de paiement</InputLabel>
            <Select
              value={formData.mode_paiement}
              label="Mode de paiement"
              onChange={(e) => handleChange('mode_paiement', e.target.value)}
              disabled={loading}
            >
              {MODES_PAIEMENT.map((mode) => (
                <MenuItem key={mode.value} value={mode.value}>
                  {mode.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {showReferenceField && (
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Référence de transaction"
              value={formData.reference_transaction}
              onChange={(e) => handleChange('reference_transaction', e.target.value)}
              error={!!errors.reference_transaction}
              helperText={errors.reference_transaction}
              disabled={loading}
            />
          </Grid>
        )}

        {showBanqueField && (
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Banque"
              value={formData.banque}
              onChange={(e) => handleChange('banque', e.target.value)}
              disabled={loading}
            />
          </Grid>
        )}

        {showChequeField && (
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Numéro de chèque"
              value={formData.numero_cheque}
              onChange={(e) => handleChange('numero_cheque', e.target.value)}
              error={!!errors.numero_cheque}
              helperText={errors.numero_cheque}
              disabled={loading}
            />
          </Grid>
        )}

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Observations"
            value={formData.observations}
            onChange={(e) => handleChange('observations', e.target.value)}
            disabled={loading}
          />
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={onCancel} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" variant="contained" color="success" disabled={loading}>
              Enregistrer le paiement
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PaiementForm;
