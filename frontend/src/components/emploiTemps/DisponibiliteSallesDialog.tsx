import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Chip,
  Typography,
  CircularProgress,
  Box,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import { format } from 'date-fns';
import {
  MeetingRoom as RoomIcon,
} from '@mui/icons-material';
import { SalleWithDisponibilite, CreneauHoraire, TYPES_SALLE } from '../../types/emploiTemps';
import { salleService } from '../../services/salleService';
import { creneauHoraireService } from '../../services/creneauHoraireService';

interface DisponibiliteSallesDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectSalle: (salle: SalleWithDisponibilite) => void;
  initialDate?: string;
  initialCreneauId?: number;
}

const DisponibiliteSallesDialog: React.FC<DisponibiliteSallesDialogProps> = ({
  open,
  onClose,
  onSelectSalle,
  initialDate,
  initialCreneauId,
}) => {
  const [salles, setSalles] = useState<SalleWithDisponibilite[]>([]);
  const [creneaux, setCreneaux] = useState<CreneauHoraire[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    date: initialDate ? new Date(initialDate) : new Date(),
    creneau_id: initialCreneauId || '',
    capacite_min: '',
    type_salle: '',
  });

  useEffect(() => {
    loadCreneaux();
  }, []);

  useEffect(() => {
    if (open && filters.creneau_id) {
      loadSalles();
    }
  }, [open, filters.date, filters.creneau_id]);

  const loadCreneaux = async () => {
    try {
      const data = await creneauHoraireService.getCreneaux();
      setCreneaux(data);
    } catch (error) {
      console.error('Erreur lors du chargement des créneaux:', error);
    }
  };

  const loadSalles = async () => {
    if (!filters.creneau_id) return;

    setLoading(true);
    try {
      const dateStr = format(filters.date, 'yyyy-MM-dd');
      const data = await salleService.getDisponibiliteSalles(dateStr, Number(filters.creneau_id));
      
      // Filtrer par capacité et type si spécifié
      let filteredSalles = data;
      if (filters.capacite_min) {
        filteredSalles = filteredSalles.filter((s) => s.capacite >= Number(filters.capacite_min));
      }
      if (filters.type_salle) {
        filteredSalles = filteredSalles.filter((s) => s.type_salle === filters.type_salle);
      }
      
      setSalles(filteredSalles);
    } catch (error) {
      console.error('Erreur lors du chargement des salles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (salle: SalleWithDisponibilite) => {
    if (salle.est_disponible) {
      onSelectSalle(salle);
      onClose();
    }
  };

  const getTypeSalleLabel = (type: string) => {
    const found = TYPES_SALLE.find((t) => t.value === type);
    return found?.label || type;
  };

  const sallesDisponibles = salles.filter((s) => s.est_disponible);
  const sallesOccupees = salles.filter((s) => !s.est_disponible);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Disponibilité des salles</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mb: 3, mt: 1 }}>
            <Grid item xs={12} sm={3}>
              <DatePicker
                label="Date"
                value={filters.date}
                onChange={(date) => setFilters({ ...filters, date: date || new Date() })}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Créneau"
                value={filters.creneau_id}
                onChange={(e) => setFilters({ ...filters, creneau_id: e.target.value })}
              >
                {creneaux.map((creneau) => (
                  <MenuItem key={creneau.id} value={creneau.id}>
                    {creneau.libelle}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Capacité min."
                value={filters.capacite_min}
                onChange={(e) => setFilters({ ...filters, capacite_min: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Type"
                value={filters.type_salle}
                onChange={(e) => setFilters({ ...filters, type_salle: e.target.value })}
              >
                <MenuItem value="">Tous</MenuItem>
                {TYPES_SALLE.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : !filters.creneau_id ? (
            <Typography color="text.secondary" textAlign="center">
              Sélectionnez un créneau pour voir les disponibilités
            </Typography>
          ) : (
            <>
              <Typography variant="subtitle2" gutterBottom color="success.main">
                Salles disponibles ({sallesDisponibles.length})
              </Typography>
              <List dense>
                {sallesDisponibles.map((salle) => (
                  <ListItem key={salle.id} disablePadding>
                    <ListItemButton onClick={() => handleSelect(salle)}>
                      <ListItemIcon>
                        <RoomIcon color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary={salle.libelle}
                        secondary={`${getTypeSalleLabel(salle.type_salle)} - Capacité: ${salle.capacite}`}
                      />
                      <Chip label="Disponible" color="success" size="small" />
                    </ListItemButton>
                  </ListItem>
                ))}
                {sallesDisponibles.length === 0 && (
                  <Typography color="text.secondary" sx={{ p: 2 }}>
                    Aucune salle disponible
                  </Typography>
                )}
              </List>

              {sallesOccupees.length > 0 && (
                <>
                  <Typography variant="subtitle2" gutterBottom color="error.main" sx={{ mt: 2 }}>
                    Salles occupées ({sallesOccupees.length})
                  </Typography>
                  <List dense>
                    {sallesOccupees.map((salle) => (
                      <ListItem key={salle.id}>
                        <ListItemIcon>
                          <RoomIcon color="disabled" />
                        </ListItemIcon>
                        <ListItemText
                          primary={salle.libelle}
                          secondary={`${getTypeSalleLabel(salle.type_salle)} - Capacité: ${salle.capacite}`}
                        />
                        <Chip label="Occupée" color="error" size="small" variant="outlined" />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default DisponibiliteSallesDialog;
