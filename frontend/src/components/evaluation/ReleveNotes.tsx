import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
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
  Grid,
} from '@mui/material';
import {
  Print as PrintIcon,
} from '@mui/icons-material';

import {
  ReleveNotes as ReleveType,
  MENTION_LABELS,
  DECISION_LABELS,
  DECISION_COLORS,
} from '../../types/evaluation';
import bulletinService from '../../services/bulletinService';

interface ReleveNotesProps {
  etudiantId: number;
  anneeId?: number;
}

const ReleveNotes: React.FC<ReleveNotesProps> = ({
  etudiantId,
  anneeId,
}) => {
  const [releve, setReleve] = useState<ReleveType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReleve();
  }, [etudiantId, anneeId]);

  const loadReleve = async () => {
    setLoading(true);
    try {
      const data = await bulletinService.getReleveNotes(etudiantId, anneeId);
      setReleve(data);
    } catch (error) {
      console.error('Erreur chargement relevé:', error);
    } finally {
      setLoading(false);
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

  if (!releve) {
    return (
      <Typography color="text.secondary" textAlign="center">
        Relevé de notes non disponible
      </Typography>
    );
  }

  return (
    <Box className="releve-notes-container">
      {/* Actions */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2, '@media print': { display: 'none' } }}>
        <Button
          variant="outlined"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
        >
          Imprimer
        </Button>
      </Box>

      {/* Relevé */}
      <Paper sx={{ p: 4, '@media print': { boxShadow: 'none' } }}>
        {/* En-tête */}
        <Box textAlign="center" mb={3}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            RELEVÉ DE NOTES
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Document officiel
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
              {releve.etudiant.matricule}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Nom et Prénom
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {releve.etudiant.nom} {releve.etudiant.prenom}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" color="text.secondary">
              Date de naissance
            </Typography>
            <Typography variant="body1">
              {releve.etudiant.date_naissance || '-'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" color="text.secondary">
              Lieu de naissance
            </Typography>
            <Typography variant="body1">
              {releve.etudiant.lieu_naissance || '-'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" color="text.secondary">
              Nationalité
            </Typography>
            <Typography variant="body1">
              {releve.etudiant.nationalite || '-'}
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Parcours académique */}
        {releve.parcours.map((parcour, index) => (
          <Box key={parcour.inscription_id || index} sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ bgcolor: 'primary.main', color: 'white', p: 1 }}>
              Année Académique: {parcour.annee_academique}
            </Typography>

            {/* Tableau des matières */}
            <TableContainer sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Code</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Matière</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Crédit</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Moyenne</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Crédit Obtenu</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Statut</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {parcour.matieres.map((matiere, mIndex) => (
                    <TableRow key={mIndex}>
                      <TableCell>{matiere.code || '-'}</TableCell>
                      <TableCell>{matiere.libelle || '-'}</TableCell>
                      <TableCell align="center">{matiere.credit}</TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          fontWeight: 'bold',
                          color: matiere.moyenne && matiere.moyenne >= 10 ? 'success.main' : 'error.main',
                        }}
                      >
                        {matiere.moyenne?.toFixed(2) || '-'}
                      </TableCell>
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
                          sx={{ minWidth: 35 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Résultats semestriels */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              {parcour.semestres.map((sem) => (
                <Grid item xs={12} sm={6} key={sem.semestre}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Semestre {sem.semestre}
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Moyenne</Typography>
                        <Typography
                          variant="body1"
                          fontWeight="bold"
                          color={sem.moyenne && sem.moyenne >= 10 ? 'success.main' : 'error.main'}
                        >
                          {sem.moyenne?.toFixed(2) || '-'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Crédits</Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {sem.credits_obtenus}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Mention</Typography>
                        <Typography variant="body1">
                          {sem.mention ? MENTION_LABELS[sem.mention] : '-'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Décision</Typography>
                        <Chip
                          label={DECISION_LABELS[sem.decision] || sem.decision}
                          size="small"
                          color={DECISION_COLORS[sem.decision] || 'default'}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {/* Résultat annuel */}
            {parcour.resultat_annuel && (
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                  Résultat Annuel
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">Moyenne Annuelle</Typography>
                    <Typography
                      variant="h6"
                      color={parcour.resultat_annuel.moyenne && parcour.resultat_annuel.moyenne >= 10 ? 'success.main' : 'error.main'}
                    >
                      {parcour.resultat_annuel.moyenne?.toFixed(2) || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">Crédits Obtenus</Typography>
                    <Typography variant="h6">
                      {parcour.resultat_annuel.credits_obtenus}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">Mention</Typography>
                    <Typography variant="body1">
                      {parcour.resultat_annuel.mention ? MENTION_LABELS[parcour.resultat_annuel.mention] : '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">Décision</Typography>
                    <Chip
                      label={DECISION_LABELS[parcour.resultat_annuel.decision] || parcour.resultat_annuel.decision}
                      color={DECISION_COLORS[parcour.resultat_annuel.decision] || 'default'}
                    />
                  </Grid>
                </Grid>
              </Paper>
            )}
          </Box>
        ))}

        <Divider sx={{ my: 3 }} />

        {/* Total général */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            TOTAL CRÉDITS OBTENUS
          </Typography>
          <Typography variant="h3" color="primary">
            {releve.total_credits_obtenus}
          </Typography>
        </Box>

        {/* Pied de page */}
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Document généré le {new Date().toLocaleDateString('fr-FR')}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ mb: 4 }}>
              Signature et cachet
            </Typography>
            <Box sx={{ borderTop: '1px solid black', width: 200, pt: 1 }}>
              <Typography variant="caption">Le Responsable</Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Styles pour impression */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .releve-notes-container, .releve-notes-container * {
            visibility: visible;
          }
          .releve-notes-container {
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

export default ReleveNotes;
