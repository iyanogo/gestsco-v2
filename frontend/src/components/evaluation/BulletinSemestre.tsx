import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Print as PrintIcon,
} from '@mui/icons-material';

import {
  BulletinSemestre as BulletinType,
  MENTION_LABELS,
  MENTION_COLORS,
  DECISION_LABELS,
  DECISION_COLORS,
} from '../../types/evaluation';
import bulletinService from '../../services/bulletinService';

interface BulletinSemestreProps {
  etudiantId: number;
  sessionId: number;
  semestre: number;
}

const BulletinSemestre: React.FC<BulletinSemestreProps> = ({
  etudiantId,
  sessionId,
  semestre,
}) => {
  const [bulletin, setBulletin] = useState<BulletinType | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    loadBulletin();
  }, [etudiantId, sessionId, semestre]);

  const loadBulletin = async () => {
    setLoading(true);
    try {
      const data = await bulletinService.getBulletinSemestre(etudiantId, sessionId, semestre);
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
      const blob = await bulletinService.downloadBulletinSemestre(etudiantId, sessionId, semestre);
      bulletinService.downloadBlob(blob, `bulletin_S${semestre}_${bulletin?.etudiant.matricule}.pdf`);
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
    <Box className="bulletin-container">
      {/* Actions (masquées à l'impression) */}
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
            BULLETIN DE NOTES
          </Typography>
          <Typography variant="h6">
            {bulletin.session.libelle} - Semestre {semestre}
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

        {/* Tableau des notes */}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Matière</TableCell>
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>CC</TableCell>
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>TP</TableCell>
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Examen</TableCell>
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Moyenne</TableCell>
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Crédit</TableCell>
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Obtenu</TableCell>
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Statut</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bulletin.matieres.map((matiere, index) => (
                <TableRow
                  key={matiere.id || index}
                  sx={{ '&:nth-of-type(odd)': { bgcolor: 'grey.50' } }}
                >
                  <TableCell>
                    {matiere.matiere?.code} - {matiere.matiere?.libelle || `Matière #${matiere.matiere_id}`}
                  </TableCell>
                  <TableCell align="center">
                    {matiere.note_cc?.toFixed(2) || '-'}
                  </TableCell>
                  <TableCell align="center">
                    {matiere.note_tp?.toFixed(2) || '-'}
                  </TableCell>
                  <TableCell align="center">
                    {matiere.note_examen?.toFixed(2) || '-'}
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 'bold',
                      color: matiere.moyenne_matiere && matiere.moyenne_matiere >= 10 ? 'success.main' : 'error.main',
                    }}
                  >
                    {matiere.moyenne_matiere?.toFixed(2) || '-'}
                  </TableCell>
                  <TableCell align="center">{matiere.credit_matiere}</TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 'bold',
                      color: matiere.credit_obtenu > 0 ? 'success.main' : 'error.main',
                    }}
                  >
                    {matiere.credit_obtenu}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={matiere.statut === 'valide' ? 'V' : 'NV'}
                      size="small"
                      color={matiere.statut === 'valide' ? 'success' : 'error'}
                      sx={{ minWidth: 40 }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Divider sx={{ my: 3 }} />

        {/* Récapitulatif */}
        {bulletin.resultat && (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Moyenne Générale
                </Typography>
                <Typography
                  variant="h4"
                  color={bulletin.resultat.moyenne_generale && bulletin.resultat.moyenne_generale >= 10 ? 'success.main' : 'error.main'}
                >
                  {bulletin.resultat.moyenne_generale?.toFixed(2) || '-'}
                </Typography>
                <Typography variant="caption">/20</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Crédits Obtenus
                </Typography>
                <Typography variant="h4" color="primary">
                  {bulletin.resultat.total_credits_obtenus}
                </Typography>
                <Typography variant="caption">
                  / {bulletin.resultat.total_credits_inscrits}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Rang
                </Typography>
                <Typography variant="h4">
                  {bulletin.resultat.rang || '-'}
                </Typography>
                <Typography variant="caption">
                  / {bulletin.resultat.effectif || '-'}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
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
                    }}
                  />
                ) : (
                  <Typography variant="h6">-</Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Décision */}
        {bulletin.resultat && (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              DÉCISION
            </Typography>
            <Chip
              label={DECISION_LABELS[bulletin.resultat.decision] || bulletin.resultat.decision}
              color={DECISION_COLORS[bulletin.resultat.decision] || 'default'}
              sx={{ fontSize: '1.1rem', py: 2, px: 3 }}
            />
          </Box>
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
          .bulletin-container, .bulletin-container * {
            visibility: visible;
          }
          .bulletin-container {
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

export default BulletinSemestre;
