import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { StatistiquesFinancesCard } from '../components/finances';
import { Facture, Paiement, Echeancier } from '../types/finance';
import { formatMontant, formatDate } from '../utils/formatters';
import factureService from '../services/factureService';
import paiementFactureService from '../services/paiementFactureService';
import echeancierService from '../services/echeancierService';
import compteEtudiantService from '../services/compteEtudiantService';

const DashboardFinancesPage: React.FC = () => {
  const navigate = useNavigate();
  const [facturesExpirees, setFacturesExpirees] = useState<Facture[]>([]);
  const [paiementsEnAttente, setPaiementsEnAttente] = useState<Paiement[]>([]);
  const [echeancesProches, setEcheancesProches] = useState<Echeancier[]>([]);
  const [nbDebiteurs, setNbDebiteurs] = useState(0);
  const [, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [expirees, enAttente, proches, debiteurs] = await Promise.all([
          factureService.getFacturesExpirees(),
          paiementFactureService.getPaiementsEnAttente(),
          echeancierService.getEcheancesProches(7),
          compteEtudiantService.getComptesDebiteurs(),
        ]);
        setFacturesExpirees(expirees.slice(0, 5));
        setPaiementsEnAttente(enAttente.slice(0, 5));
        setEcheancesProches(proches.slice(0, 5));
        setNbDebiteurs(debiteurs.length);
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard Finances
      </Typography>

      <StatistiquesFinancesCard anneeId={null} />

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <WarningIcon color="error" />
                <Typography variant="h6">Factures expirées</Typography>
                <Chip label={facturesExpirees.length} color="error" size="small" />
              </Box>
              {facturesExpirees.length === 0 ? (
                <Typography color="text.secondary">Aucune facture expirée</Typography>
              ) : (
                <List dense>
                  {facturesExpirees.map((facture) => (
                    <ListItem key={facture.id} disablePadding>
                      <ListItemText
                        primary={facture.numero_facture}
                        secondary={`${formatMontant(facture.montant_restant)} - Échéance: ${formatDate(facture.date_echeance)}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
              <Button
                fullWidth
                variant="outlined"
                color="error"
                sx={{ mt: 2 }}
                onClick={() => navigate('/finances/factures')}
              >
                Voir toutes les factures
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <PaymentIcon color="warning" />
                <Typography variant="h6">Paiements en attente</Typography>
                <Chip label={paiementsEnAttente.length} color="warning" size="small" />
              </Box>
              {paiementsEnAttente.length === 0 ? (
                <Typography color="text.secondary">Aucun paiement en attente</Typography>
              ) : (
                <List dense>
                  {paiementsEnAttente.map((paiement) => (
                    <ListItem key={paiement.id} disablePadding>
                      <ListItemText
                        primary={paiement.numero_paiement}
                        secondary={`${formatMontant(paiement.montant)} - ${formatDate(paiement.date_paiement)}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
              <Button
                fullWidth
                variant="outlined"
                color="warning"
                sx={{ mt: 2 }}
                onClick={() => navigate('/finances/paiements')}
              >
                Voir tous les paiements
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ScheduleIcon color="info" />
                <Typography variant="h6">Échéances proches (7j)</Typography>
                <Chip label={echeancesProches.length} color="info" size="small" />
              </Box>
              {echeancesProches.length === 0 ? (
                <Typography color="text.secondary">Aucune échéance proche</Typography>
              ) : (
                <List dense>
                  {echeancesProches.map((echeance) => (
                    <ListItem key={echeance.id} disablePadding>
                      <ListItemText
                        primary={`Échéance #${echeance.numero_echeance}`}
                        secondary={`${formatMontant(echeance.montant_echeance)} - ${formatDate(echeance.date_echeance)}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <PeopleIcon color="error" />
                <Typography variant="h6">Étudiants débiteurs</Typography>
              </Box>
              <Typography variant="h3" color="error.main" sx={{ textAlign: 'center', py: 2 }}>
                {nbDebiteurs}
              </Typography>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => navigate('/finances/comptes')}
              >
                Voir les comptes débiteurs
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Accès rapides
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<ReceiptIcon />}
                    onClick={() => navigate('/finances/factures')}
                  >
                    Factures
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="success"
                    startIcon={<PaymentIcon />}
                    onClick={() => navigate('/finances/paiements')}
                  >
                    Paiements
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => navigate('/admin/finances/remises')}
                  >
                    Remises
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => navigate('/finances/types-frais')}
                  >
                    Configuration
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardFinancesPage;
