import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Grid,
  Skeleton,
  Divider,
} from '@mui/material';
import {
  AccountBalance as AccountIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { CompteEtudiantWithDetails } from '../../types/finance';
import { formatMontant, formatStatutCompte, getCouleurSolde, formatDate } from '../../utils/formatters';
import compteEtudiantService from '../../services/compteEtudiantService';
import { downloadBlob } from '../../utils/formatters';

interface CompteEtudiantCardProps {
  etudiantId: number;
  anneeId: number;
  onViewReleve?: () => void;
}

const CompteEtudiantCard: React.FC<CompteEtudiantCardProps> = ({
  etudiantId,
  anneeId,
  onViewReleve,
}) => {
  const [compte, setCompte] = useState<CompteEtudiantWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCompte = async () => {
      setLoading(true);
      try {
        const data = await compteEtudiantService.getCompteEtudiant(etudiantId, anneeId);
        setCompte(data);
      } catch (error) {
        console.error('Erreur lors du chargement du compte:', error);
      } finally {
        setLoading(false);
      }
    };

    if (etudiantId && anneeId) {
      loadCompte();
    }
  }, [etudiantId, anneeId]);

  const handleDownloadReleve = async () => {
    if (!compte) return;
    try {
      const blob = await compteEtudiantService.downloadRelevePDF(compte.id);
      downloadBlob(blob, `releve_compte_${compte.id}.pdf`);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="text" width="60%" height={40} />
          <Skeleton variant="rectangular" height={100} sx={{ mt: 2 }} />
        </CardContent>
      </Card>
    );
  }

  if (!compte) {
    return (
      <Card>
        <CardContent>
          <Typography color="text.secondary">Aucun compte trouvé</Typography>
        </CardContent>
      </Card>
    );
  }

  const { label: statutLabel, color: statutColor } = formatStatutCompte(compte.statut_compte);

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountIcon color="primary" />
            <Typography variant="h6">Compte Étudiant</Typography>
          </Box>
          <Chip label={statutLabel} color={statutColor} size="small" />
        </Box>

        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Solde actuel
          </Typography>
          <Typography
            variant="h3"
            sx={{ color: getCouleurSolde(compte.solde_actuel), fontWeight: 'bold' }}
          >
            {formatMontant(compte.solde_actuel, compte.devise)}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Total facturé
              </Typography>
              <Typography variant="h6">
                {formatMontant(compte.total_facture, compte.devise)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Total payé
              </Typography>
              <Typography variant="h6" color="success.main">
                {formatMontant(compte.total_paye, compte.devise)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Reste à payer
              </Typography>
              <Typography variant="h6" color="error.main">
                {formatMontant(compte.total_restant, compte.devise)}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {compte.date_derniere_operation && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
            Dernière opération: {formatDate(compte.date_derniere_operation)}
          </Typography>
        )}

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadReleve}
          >
            Télécharger relevé
          </Button>
          {onViewReleve && (
            <Button variant="contained" onClick={onViewReleve}>
              Voir détails
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default CompteEtudiantCard;
