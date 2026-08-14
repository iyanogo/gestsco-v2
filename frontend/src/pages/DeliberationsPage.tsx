import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

import DeliberationsList from '../components/evaluation/DeliberationsList';
import DeliberationForm from '../components/evaluation/DeliberationForm';
import DeliberationDetails from '../components/evaluation/DeliberationDetails';
import { Deliberation, CreateDeliberation, UpdateDeliberation } from '../types/evaluation';
import deliberationService from '../services/deliberationService';

const DeliberationsPage: React.FC = () => {
  const [openForm, setOpenForm] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [selectedDeliberation, setSelectedDeliberation] = useState<Deliberation | null>(null);
  const [detailsId, setDetailsId] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCreate = () => {
    setSelectedDeliberation(null);
    setOpenForm(true);
  };

  const handleEdit = (deliberation: Deliberation) => {
    setSelectedDeliberation(deliberation);
    setOpenForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette délibération ?')) {
      try {
        await deliberationService.deleteDeliberation(id);
        setRefreshTrigger((prev) => prev + 1);
      } catch (error) {
        console.error('Erreur suppression:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const handleView = (id: number) => {
    setDetailsId(id);
    setOpenDetails(true);
  };

  const handleSubmit = async (data: CreateDeliberation | UpdateDeliberation) => {
    try {
      if (selectedDeliberation) {
        await deliberationService.updateDeliberation(selectedDeliberation.id, data as UpdateDeliberation);
      } else {
        await deliberationService.creerDeliberationAuto(data as CreateDeliberation);
      }
      setOpenForm(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      throw error;
    }
  };

  return (
    <Box>
      {/* En-tête */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Délibérations</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          Nouvelle Délibération
        </Button>
      </Box>

      {/* Liste */}
      <DeliberationsList
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        refreshTrigger={refreshTrigger}
      />

      {/* Dialog formulaire */}
      <Dialog
        open={openForm}
        onClose={() => setOpenForm(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {selectedDeliberation ? 'Modifier la délibération' : 'Nouvelle délibération'}
            </Typography>
            <IconButton onClick={() => setOpenForm(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <DeliberationForm
              initialData={selectedDeliberation}
              onSubmit={handleSubmit}
              onCancel={() => setOpenForm(false)}
            />
          </Box>
        </DialogContent>
      </Dialog>

      {/* Dialog détails */}
      <Dialog
        open={openDetails}
        onClose={() => setOpenDetails(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Détails de la délibération</Typography>
            <IconButton onClick={() => setOpenDetails(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {detailsId && (
            <DeliberationDetails
              deliberationId={detailsId}
              onPublier={() => setRefreshTrigger((prev) => prev + 1)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default DeliberationsPage;
