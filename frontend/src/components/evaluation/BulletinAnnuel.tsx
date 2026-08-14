import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  Divider,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Print as PrintIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';

import {
  BulletinAnnuel as BulletinType,
  MENTION_LABELS,
  MENTION_COLORS,
  DECISION_LABELS,
  DECISION_COLORS,
} from '../../types/evaluation';
import bulletinService from '../../services/bulletinService';

interface BulletinAnnuelProps {
  etudiantId: number;
  anneeId: number;
}

const BulletinAnnuel: React.FC<BulletinAnnuelProps> = ({
  etudiantId,
  anneeId,
}) => {
  const [bulletin, setBulletin] = useState<BulletinType | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    loadBulletin();
  }, [etudiantId, anneeId]);

  const loadBulletin = async () => {
    setLoading(true);
    try {
      const data = await bulletinService.getBulletinAnnuel(etudiantId, anneeId);
      setBulletin(data);
    } catch (error) {
      console.error('Erreur chargement bulletin:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await bulletinService.downloadBulletinAnnuel(etudiantId, anneeId);
      bulletinService.downloadBlob(blob, `bulletin_annuel_${bulletin?.etudiant.matricule}.pdf`);
    } catch (error) {
      console.error('Erreur téléchargement:', error);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!bulletin) {
    return (
      <Typography color="text.secondary" textAlign="center">
        Bulletin non disponible
      </Typography>
    );
  }

  return (
    <Box className="bulletin-annuel-container">
      {/* Actions */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2, '@media print': { display: 'none' } }}>
        <Button
          variant="contained"
          startIcon={downloading ? <CircularProgress size={20} /> : <DownloadIcon />}
          onClick={handleDownload}
          disabled={downloading}
        >
          Télécharger PDF
        </Button>
        <Button
          variant="outlined"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
        >
          Imprimer
        </Button>
      </Box>

      {/* Bulletin */}
      <Paper sx={{ p: 4, '@media print': { boxShadow: 'none' } }}>
        {/* En-tête */}
        <Box textAlign="center" mb={3}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            BULLETIN ANNUEL
          </Typography>
          <Typography variant="h6">
            Année Académique {bulletin.inscription?.annee_academique || anneeId}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Informations étudiant */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Matricule
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {bulletin.etudiant.matricule}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Nom et Prénom
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {bulletin.etudiant.nom} {bulletin.etudiant.prenom}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Date de naissance
            </Typography>
            <Typography variant="body1">
              {bulletin.etudiant.date_naissance || '-'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Lieu de naissance
            </Typography>
            <Typography variant="body1">
              {bulletin.etudiant.lieu_naissance || '-'}
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Résultats par semestre */}
        <Typography variant="h6" gutterBottom>
          Résultats par Semestre
        </Typography>
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {bulletin.semestres.map((sem) => (
            <Grid item xs={12} md={6} key={sem.semestre}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Semestre {sem.semestre}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Moyenne
                      </Typography>
                      <Typography
                        variant="h5"
                        color={sem.moyenne_generale && sem.moyenne_generale >= 10 ? 'success.main' : 'error.main'}
                      >
                        {sem.moyenne_generale?.toFixed(2) || '-'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Crédits
                      </Typography>
                      <Typography variant="h5">
                        {sem.total_credits_obtenus}/{sem.total_credits_inscrits}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Rang
                      </Typography>
                      <Typography variant="body1">
                        {sem.rang || '-'}/{sem.effectif || '-'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Décision
                      </Typography>
                      <Chip
                        label={DECISION_LABELS[sem.decision] || sem.decision}
                        size="small"
                        color={DECISION_COLORS[sem.decision] || 'default'}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Résultat annuel */}
        {bulletin.resultat && (
          <>
            <Typography variant="h6" gutterBottom>
              Résultat Annuel
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={6} sm={3}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Moyenne S1
                  </Typography>
                  <Typography
                    variant="h5"
                    color={bulletin.resultat.moyenne_semestre1 && bulletin.resultat.moyenne_semestre1 >= 10 ? 'success.main' : 'error.main'}
                  >
                    {bulletin.resultat.moyenne_semestre1?.toFixed(2) || '-'}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Moyenne S2
                  </Typography>
                  <Typography
                    variant="h5"
                    color={bulletin.resultat.moyenne_semestre2 && bulletin.resultat.moyenne_semestre2 >= 10 ? 'success.main' : 'error.main'}
                  >
                    {bulletin.resultat.moyenne_semestre2?.toFixed(2) || '-'}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light' }}>
                  <Typography variant="caption" color="primary.contrastText">
                    Moyenne Annuelle
                  </Typography>
                  <Typography variant="h4" color="primary.contrastText">
                    {bulletin.resultat.moyenne_annuelle?.toFixed(2) || '-'}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Crédits Totaux
                  </Typography>
                  <Typography variant="h5" color="primary">
                    {bulletin.resultat.total_credits_obtenus}
                  </Typography>
                  <Typography variant="caption">
                    / {bulletin.resultat.total_credits_inscrits}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Mention et Décision */}
            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid item xs={12} sm={4}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Mention
                  </Typography>
                  {bulletin.resultat.mention ? (
                    <Chip
                      label={MENTION_LABELS[bulletin.resultat.mention]}
                      sx={{
                        mt: 1,
                        bgcolor: MENTION_COLORS[bulletin.resultat.mention],
                        color: 'white',
                        display: 'block',
                      }}
                    />
                  ) : (
                    <Typography variant="h6">-</Typography>
                  )}
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Décision
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Chip
                      label={DECISION_LABELS[bulletin.resultat.decision] || bulletin.resultat.decision}
                      color={DECISION_COLORS[bulletin.resultat.decision] || 'default'}
                      sx={{ fontSize: '1rem' }}
                    />
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    bgcolor: bulletin.resultat.passage_niveau_superieur ? 'success.light' : 'error.light',
                  }}
                >
                  <Typography variant="caption" color="inherit">
                    Passage Niveau Supérieur
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    {bulletin.resultat.passage_niveau_superieur ? (
                      <CheckIcon sx={{ fontSize: 40, color: 'success.main' }} />
                    ) : (
                      <CancelIcon sx={{ fontSize: 40, color: 'error.main' }} />
                    )}
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </>
        )}

        {/* Pied de page */}
        <Box sx={{ mt: 4, textAlign: 'right' }}>
          <Typography variant="caption" color="text.secondary">
            Document généré le {new Date().toLocaleDateString('fr-FR')}
          </Typography>
        </Box>
      </Paper>

      {/* Styles pour impression */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .bulletin-annuel-container, .bulletin-annuel-container * {
            visibility: visible;
          }
          .bulletin-annuel-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </Box>
  );
};

export default BulletinAnnuel;
