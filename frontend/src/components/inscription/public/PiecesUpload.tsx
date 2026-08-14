/**
 * Composant pour uploader les pièces justificatives
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Stack,
  IconButton,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';

import { TypePieceRequise, PieceJointe } from '../../../types/inscription';
import { inscriptionPubliqueService } from '../../../services';

interface PiecesUploadProps {
  dossierId: number;
  piecesRequises: TypePieceRequise[];
  piecesFournies?: PieceJointe[];
  onUploadComplete: () => void;
  onAllPiecesUploaded: (allUploaded: boolean) => void;
}

interface UploadState {
  [typePiece: string]: {
    uploading: boolean;
    uploaded: boolean;
    error: string | null;
    piece?: PieceJointe;
  };
}

const PiecesUpload: React.FC<PiecesUploadProps> = ({
  dossierId,
  piecesRequises,
  piecesFournies = [],
  onUploadComplete,
  onAllPiecesUploaded,
}) => {
  const [uploadState, setUploadState] = useState<UploadState>({});

  useEffect(() => {
    // Initialiser l'état avec les pièces déjà fournies
    const initialState: UploadState = {};
    piecesRequises.forEach((piece) => {
      const fournie = piecesFournies.find((p) => p.type_piece === piece.type_piece);
      initialState[piece.type_piece] = {
        uploading: false,
        uploaded: !!fournie,
        error: null,
        piece: fournie,
      };
    });
    setUploadState(initialState);
  }, [piecesRequises, piecesFournies]);

  useEffect(() => {
    // Vérifier si toutes les pièces requises sont uploadées
    const requiredPieces = piecesRequises.filter((p) => p.is_required);
    const allUploaded = requiredPieces.every(
      (p) => uploadState[p.type_piece]?.uploaded
    );
    onAllPiecesUploaded(allUploaded);
  }, [uploadState, piecesRequises, onAllPiecesUploaded]);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
    piece: TypePieceRequise
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validation de la taille
    if (piece.taille_max && file.size > piece.taille_max * 1024 * 1024) {
      setUploadState((prev) => ({
        ...prev,
        [piece.type_piece]: {
          ...prev[piece.type_piece],
          error: `Le fichier dépasse la taille maximale de ${piece.taille_max} Mo`,
        },
      }));
      return;
    }

    // Validation du format
    if (piece.formats_acceptes) {
      const formats = piece.formats_acceptes.split(',').map((f) => f.trim().toLowerCase());
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      if (fileExt && !formats.includes(fileExt) && !formats.includes(`.${fileExt}`)) {
        setUploadState((prev) => ({
          ...prev,
          [piece.type_piece]: {
            ...prev[piece.type_piece],
            error: `Format non accepté. Formats autorisés: ${piece.formats_acceptes}`,
          },
        }));
        return;
      }
    }

    // Upload
    setUploadState((prev) => ({
      ...prev,
      [piece.type_piece]: {
        ...prev[piece.type_piece],
        uploading: true,
        error: null,
      },
    }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type_piece', piece.type_piece);
      formData.append('libelle', piece.libelle);

      const result = await inscriptionPubliqueService.uploadPiece(dossierId, formData);

      setUploadState((prev) => ({
        ...prev,
        [piece.type_piece]: {
          uploading: false,
          uploaded: true,
          error: null,
          piece: result,
        },
      }));

      onUploadComplete();
    } catch (error: any) {
      setUploadState((prev) => ({
        ...prev,
        [piece.type_piece]: {
          ...prev[piece.type_piece],
          uploading: false,
          error: error.response?.data?.detail || 'Erreur lors de l\'upload',
        },
      }));
    }

    // Reset input
    event.target.value = '';
  };

  const formatFileSize = (bytes: number | null | undefined): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Pièces justificatives
      </Typography>
      <Alert severity="info" sx={{ mb: 3 }}>
        Uploadez les documents requis. Les pièces marquées d'un astérisque (*) sont obligatoires.
      </Alert>

      <Stack spacing={2}>
        {piecesRequises.map((piece) => {
          const state = uploadState[piece.type_piece] || {
            uploading: false,
            uploaded: false,
            error: null,
          };

          return (
            <Card key={piece.type_piece} variant="outlined">
              <CardContent>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  flexWrap="wrap"
                  gap={2}
                >
                  {/* Informations sur la pièce */}
                  <Box flex={1} minWidth={200}>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {piece.libelle}
                      {piece.is_required && (
                        <Typography component="span" color="error">
                          {' '}*
                        </Typography>
                      )}
                    </Typography>
                    {piece.description && (
                      <Typography variant="body2" color="text.secondary">
                        {piece.description}
                      </Typography>
                    )}
                    {piece.formats_acceptes && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        Formats: {piece.formats_acceptes}
                      </Typography>
                    )}
                    {piece.taille_max && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        Taille max: {piece.taille_max} Mo
                      </Typography>
                    )}
                  </Box>

                  {/* Statut et actions */}
                  <Box display="flex" alignItems="center" gap={1}>
                    {state.uploaded ? (
                      <>
                        <Chip
                          icon={<CheckIcon />}
                          label="Fourni"
                          color="success"
                          size="small"
                        />
                        {state.piece?.fichier_url && (
                          <IconButton
                            size="small"
                            href={state.piece.fichier_url}
                            target="_blank"
                          >
                            <ViewIcon />
                          </IconButton>
                        )}
                        <Button
                          component="label"
                          size="small"
                          variant="outlined"
                        >
                          Remplacer
                          <input
                            type="file"
                            hidden
                            onChange={(e) => handleFileSelect(e, piece)}
                            accept={piece.formats_acceptes || undefined}
                          />
                        </Button>
                      </>
                    ) : (
                      <Button
                        component="label"
                        variant="contained"
                        startIcon={<UploadIcon />}
                        disabled={state.uploading}
                      >
                        {state.uploading ? 'Upload...' : 'Choisir un fichier'}
                        <input
                          type="file"
                          hidden
                          onChange={(e) => handleFileSelect(e, piece)}
                          accept={piece.formats_acceptes || undefined}
                        />
                      </Button>
                    )}
                  </Box>
                </Box>

                {/* Progress bar */}
                {state.uploading && (
                  <LinearProgress sx={{ mt: 2 }} />
                )}

                {/* Error message */}
                {state.error && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {state.error}
                  </Alert>
                )}

                {/* Fichier uploadé */}
                {state.piece && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Fichier: {state.piece.format_fichier?.toUpperCase() || 'Document'}{' '}
                    {state.piece.taille_fichier && `(${formatFileSize(state.piece.taille_fichier)})`}
                  </Typography>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </Box>
  );
};

export default PiecesUpload;
