/**
 * Page pour afficher les documents en attente de validation
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  Stack,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import {
  CheckCircle as ValidateIcon,
  Cancel as RefuseIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { DocumentEtudiant } from '../types/etudiant';
import { STATUT_COLORS } from '../types/etudiant';
import {
  getDocuments,
  validerDocument,
  refuserDocument,
} from '../services/documentEtudiantService';

const DocumentsAttentePage: React.FC = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocumentEtudiant[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [refuseDialogOpen, setRefuseDialogOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [refuseComment, setRefuseComment] = useState('');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDocuments({ statut: 'en_attente' });
      setDocuments(data);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Erreur lors du chargement',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR');
    } catch {
      return dateString;
    }
  };

  const handleValider = async (id: number) => {
    setActionLoading(id);
    try {
      await validerDocument(id);
      setSnackbar({
        open: true,
        message: 'Document validé avec succès',
        severity: 'success',
      });
      await fetchDocuments();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Erreur lors de la validation',
        severity: 'error',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenRefuseDialog = (id: number) => {
    setSelectedDocId(id);
    setRefuseComment('');
    setRefuseDialogOpen(true);
  };

  const handleRefuser = async () => {
    if (!selectedDocId || !refuseComment.trim()) return;

    setActionLoading(selectedDocId);
    try {
      await refuserDocument(selectedDocId, refuseComment);
      setSnackbar({
        open: true,
        message: 'Document refusé',
        severity: 'success',
      });
      setRefuseDialogOpen(false);
      await fetchDocuments();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Erreur lors du refus',
        severity: 'error',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewEtudiant = (etudiantId: number) => {
    navigate(`/etudiants/${etudiantId}`);
  };

  const handleDownload = (fichierUrl?: string) => {
    if (fichierUrl) {
      window.open(fichierUrl, '_blank');
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      doc.type_document?.toLowerCase().includes(searchLower) ||
      doc.libelle?.toLowerCase().includes(searchLower) ||
      doc.numero_document?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Documents en attente de validation
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {documents.length} document(s) en attente de validation
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <TextField
          size="small"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 300 }}
        />
      </Stack>

      {filteredDocuments.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            {documents.length === 0
              ? 'Aucun document en attente de validation'
              : 'Aucun document ne correspond à votre recherche'}
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Libellé</TableCell>
                <TableCell>N° Document</TableCell>
                <TableCell>Date délivrance</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Date soumission</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDocuments.map((doc) => (
                <TableRow key={doc.id} hover>
                  <TableCell>
                    <strong>{doc.type_document}</strong>
                  </TableCell>
                  <TableCell>{doc.libelle || '-'}</TableCell>
                  <TableCell>{doc.numero_document || '-'}</TableCell>
                  <TableCell>{formatDate(doc.date_delivrance)}</TableCell>
                  <TableCell>
                    <Chip
                      label={doc.statut || 'en_attente'}
                      size="small"
                      color={STATUT_COLORS[doc.statut || 'en_attente'] || 'default'}
                    />
                  </TableCell>
                  <TableCell>{formatDate(doc.created_at)}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Tooltip title="Voir l'étudiant">
                        <IconButton
                          size="small"
                          onClick={() => handleViewEtudiant(doc.etudiant_id)}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {doc.fichier_url && (
                        <Tooltip title="Télécharger">
                          <IconButton
                            size="small"
                            onClick={() => handleDownload(doc.fichier_url)}
                          >
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Valider">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleValider(doc.id)}
                          disabled={actionLoading === doc.id}
                        >
                          <ValidateIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Refuser">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleOpenRefuseDialog(doc.id)}
                          disabled={actionLoading === doc.id}
                        >
                          <RefuseIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog de refus */}
      <Dialog open={refuseDialogOpen} onClose={() => setRefuseDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Refuser le document</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Veuillez indiquer la raison du refus :
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={refuseComment}
            onChange={(e) => setRefuseComment(e.target.value)}
            placeholder="Raison du refus..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRefuseDialogOpen(false)}>Annuler</Button>
          <Button
            onClick={handleRefuser}
            color="error"
            variant="contained"
            disabled={!refuseComment.trim() || actionLoading !== null}
          >
            Refuser
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DocumentsAttentePage;
