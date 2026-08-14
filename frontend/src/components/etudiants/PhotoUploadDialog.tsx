/**
 * Dialog pour uploader une photo d'étudiant
 */

import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Avatar,
  Alert,
  CircularProgress,
} from '@mui/material';
import { PhotoCamera as PhotoIcon, Person as PersonIcon } from '@mui/icons-material';

interface PhotoUploadDialogProps {
  open: boolean;
  etudiantId: number;
  currentPhotoUrl?: string;
  onClose: () => void;
  onSuccess: (photoUrl: string) => void;
  loading?: boolean;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

const PhotoUploadDialog: React.FC<PhotoUploadDialogProps> = ({
  open,
  currentPhotoUrl,
  onClose,
  onSuccess,
  loading = false,
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError(null);

    if (!file) return;

    // Validation du type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Format non supporté. Utilisez JPG ou PNG.');
      return;
    }

    // Validation de la taille
    if (file.size > MAX_FILE_SIZE) {
      setError('Le fichier est trop volumineux. Taille max: 2MB');
      return;
    }

    // Créer la prévisualisation
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoUrl(event.target.value);
    setPreview(null);
    setError(null);
  };

  const handleSubmit = () => {
    if (photoUrl) {
      onSuccess(photoUrl);
    } else if (preview) {
      // Dans un cas réel, on uploaderait le fichier vers un serveur
      // Pour l'instant, on utilise le data URL comme placeholder
      onSuccess(preview);
    }
  };

  const handleClose = () => {
    setPreview(null);
    setPhotoUrl('');
    setError(null);
    onClose();
  };

  const displayImage = preview || photoUrl || currentPhotoUrl;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Modifier la photo</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            py: 2,
          }}
        >
          <Avatar
            src={displayImage}
            sx={{ width: 150, height: 150 }}
          >
            <PersonIcon sx={{ fontSize: 80 }} />
          </Avatar>

          <input
            type="file"
            accept="image/jpeg,image/png"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <Button
            variant="outlined"
            startIcon={<PhotoIcon />}
            onClick={() => fileInputRef.current?.click()}
          >
            Choisir une image
          </Button>

          <Typography variant="body2" color="text.secondary">
            ou
          </Typography>

          <Box sx={{ width: '100%' }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Entrez l'URL de l'image:
            </Typography>
            <input
              type="url"
              value={photoUrl}
              onChange={handleUrlChange}
              placeholder="https://..."
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #ccc',
              }}
            />
          </Box>

          <Typography variant="caption" color="text.secondary">
            Formats acceptés: JPG, PNG. Taille max: 2MB
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Annuler
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || (!preview && !photoUrl)}
        >
          {loading ? <CircularProgress size={24} /> : 'Enregistrer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PhotoUploadDialog;
