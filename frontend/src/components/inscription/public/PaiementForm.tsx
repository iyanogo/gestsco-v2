/**
 * Formulaire de paiement public
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Card,
  CardContent,
  Alert,
  Button,
  Grid,
  Divider,
} from '@mui/material';
import {
  Payment as PaymentIcon,
  Phone as PhoneIcon,
  AccountBalance as BankIcon,
  Money as CashIcon,
} from '@mui/icons-material';

import { CreatePaiement } from '../../../types/inscription';

interface PaiementFormProps {
  dossierId: number;
  montant: number;
  onSubmit: (data: CreatePaiement) => Promise<void>;
  loading?: boolean;
}

const MODES_PAIEMENT = [
  { value: 'orange_money', label: 'Orange Money', icon: <PhoneIcon />, color: '#ff6600' },
  { value: 'moov_money', label: 'Moov Money', icon: <PhoneIcon />, color: '#0066cc' },
  { value: 'virement', label: 'Virement bancaire', icon: <BankIcon />, color: '#4caf50' },
  { value: 'especes', label: 'Espèces', icon: <CashIcon />, color: '#9e9e9e' },
];

const formatMoney = (value: number): string => {
  return `${value.toLocaleString('fr-FR')} FCFA`;
};

const PaiementForm: React.FC<PaiementFormProps> = ({
  dossierId,
  montant,
  onSubmit,
  loading = false,
}) => {
  const [modePaiement, setModePaiement] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [operateur, setOperateur] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    if (!modePaiement) {
      setError('Veuillez sélectionner un mode de paiement');
      return;
    }

    if (['orange_money', 'moov_money'].includes(modePaiement) && !reference) {
      setError('Veuillez entrer la référence de la transaction');
      return;
    }

    const data: CreatePaiement = {
      dossier_id: dossierId,
      type_paiement: 'frais_inscription',
      montant,
      mode_paiement: modePaiement,
      reference_paiement: reference || undefined,
      operateur: operateur || undefined,
    };

    try {
      await onSubmit(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'enregistrement du paiement');
    }
  };

  const getInstructions = () => {
    switch (modePaiement) {
      case 'orange_money':
        return (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Instructions Orange Money:</Typography>
            <ol style={{ margin: 0, paddingLeft: 20 }}>
              <li>Composez *144# sur votre téléphone</li>
              <li>Sélectionnez "Paiement marchand"</li>
              <li>Entrez le code marchand: <strong>XXXXX</strong></li>
              <li>Entrez le montant: <strong>{formatMoney(montant)}</strong></li>
              <li>Confirmez avec votre code secret</li>
              <li>Notez le numéro de transaction et entrez-le ci-dessous</li>
            </ol>
          </Alert>
        );
      case 'moov_money':
        return (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Instructions Moov Money:</Typography>
            <ol style={{ margin: 0, paddingLeft: 20 }}>
              <li>Composez *555# sur votre téléphone</li>
              <li>Sélectionnez "Paiement"</li>
              <li>Entrez le numéro: <strong>XX XX XX XX</strong></li>
              <li>Entrez le montant: <strong>{formatMoney(montant)}</strong></li>
              <li>Confirmez avec votre code secret</li>
              <li>Notez le numéro de transaction et entrez-le ci-dessous</li>
            </ol>
          </Alert>
        );
      case 'virement':
        return (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Instructions virement bancaire:</Typography>
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2"><strong>Banque:</strong> XXXXX</Typography>
              <Typography variant="body2"><strong>IBAN:</strong> BF XX XXXX XXXX XXXX XXXX XXXX XXX</Typography>
              <Typography variant="body2"><strong>Bénéficiaire:</strong> Établissement XYZ</Typography>
              <Typography variant="body2"><strong>Motif:</strong> Inscription - N° dossier</Typography>
            </Box>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Après le virement, entrez la référence de la transaction ci-dessous.
            </Typography>
          </Alert>
        );
      case 'especes':
        return (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Paiement en espèces:</Typography>
            <Typography variant="body2">
              Présentez-vous au service de la scolarité avec le montant exact de{' '}
              <strong>{formatMoney(montant)}</strong> et votre numéro de dossier.
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>Horaires:</strong> Lundi - Vendredi, 8h - 16h
            </Typography>
          </Alert>
        );
      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Paiement des frais
      </Typography>

      {/* Récapitulatif */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Montant à payer
          </Typography>
          <Typography variant="h4" color="primary" fontWeight="bold">
            {formatMoney(montant)}
          </Typography>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Sélection du mode de paiement */}
      <Typography variant="subtitle1" gutterBottom>
        Choisissez votre mode de paiement
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {MODES_PAIEMENT.map((mode) => (
          <Grid item xs={6} sm={3} key={mode.value}>
            <Card
              variant="outlined"
              sx={{
                cursor: 'pointer',
                borderColor: modePaiement === mode.value ? mode.color : 'divider',
                borderWidth: modePaiement === mode.value ? 2 : 1,
                backgroundColor: modePaiement === mode.value ? `${mode.color}10` : 'transparent',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: mode.color,
                },
              }}
              onClick={() => setModePaiement(mode.value)}
            >
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Box sx={{ color: mode.color, mb: 1 }}>{mode.icon}</Box>
                <Typography variant="body2" fontWeight="medium">
                  {mode.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Instructions spécifiques */}
      {getInstructions()}

      {/* Champs de référence */}
      {modePaiement && modePaiement !== 'especes' && (
        <Box sx={{ mt: 3 }}>
          <Divider sx={{ mb: 3 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Référence de transaction"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ex: TXN123456789"
                required={['orange_money', 'moov_money'].includes(modePaiement)}
              />
            </Grid>
            {['orange_money', 'moov_money'].includes(modePaiement) && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Numéro de téléphone utilisé"
                  value={operateur}
                  onChange={(e) => setOperateur(e.target.value)}
                  placeholder="Ex: 70 XX XX XX"
                />
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      {/* Bouton de soumission */}
      <Box sx={{ mt: 4 }}>
        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={handleSubmit}
          disabled={loading || !modePaiement}
          startIcon={<PaymentIcon />}
        >
          {loading ? 'Enregistrement...' : 'Enregistrer le paiement'}
        </Button>
      </Box>
    </Box>
  );
};

export default PaiementForm;
