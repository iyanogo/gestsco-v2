import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  IconButton,
  Tooltip,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { ParametreSysteme, CATEGORIES_PARAMETRES } from '../../types/parametrage';

interface ParametresListProps {
  parametresParCategorie: Record<string, ParametreSysteme[]>;
  loading: boolean;
  onUpdateValeur?: (cle: string, valeur: any) => Promise<void>;
  onRefresh: () => void;
}

const ParametresList: React.FC<ParametresListProps> = ({
  parametresParCategorie,
  loading,
  onUpdateValeur,
  onRefresh,
}) => {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const handleEdit = (parametre: ParametreSysteme) => {
    setEditingKey(parametre.cle);
    setEditValue(parametre.valeur);
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditValue('');
  };

  const handleSave = async (cle: string) => {
    if (!onUpdateValeur) return;
    setSaving(true);
    try {
      await onUpdateValeur(cle, editValue);
      setEditingKey(null);
      setEditValue('');
    } finally {
      setSaving(false);
    }
  };

  const getCategorieLabel = (categorie: string) => {
    const cat = CATEGORIES_PARAMETRES.find(c => c.value === categorie);
    return cat ? cat.label : categorie;
  };

  const renderValeurInput = (parametre: ParametreSysteme) => {
    if (editingKey !== parametre.cle) {
      return (
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {parametre.type_valeur === 'boolean' 
            ? (parametre.valeur === 'true' ? 'Oui' : 'Non')
            : parametre.valeur}
          {parametre.unite && ` ${parametre.unite}`}
        </Typography>
      );
    }

    if (parametre.type_valeur === 'boolean') {
      return (
        <FormControlLabel
          control={
            <Switch
              checked={editValue === 'true'}
              onChange={(e) => setEditValue(e.target.checked ? 'true' : 'false')}
              size="small"
            />
          }
          label={editValue === 'true' ? 'Oui' : 'Non'}
        />
      );
    }

    return (
      <TextField
        size="small"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        type={parametre.type_valeur === 'integer' || parametre.type_valeur === 'float' ? 'number' : 'text'}
        InputProps={{
          endAdornment: parametre.unite ? <Typography variant="caption">{parametre.unite}</Typography> : null,
        }}
        sx={{ minWidth: 150 }}
      />
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (Object.keys(parametresParCategorie).length === 0) {
    return (
      <Alert severity="info" action={
        <Button color="inherit" size="small" onClick={onRefresh}>
          Actualiser
        </Button>
      }>
        Aucun paramètre configuré. Initialisez les paramètres par défaut.
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button startIcon={<RefreshIcon />} onClick={onRefresh} size="small">
          Actualiser
        </Button>
      </Box>

      {Object.entries(parametresParCategorie).map(([categorie, parametres]) => (
        <Accordion key={categorie} defaultExpanded={categorie === 'general'}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">{getCategorieLabel(categorie)}</Typography>
            <Chip label={parametres.length} size="small" sx={{ ml: 2 }} />
          </AccordionSummary>
          <AccordionDetails>
            <Box display="flex" flexDirection="column" gap={2}>
              {parametres.map((parametre) => (
                <Card key={parametre.cle} variant="outlined">
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box flex={1}>
                        <Typography variant="subtitle2" color="primary">
                          {parametre.libelle}
                        </Typography>
                        {parametre.description && (
                          <Typography variant="caption" color="text.secondary">
                            {parametre.description}
                          </Typography>
                        )}
                        <Box mt={0.5}>
                          {renderValeurInput(parametre)}
                        </Box>
                      </Box>
                      <Box>
                        {editingKey === parametre.cle ? (
                          <>
                            <Tooltip title="Enregistrer">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleSave(parametre.cle)}
                                disabled={saving}
                              >
                                {saving ? <CircularProgress size={20} /> : <SaveIcon />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Annuler">
                              <IconButton size="small" onClick={handleCancel}>
                                <CancelIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        ) : (
                          parametre.est_modifiable && onUpdateValeur && (
                            <Tooltip title="Modifier">
                              <IconButton size="small" onClick={() => handleEdit(parametre)}>
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                          )
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

export default ParametresList;
