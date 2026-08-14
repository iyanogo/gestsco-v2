/**
 * Liste des documents d'un étudiant
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
} from '@mui/material';
import {
  Download as DownloadIcon,
  CheckCircle as ValidateIcon,
  Cancel as RefuseIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import type { DocumentEtudiant } from '../../types/etudiant';
import { STATUT_COLORS } from '../../types/etudiant';
import {
  getDocumentsByEtudiant,
  validerDocument,
  refuserDocument,
  deleteDocument,
} from '../../services/documentEtudiantService';

interface DocumentsListProps {
  etudiantId: number;
  onAddDocument?: () => void;
  onRefresh?: () => void;
}

const DocumentsList: React.FC<DocumentsListProps> = ({
  etudiantId,
  onAddDocument,
  onRefresh,
}) => {
  const [documents, setDocuments] = useState<DocumentEtudiant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDocumentsByEtudiant(etudiantId);
      setDocuments(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors du chargement des documents');
    } finally {
      setLoading(false);
    }
  }, [etudiantId]);

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
      await fetchDocuments();
      onRefresh?.();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de la validation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefuser = async (id: number) => {
    const commentaire = prompt('Raison du refus:');
    if (!commentaire) return;

    setActionLoading(id);
    try {
      await refuserDocument(id, commentaire);
      await fetchDocuments();
      onRefresh?.();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors du refus');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;

    setActionLoading(id);
    try {
      await deleteDocument(id);
      await fetchDocuments();
      onRefresh?.();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de la suppression');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownload = (fichierUrl?: string) => {
    if (fichierUrl) {
      window.open(fichierUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">Documents ({documents.length})</Typography>
        {onAddDocument && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAddDocument}
            size="small"
          >
            Ajouter
          </Button>
        )}
      </Stack>

      {documents.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">Aucun document</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Libellé</TableCell>
                <TableCell>Date délivrance</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>{doc.type_document}</TableCell>
                  <TableCell>{doc.libelle || doc.numero_document || '-'}</TableCell>
                  <TableCell>{formatDate(doc.date_delivrance)}</TableCell>
                  <TableCell>
                    <Chip
                      label={doc.statut || 'en_attente'}
                      size="small"
                      color={STATUT_COLORS[doc.statut || 'en_attente'] || 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
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
                      {doc.statut === 'en_attente' && (
                        <>
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
                              color="warning"
                              onClick={() => handleRefuser(doc.id)}
                              disabled={actionLoading === doc.id}
                            >
                              <RefuseIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      <Tooltip title="Supprimer">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(doc.id)}
                          disabled={actionLoading === doc.id}
                        >
                          <DeleteIcon fontSize="small" />
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
    </Box>
  );
};

export default DocumentsList;
