/**
 * Dialog pour changer le statut d'un étudiant
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Typography,
} from '@mui/material';
import type { Etudiant } from '../../types/etudiant';
import { STATUTS_ETUDIANT } from '../../types/etudiant';

interface StatutDialogProps {
  open: boolean;
  etudiant: Etudiant | null;
  onClose: () => void;
  onConfirm: (statut: string) => void;
  loading?: boolean;
}

const StatutDialog: React.FC<StatutDialogProps> = ({
  open,
  etudiant,
  onClose,
  onConfirm,
  loading = false,
}) => {
  const [selectedStatut, setSelectedStatut] = useState<string>(etudiant?.statut || 'actif');

  React.useEffect(() => {
    if (etudiant) {
      setSelectedStatut(etudiant.statut || 'actif');
    }
  }, [etudiant]);

  const handleConfirm = () => {
    onConfirm(selectedStatut);
  };

  if (!etudiant) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Changer le statut de l'étudiant</DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Étudiant: <strong>{etudiant.nom?.toUpperCase()} {etudiant.prenom}</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Matricule: {etudiant.matricule || 'Non défini'}
        </Typography>

        <Alert severity="warning" sx={{ mb: 3 }}>
          Attention: Le changement de statut peut affecter l'accès de l'étudiant aux services.
        </Alert>

        <FormControl fullWidth>
          <InputLabel>Nouveau statut</InputLabel>
          <Select
            value={selectedStatut}
            label="Nouveau statut"
            onChange={(e) => setSelectedStatut(e.target.value)}
          >
            {STATUTS_ETUDIANT.map((statut) => (
              <MenuItem key={statut} value={statut}>
                {statut.charAt(0).toUpperCase() + statut.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Annuler
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={loading || selectedStatut === etudiant.statut}
        >
          {loading ? 'Enregistrement...' : 'Confirmer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StatutDialog;
