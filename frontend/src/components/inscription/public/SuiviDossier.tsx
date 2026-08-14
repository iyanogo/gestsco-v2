/**
 * Composant pour suivre l'état d'un dossier
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  CircularProgress,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  HourglassEmpty as PendingIcon,
  Description as DocIcon,
  Payment as PaymentIcon,
  School as SchoolIcon,
} from '@mui/icons-material';

import { DossierCandidatureDetails, PieceJointe, Paiement } from '../../../types/inscription';
import { inscriptionPubliqueService } from '../../../services';

interface SuiviDossierProps {
  numeroDossier: string;
}

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatMoney = (value: number): string => {
  return `${value.toLocaleString('fr-FR')} FCFA`;
};

const getStatutInfo = (statut: string) => {
  switch (statut) {
    case 'en_cours':
      return { label: 'En cours de saisie', color: 'default' as const, step: 0 };
    case 'complet':
      return { label: 'Dossier soumis', color: 'info' as const, step: 1 };
    case 'valide':
      return { label: 'Dossier validé', color: 'warning' as const, step: 2 };
    case 'admis':
      return { label: 'Admis', color: 'success' as const, step: 3 };
    case 'refuse':
      return { label: 'Refusé', color: 'error' as const, step: -1 };
    default:
      return { label: statut, color: 'default' as const, step: 0 };
  }
};

const SuiviDossier: React.FC<SuiviDossierProps> = ({ numeroDossier }) => {
  const [dossier, setDossier] = useState<DossierCandidatureDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDossier = async () => {
      if (!numeroDossier) return;
      
      setLoading(true);
      setError(null);
      try {
        const data = await inscriptionPubliqueService.getDossierDetailsPublic(numeroDossier);
        setDossier(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Dossier non trouvé');
      } finally {
        setLoading(false);
      }
    };

    fetchDossier();
  }, [numeroDossier]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">{error}</Alert>
    );
  }

  if (!dossier) {
    return (
      <Alert severity="warning">Aucun dossier trouvé avec ce numéro</Alert>
    );
  }

  const statutInfo = getStatutInfo(dossier.statut_dossier);
  const paiementsValides = dossier.paiements?.filter(p => p.statut_paiement === 'valide') || [];
  const montantTotalPaye = paiementsValides.reduce((sum, p) => sum + p.montant, 0);

  const steps = [
    { label: 'Dossier créé', description: `Créé le ${formatDate(dossier.created_at)}` },
    { label: 'Dossier soumis', description: dossier.date_soumission ? `Soumis le ${formatDate(dossier.date_soumission)}` : 'En attente de soumission' },
    { label: 'Dossier validé', description: dossier.date_validation ? `Validé le ${formatDate(dossier.date_validation)}` : 'En attente de validation' },
    { label: 'Admission', description: dossier.statut_dossier === 'admis' ? 'Félicitations ! Vous êtes admis(e)' : 'En attente de décision' },
  ];

  return (
    <Box>
      {/* En-tête */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
            <Box>
              <Typography variant="h5" fontWeight="bold">
                Dossier N° {dossier.numero_dossier}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {dossier.candidat_prenom} {dossier.candidat_nom}
              </Typography>
            </Box>
            <Chip
              label={statutInfo.label}
              color={statutInfo.color}
              size="medium"
              sx={{ fontWeight: 'bold' }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Message de refus */}
      {dossier.statut_dossier === 'refuse' && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="subtitle2">Dossier refusé</Typography>
          {dossier.commentaire_validation && (
            <Typography variant="body2">{dossier.commentaire_validation}</Typography>
          )}
        </Alert>
      )}

      {/* Message d'admission */}
      {dossier.statut_dossier === 'admis' && (
        <Alert severity="success" sx={{ mb: 3 }} icon={<SchoolIcon />}>
          <Typography variant="subtitle2">Félicitations ! Vous êtes admis(e)</Typography>
          <Typography variant="body2">
            Veuillez vous présenter au service de la scolarité pour finaliser votre inscription.
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Timeline */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Progression du dossier
              </Typography>
              <Stepper
                activeStep={statutInfo.step}
                orientation="vertical"
              >
                {steps.map((step, index) => (
                  <Step key={step.label} completed={index < statutInfo.step}>
                    <StepLabel
                      error={dossier.statut_dossier === 'refuse' && index === statutInfo.step}
                    >
                      {step.label}
                    </StepLabel>
                    <StepContent>
                      <Typography variant="body2" color="text.secondary">
                        {step.description}
                      </Typography>
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
            </CardContent>
          </Card>
        </Grid>

        {/* Pièces jointes */}
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <DocIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Pièces jointes
              </Typography>
              {dossier.pieces_jointes && dossier.pieces_jointes.length > 0 ? (
                <List dense>
                  {dossier.pieces_jointes.map((piece: PieceJointe) => (
                    <ListItem key={piece.id}>
                      <ListItemIcon>
                        {piece.is_valide === true && <CheckIcon color="success" />}
                        {piece.is_valide === false && <CancelIcon color="error" />}
                        {piece.is_valide === null && <PendingIcon color="warning" />}
                      </ListItemIcon>
                      <ListItemText
                        primary={piece.libelle}
                        secondary={
                          piece.is_valide === false && piece.commentaire
                            ? `Refusé: ${piece.commentaire}`
                            : piece.is_valide === true
                            ? 'Validé'
                            : 'En attente de validation'
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Aucune pièce jointe
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Paiements */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <PaymentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Paiements
              </Typography>
              {dossier.paiements && dossier.paiements.length > 0 ? (
                <>
                  <List dense>
                    {dossier.paiements.map((paiement: Paiement) => (
                      <ListItem key={paiement.id}>
                        <ListItemIcon>
                          {paiement.statut_paiement === 'valide' && <CheckIcon color="success" />}
                          {paiement.statut_paiement === 'refuse' && <CancelIcon color="error" />}
                          {paiement.statut_paiement === 'en_attente' && <PendingIcon color="warning" />}
                        </ListItemIcon>
                        <ListItemText
                          primary={`${formatMoney(paiement.montant)} - ${paiement.mode_paiement}`}
                          secondary={
                            paiement.statut_paiement === 'valide'
                              ? `Validé le ${formatDate(paiement.date_validation)}`
                              : paiement.statut_paiement === 'refuse'
                              ? `Refusé: ${paiement.commentaire || '-'}`
                              : 'En attente de validation'
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle1" fontWeight="bold">
                    Total payé: {formatMoney(montantTotalPaye)}
                  </Typography>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Aucun paiement enregistré
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SuiviDossier;
