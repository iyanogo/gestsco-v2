/**
 * Page publique d'inscription en ligne
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  ArrowForward as NextIcon,
  CheckCircle as SuccessIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';

import CampagneCard from '../../components/inscription/public/CampagneCard';
import CandidatureForm from '../../components/inscription/public/CandidatureForm';
import PiecesUpload from '../../components/inscription/public/PiecesUpload';
import PaiementForm from '../../components/inscription/public/PaiementForm';
import {
  CampagneInscription,
  DossierCandidature,
  CreateDossierCandidature,
  TypePieceRequise,
  CreatePaiement,
} from '../../types/inscription';
import { inscriptionPubliqueService } from '../../services';

const steps = [
  'Choix de la campagne',
  'Informations personnelles',
  'Pièces justificatives',
  'Paiement',
  'Confirmation',
];

const InscriptionPubliquePage: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Données
  const [campagnes, setCampagnes] = useState<CampagneInscription[]>([]);
  const [selectedCampagne, setSelectedCampagne] = useState<CampagneInscription | null>(null);
  const [placesRestantes, setPlacesRestantes] = useState<Record<number, number | null>>({});
  const [piecesRequises, setPiecesRequises] = useState<TypePieceRequise[]>([]);
  const [dossier, setDossier] = useState<DossierCandidature | null>(null);

  // Form state
  const [candidatureData, setCandidatureData] = useState<Partial<CreateDossierCandidature>>({});
  const [candidatureValid, setCandidatureValid] = useState(false);
  const [allPiecesUploaded, setAllPiecesUploaded] = useState(false);

  // Charger les campagnes
  useEffect(() => {
    const fetchCampagnes = async () => {
      setLoading(true);
      try {
        const data = await inscriptionPubliqueService.getCampagnesPubliques();
        setCampagnes(data);

        // Charger les places restantes pour chaque campagne
        const placesMap: Record<number, number | null> = {};
        for (const campagne of data) {
          try {
            const places = await inscriptionPubliqueService.getPlacesRestantes(campagne.id);
            placesMap[campagne.id] = places.places_restantes;
          } catch {
            placesMap[campagne.id] = null;
          }
        }
        setPlacesRestantes(placesMap);
      } catch (err: any) {
        setError('Erreur lors du chargement des campagnes');
      } finally {
        setLoading(false);
      }
    };

    fetchCampagnes();
  }, []);

  // Charger les pièces requises quand une campagne est sélectionnée
  useEffect(() => {
    if (selectedCampagne) {
      const fetchPiecesRequises = async () => {
        try {
          const data = await inscriptionPubliqueService.getPiecesRequises(selectedCampagne.id);
          setPiecesRequises(data);
        } catch (err) {
          console.error('Erreur lors du chargement des pièces requises:', err);
        }
      };
      fetchPiecesRequises();
    }
  }, [selectedCampagne]);

  const handleSelectCampagne = (campagne: CampagneInscription) => {
    setSelectedCampagne(campagne);
    setCandidatureData({ campagne_id: campagne.id });
    setActiveStep(1);
  };

  const handleCandidatureChange = (data: Partial<CreateDossierCandidature>, isValid: boolean) => {
    setCandidatureData(data);
    setCandidatureValid(isValid);
  };

  const handleCreateDossier = async () => {
    if (!candidatureValid || !selectedCampagne) return;

    setLoading(true);
    setError(null);
    try {
      const newDossier = await inscriptionPubliqueService.createDossierPublic(
        candidatureData as CreateDossierCandidature
      );
      setDossier(newDossier);
      setActiveStep(2);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de la création du dossier');
    } finally {
      setLoading(false);
    }
  };

  const handlePiecesUploadComplete = useCallback(() => {
    // Rafraîchir les données du dossier si nécessaire
  }, []);

  const handleAllPiecesUploaded = useCallback((allUploaded: boolean) => {
    setAllPiecesUploaded(allUploaded);
  }, []);

  const handleSoumettreEtPayer = () => {
    setActiveStep(3);
  };

  const handlePaiementSubmit = async (data: CreatePaiement) => {
    setLoading(true);
    setError(null);
    try {
      await inscriptionPubliqueService.createPaiementPublic(data);
      
      // Soumettre le dossier
      if (dossier) {
        await inscriptionPubliqueService.soumettreDossierPublic(dossier.id);
      }
      
      setActiveStep(4);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors du paiement');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCopyNumero = () => {
    if (dossier?.numero_dossier) {
      navigator.clipboard.writeText(dossier.numero_dossier);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h5" gutterBottom textAlign="center">
              Choisissez votre campagne d'inscription
            </Typography>
            <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
              Sélectionnez la campagne correspondant à votre niveau d'études
            </Typography>

            {loading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : campagnes.length === 0 ? (
              <Alert severity="info">
                Aucune campagne d'inscription n'est ouverte actuellement.
              </Alert>
            ) : (
              <Grid container spacing={3}>
                {campagnes.map((campagne) => (
                  <Grid item xs={12} sm={6} md={4} key={campagne.id}>
                    <CampagneCard
                      campagne={campagne}
                      placesRestantes={placesRestantes[campagne.id]}
                      onSelect={handleSelectCampagne}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h5" gutterBottom>
              Formulaire de candidature
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Campagne: <strong>{selectedCampagne?.libelle}</strong>
            </Typography>

            <CandidatureForm
              campagneId={selectedCampagne!.id}
              initialData={candidatureData}
              onChange={handleCandidatureChange}
            />

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
              <Button startIcon={<BackIcon />} onClick={handleBack}>
                Retour
              </Button>
              <Button
                variant="contained"
                endIcon={<NextIcon />}
                onClick={handleCreateDossier}
                disabled={!candidatureValid || loading}
              >
                {loading ? 'Création...' : 'Continuer'}
              </Button>
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Alert severity="success" sx={{ mb: 3 }}>
              Votre dossier a été créé avec le numéro: <strong>{dossier?.numero_dossier}</strong>
            </Alert>

            <PiecesUpload
              dossierId={dossier!.id}
              piecesRequises={piecesRequises}
              onUploadComplete={handlePiecesUploadComplete}
              onAllPiecesUploaded={handleAllPiecesUploaded}
            />

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
              <Button startIcon={<BackIcon />} onClick={handleBack}>
                Retour
              </Button>
              <Button
                variant="contained"
                endIcon={<NextIcon />}
                onClick={handleSoumettreEtPayer}
                disabled={!allPiecesUploaded}
              >
                Continuer vers le paiement
              </Button>
            </Box>
          </Box>
        );

      case 3:
        return (
          <Box>
            <PaiementForm
              dossierId={dossier!.id}
              montant={(selectedCampagne?.frais_inscription || 0) + (selectedCampagne?.frais_dossier || 0)}
              onSubmit={handlePaiementSubmit}
              loading={loading}
            />

            <Box sx={{ mt: 4 }}>
              <Button startIcon={<BackIcon />} onClick={handleBack}>
                Retour
              </Button>
            </Box>
          </Box>
        );

      case 4:
        return (
          <Box textAlign="center">
            <SuccessIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Inscription enregistrée !
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Votre dossier de candidature a été soumis avec succès.
            </Typography>

            <Card sx={{ maxWidth: 400, mx: 'auto', mb: 4 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Numéro de dossier
                </Typography>
                <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                  <Typography variant="h4" fontWeight="bold" color="primary">
                    {dossier?.numero_dossier}
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<CopyIcon />}
                    onClick={handleCopyNumero}
                  >
                    Copier
                  </Button>
                </Box>
              </CardContent>
            </Card>

            <Alert severity="info" sx={{ maxWidth: 500, mx: 'auto', textAlign: 'left' }}>
              <Typography variant="subtitle2" gutterBottom>
                Prochaines étapes:
              </Typography>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>Conservez précieusement votre numéro de dossier</li>
                <li>Votre paiement sera validé sous 24-48h</li>
                <li>Vous pouvez suivre l'état de votre dossier sur la page de suivi</li>
                <li>Vous serez contacté par email pour la suite de la procédure</li>
              </ul>
            </Alert>

            <Box sx={{ mt: 4 }}>
              <Button
                variant="contained"
                href="/suivi-dossier"
              >
                Suivre mon dossier
              </Button>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5', py: 4 }}>
      <Container maxWidth="lg">
        {/* En-tête */}
        <Box textAlign="center" sx={{ mb: 4 }}>
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Inscription en ligne
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Bienvenue sur le portail d'inscription en ligne
          </Typography>
        </Box>

        {/* Stepper */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Erreur */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Contenu */}
        <Paper sx={{ p: 4 }}>
          {renderStepContent()}
        </Paper>

        {/* Footer */}
        <Box textAlign="center" sx={{ mt: 4 }}>
          <Typography variant="body2" color="text.secondary">
            Besoin d'aide ? Contactez-nous à support@etablissement.bf
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default InscriptionPubliquePage;
