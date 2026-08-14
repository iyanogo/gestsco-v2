/**
 * Affichage détaillé d'un dossier pour l'administration
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Chip,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Description as DocIcon,
  Payment as PaymentIcon,
  CheckCircle as ValidIcon,
  Cancel as InvalidIcon,
  HourglassEmpty as PendingIcon,
} from '@mui/icons-material';

import { DossierCandidatureDetails, PieceJointe, Paiement } from '../../types/inscription';
import { dossierCandidatureService } from '../../services';

interface DossierDetailsAdminProps {
  dossierId: number;
  onValidate?: () => void;
  onRefuse?: () => void;
  onAdmit?: () => void;
  onClose?: () => void;
}

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('fr-FR');
};

const formatMoney = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '-';
  return `${value.toLocaleString('fr-FR')} FCFA`;
};

const getStatutColor = (statut: string): 'default' | 'info' | 'warning' | 'success' | 'error' => {
  switch (statut) {
    case 'en_cours': return 'default';
    case 'complet': return 'info';
    case 'valide': return 'warning';
    case 'admis': return 'success';
    case 'refuse': return 'error';
    default: return 'default';
  }
};

const getStatutLabel = (statut: string): string => {
  switch (statut) {
    case 'en_cours': return 'En cours';
    case 'complet': return 'Complet';
    case 'valide': return 'Validé';
    case 'admis': return 'Admis';
    case 'refuse': return 'Refusé';
    default: return statut;
  }
};

const getPaiementStatutIcon = (statut: string) => {
  switch (statut) {
    case 'valide': return <ValidIcon color="success" fontSize="small" />;
    case 'refuse': return <InvalidIcon color="error" fontSize="small" />;
    default: return <PendingIcon color="warning" fontSize="small" />;
  }
};

const DossierDetailsAdmin: React.FC<DossierDetailsAdminProps> = ({
  dossierId,
  onValidate,
  onRefuse,
  onAdmit,
  onClose,
}) => {
  const [dossier, setDossier] = useState<DossierCandidatureDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | false>('candidat');

  useEffect(() => {
    const fetchDossier = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await dossierCandidatureService.getDossierDetails(dossierId);
        setDossier(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Erreur lors du chargement du dossier');
      } finally {
        setLoading(false);
      }
    };
    fetchDossier();
  }, [dossierId]);

  const handleAccordionChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !dossier) {
    return (
      <Alert severity="error">{error || 'Dossier non trouvé'}</Alert>
    );
  }

  return (
    <Box>
      {/* En-tête */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6">
              Dossier N° {dossier.numero_dossier}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {dossier.candidat_prenom} {dossier.candidat_nom}
            </Typography>
          </Box>
          <Chip
            label={getStatutLabel(dossier.statut_dossier)}
            color={getStatutColor(dossier.statut_dossier)}
          />
        </Stack>
      </Box>

      {/* Informations candidat */}
      <Accordion expanded={expanded === 'candidat'} onChange={handleAccordionChange('candidat')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <PersonIcon sx={{ mr: 1 }} />
          <Typography>Informations du candidat</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" color="text.secondary">Nom</Typography>
              <Typography>{dossier.candidat_nom}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" color="text.secondary">Prénom</Typography>
              <Typography>{dossier.candidat_prenom}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" color="text.secondary">Email</Typography>
              <Typography>{dossier.candidat_email}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" color="text.secondary">Téléphone</Typography>
              <Typography>{dossier.candidat_telephone || '-'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" color="text.secondary">Date de naissance</Typography>
              <Typography>{formatDate(dossier.candidat_date_naissance)}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" color="text.secondary">Lieu de naissance</Typography>
              <Typography>{dossier.candidat_lieu_naissance || '-'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" color="text.secondary">Sexe</Typography>
              <Typography>{dossier.candidat_sexe === 'M' ? 'Masculin' : dossier.candidat_sexe === 'F' ? 'Féminin' : '-'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" color="text.secondary">Nationalité</Typography>
              <Typography>{dossier.candidat_nationalite || '-'}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">Adresse</Typography>
              <Typography>{dossier.candidat_adresse || '-'}</Typography>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Filières souhaitées */}
      <Accordion expanded={expanded === 'filieres'} onChange={handleAccordionChange('filieres')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <SchoolIcon sx={{ mr: 1 }} />
          <Typography>Filières souhaitées</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" color="text.secondary">1er choix</Typography>
              <Typography>{dossier.filiere_1?.libelle || '-'}</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" color="text.secondary">2ème choix</Typography>
              <Typography>{dossier.filiere_2?.libelle || '-'}</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" color="text.secondary">3ème choix</Typography>
              <Typography>{dossier.filiere_3?.libelle || '-'}</Typography>
            </Grid>
          </Grid>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary">Diplôme précédent</Typography>
              <Typography>{dossier.diplome_precedent || '-'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary">Établissement</Typography>
              <Typography>{dossier.etablissement_precedent || '-'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary">Année d'obtention</Typography>
              <Typography>{dossier.annee_obtention_diplome || '-'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary">Moyenne générale</Typography>
              <Typography>{dossier.moyenne_generale ? `${dossier.moyenne_generale}/20` : '-'}</Typography>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Pièces jointes */}
      <Accordion expanded={expanded === 'pieces'} onChange={handleAccordionChange('pieces')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <DocIcon sx={{ mr: 1 }} />
          <Typography>Pièces jointes ({dossier.pieces_jointes?.length || 0})</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {dossier.pieces_jointes && dossier.pieces_jointes.length > 0 ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Libellé</TableCell>
                  <TableCell>Format</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dossier.pieces_jointes.map((piece: PieceJointe) => (
                  <TableRow key={piece.id}>
                    <TableCell>{piece.type_piece}</TableCell>
                    <TableCell>{piece.libelle}</TableCell>
                    <TableCell>{piece.format_fichier || '-'}</TableCell>
                    <TableCell>
                      {piece.is_valide === true && <Chip label="Validé" color="success" size="small" />}
                      {piece.is_valide === false && <Chip label="Refusé" color="error" size="small" />}
                      {piece.is_valide === null && <Chip label="En attente" size="small" />}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        href={piece.fichier_url}
                        target="_blank"
                      >
                        Voir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Typography color="text.secondary">Aucune pièce jointe</Typography>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Paiements */}
      <Accordion expanded={expanded === 'paiements'} onChange={handleAccordionChange('paiements')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <PaymentIcon sx={{ mr: 1 }} />
          <Typography>Paiements ({dossier.paiements?.length || 0})</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {dossier.paiements && dossier.paiements.length > 0 ? (
            <>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>N° Transaction</TableCell>
                    <TableCell>Montant</TableCell>
                    <TableCell>Mode</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Statut</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dossier.paiements.map((paiement: Paiement) => (
                    <TableRow key={paiement.id}>
                      <TableCell>{paiement.numero_transaction}</TableCell>
                      <TableCell>{formatMoney(paiement.montant)}</TableCell>
                      <TableCell>{paiement.mode_paiement}</TableCell>
                      <TableCell>{formatDate(paiement.date_paiement)}</TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          {getPaiementStatutIcon(paiement.statut_paiement)}
                          <Typography variant="body2">
                            {paiement.statut_paiement === 'valide' ? 'Validé' :
                             paiement.statut_paiement === 'refuse' ? 'Refusé' : 'En attente'}
                          </Typography>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {dossier.montant_total_paye !== undefined && (
                <Box sx={{ mt: 2, textAlign: 'right' }}>
                  <Typography variant="subtitle1">
                    Total payé: <strong>{formatMoney(dossier.montant_total_paye)}</strong>
                  </Typography>
                </Box>
              )}
            </>
          ) : (
            <Typography color="text.secondary">Aucun paiement enregistré</Typography>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Boutons d'action */}
      <Paper sx={{ mt: 3, p: 2 }}>
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          {onClose && (
            <Button variant="outlined" onClick={onClose}>
              Fermer
            </Button>
          )}
          {onValidate && dossier.statut_dossier === 'complet' && (
            <Button variant="contained" color="success" onClick={onValidate}>
              Valider le dossier
            </Button>
          )}
          {onRefuse && ['complet', 'valide'].includes(dossier.statut_dossier) && (
            <Button variant="contained" color="error" onClick={onRefuse}>
              Refuser
            </Button>
          )}
          {onAdmit && dossier.statut_dossier === 'valide' && (
            <Button variant="contained" color="primary" onClick={onAdmit}>
              Admettre
            </Button>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

export default DossierDetailsAdmin;
