/**
 * Composant pour afficher tous les détails d'un étudiant
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Paper,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  PhotoCamera as PhotoIcon,
  SwapHoriz as StatusIcon,
  Email as EmailIcon,
  People as FamilyIcon,
  Description as DocumentIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import type { EtudiantWithDetails } from '../../types/etudiant';
import { STATUT_COLORS } from '../../types/etudiant';
import { getEtudiantDetails } from '../../services/etudiantService';

interface EtudiantDetailsProps {
  etudiantId: number;
  onEdit?: () => void;
  onChangePhoto?: () => void;
  onChangeStatut?: () => void;
}

interface InfoRowProps {
  label: string;
  value?: string | null;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value }) => (
  <Grid item xs={12} sm={6}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body1">{value || '-'}</Typography>
  </Grid>
);

const EtudiantDetails: React.FC<EtudiantDetailsProps> = ({
  etudiantId,
  onEdit,
  onChangePhoto,
  onChangeStatut,
}) => {
  const [etudiant, setEtudiant] = useState<EtudiantWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | false>('personal');

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getEtudiantDetails(etudiantId);
        setEtudiant(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Erreur lors du chargement des détails');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [etudiantId]);

  const handleAccordionChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR');
    } catch {
      return dateString;
    }
  };

  const calculateAge = (dateNaissance?: string): number | null => {
    if (!dateNaissance) return null;
    const today = new Date();
    const birthDate = new Date(dateNaissance);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!etudiant) {
    return <Alert severity="warning">Étudiant non trouvé</Alert>;
  }

  const age = calculateAge(etudiant.date_naissance);
  const statut = etudiant.statut || 'actif';

  return (
    <Box>
      {/* En-tête */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center">
          <Avatar
            src={etudiant.photo_url}
            sx={{ width: 120, height: 120 }}
          >
            <PersonIcon sx={{ fontSize: 60 }} />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" gutterBottom>
              {etudiant.nom?.toUpperCase()} {etudiant.prenom}
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
              <Typography variant="h6" color="text.secondary">
                {etudiant.matricule || 'Sans matricule'}
              </Typography>
              <Chip
                label={statut}
                color={STATUT_COLORS[statut] || 'default'}
              />
            </Stack>
            {etudiant.email && (
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                {etudiant.email}
              </Typography>
            )}
          </Box>
          <Stack direction="row" spacing={1}>
            {onEdit && (
              <Button variant="outlined" startIcon={<EditIcon />} onClick={onEdit}>
                Modifier
              </Button>
            )}
            {onChangePhoto && (
              <Button variant="outlined" startIcon={<PhotoIcon />} onClick={onChangePhoto}>
                Photo
              </Button>
            )}
            {onChangeStatut && (
              <Button variant="outlined" startIcon={<StatusIcon />} onClick={onChangeStatut}>
                Statut
              </Button>
            )}
          </Stack>
        </Stack>
      </Paper>

      {/* Accordions */}
      <Accordion expanded={expanded === 'personal'} onChange={handleAccordionChange('personal')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" spacing={1} alignItems="center">
            <PersonIcon color="primary" />
            <Typography variant="h6">Informations personnelles</Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <InfoRow label="Nom" value={etudiant.nom} />
            <InfoRow label="Prénom" value={etudiant.prenom} />
            <InfoRow label="Date de naissance" value={`${formatDate(etudiant.date_naissance)}${age ? ` (${age} ans)` : ''}`} />
            <InfoRow label="Lieu de naissance" value={etudiant.lieu_naissance} />
            <InfoRow label="Sexe" value={etudiant.sexe === 'M' || etudiant.sexe === 'MASCULIN' ? 'Masculin' : etudiant.sexe === 'F' || etudiant.sexe === 'FEMININ' ? 'Féminin' : etudiant.sexe} />
            <InfoRow label="Nationalité" value={etudiant.nationalite} />
            <InfoRow label="INE" value={etudiant.ine} />
            <InfoRow label="N° Carte" value={etudiant.numero_carte} />
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion expanded={expanded === 'contact'} onChange={handleAccordionChange('contact')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" spacing={1} alignItems="center">
            <EmailIcon color="primary" />
            <Typography variant="h6">Contacts</Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <InfoRow label="Email" value={etudiant.email} />
            <InfoRow label="Téléphone" value={etudiant.telephone} />
            <InfoRow label="Téléphone d'urgence" value={etudiant.telephone_urgence} />
            <InfoRow label="Adresse" value={etudiant.adresse} />
            <InfoRow label="Ville" value={etudiant.ville} />
            <InfoRow label="Pays" value={etudiant.pays} />
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion expanded={expanded === 'family'} onChange={handleAccordionChange('family')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" spacing={1} alignItems="center">
            <FamilyIcon color="primary" />
            <Typography variant="h6">Informations familiales</Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <InfoRow label="Nom du père" value={etudiant.nom_pere} />
            <InfoRow label="Profession du père" value={etudiant.profession_pere} />
            <InfoRow label="Nom de la mère" value={etudiant.nom_mere} />
            <InfoRow label="Profession de la mère" value={etudiant.profession_mere} />
            <InfoRow label="Personne à contacter" value={etudiant.personne_contact} />
            <InfoRow label="Téléphone du contact" value={etudiant.telephone_contact} />
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion expanded={expanded === 'documents'} onChange={handleAccordionChange('documents')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" spacing={1} alignItems="center">
            <DocumentIcon color="primary" />
            <Typography variant="h6">Documents ({etudiant.documents?.length || 0})</Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          {etudiant.documents && etudiant.documents.length > 0 ? (
            <Stack spacing={2}>
              {etudiant.documents.map((doc) => (
                <Paper key={doc.id} variant="outlined" sx={{ p: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="subtitle1">{doc.type_document}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {doc.libelle || doc.numero_document || '-'}
                      </Typography>
                    </Box>
                    <Chip
                      label={doc.statut || 'en_attente'}
                      size="small"
                      color={STATUT_COLORS[doc.statut || 'en_attente'] || 'default'}
                    />
                  </Stack>
                </Paper>
              ))}
            </Stack>
          ) : (
            <Typography color="text.secondary">Aucun document</Typography>
          )}
        </AccordionDetails>
      </Accordion>

      <Accordion expanded={expanded === 'inscriptions'} onChange={handleAccordionChange('inscriptions')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" spacing={1} alignItems="center">
            <SchoolIcon color="primary" />
            <Typography variant="h6">Inscriptions ({etudiant.inscriptions?.length || 0})</Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          {etudiant.inscriptions && etudiant.inscriptions.length > 0 ? (
            <Stack spacing={2}>
              {etudiant.inscriptions.map((insc) => (
                <Paper key={insc.id} variant="outlined" sx={{ p: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="subtitle1">{insc.annee_academique}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Filière: {insc.filiere_id} | Niveau: {insc.niveau_id}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Type: {insc.type_inscription || '-'} | Régime: {insc.regime_etudes || '-'}
                      </Typography>
                    </Box>
                    <Chip
                      label={insc.statut_inscription || 'en_cours'}
                      size="small"
                      color={STATUT_COLORS[insc.statut_inscription || 'en_cours'] || 'default'}
                    />
                  </Stack>
                </Paper>
              ))}
            </Stack>
          ) : (
            <Typography color="text.secondary">Aucune inscription</Typography>
          )}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default EtudiantDetails;
