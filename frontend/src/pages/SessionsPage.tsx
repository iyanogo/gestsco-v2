import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Card,
  CardContent,
  Grid,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

import SessionsList from '../components/evaluation/SessionsList';
import SessionForm from '../components/evaluation/SessionForm';
import { SessionExamen, CreateSessionExamen, UpdateSessionExamen } from '../types/evaluation';
import sessionExamenService from '../services/sessionExamenService';

const SessionsPage: React.FC = () => {
  const [openForm, setOpenForm] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionExamen | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCreate = () => {
    setSelectedSession(null);
    setOpenForm(true);
  };

  const handleEdit = (session: SessionExamen) => {
    setSelectedSession(session);
    setOpenForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette session ?')) {
      try {
        await sessionExamenService.deleteSession(id);
        setRefreshTrigger((prev) => prev + 1);
      } catch (error) {
        console.error('Erreur suppression:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const handleView = (id: number) => {
    // TODO: Naviguer vers la page de détails ou ouvrir un dialog
    console.log('View session:', id);
  };

  const handleExamens = (session: SessionExamen) => {
    // TODO: Naviguer vers la page des examens filtrée par session
    window.location.href = `/examens?session_id=${session.id}`;
  };

  const handleSubmit = async (data: CreateSessionExamen | UpdateSessionExamen) => {
    try {
      if (selectedSession) {
        await sessionExamenService.updateSession(selectedSession.id, data as UpdateSessionExamen);
      } else {
        await sessionExamenService.createSession(data as CreateSessionExamen);
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
        <Typography variant="h4">Sessions d'Examen</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          Nouvelle Session
        </Button>
      </Box>

      {/* Statistiques rapides */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">
                Total Sessions
              </Typography>
              <Typography variant="h5" color="primary">
                -
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">
                En Cours
              </Typography>
              <Typography variant="h5" color="info.main">
                -
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">
                Clôturées
              </Typography>
              <Typography variant="h5" color="warning.main">
                -
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">
                Validées
              </Typography>
              <Typography variant="h5" color="success.main">
                -
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Liste des sessions */}
      <SessionsList
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        onExamens={handleExamens}
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
              {selectedSession ? 'Modifier la session' : 'Nouvelle session'}
            </Typography>
            <IconButton onClick={() => setOpenForm(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <SessionForm
              initialData={selectedSession}
              onSubmit={handleSubmit}
              onCancel={() => setOpenForm(false)}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default SessionsPage;
