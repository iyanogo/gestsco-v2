import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Container,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Box,
  Grid,
  Divider,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '@/hooks/useAuth';

interface ProfileFormData {
  full_name: string;
}

export const ProfilePage = () => {
  const { user, updateProfile, isLoading, error, clearError } = useAuth();
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    defaultValues: {
      full_name: user?.full_name || '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setSuccess(false);
    clearError();
    try {
      await updateProfile({ full_name: data.full_name });
      setSuccess(true);
    } catch (err) {
      // Error is handled by the store
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Mon profil
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Modifier le profil
              </Typography>

              {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Profil mis à jour avec succès !
                </Alert>
              )}

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit(onSubmit)}>
                <TextField
                  fullWidth
                  label="Email"
                  value={user?.email || ''}
                  margin="normal"
                  disabled
                  InputProps={{
                    readOnly: true,
                  }}
                />

                <TextField
                  fullWidth
                  label="Nom complet"
                  margin="normal"
                  {...register('full_name')}
                  error={!!errors.full_name}
                  helperText={errors.full_name?.message}
                />

                <Button
                  type="submit"
                  variant="contained"
                  sx={{ mt: 3 }}
                  disabled={isLoading}
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Enregistrer'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Informations du compte
              </Typography>

              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Rôle
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {user?.role || '-'}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Typography variant="body2" color="text.secondary">
                  Statut
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {user?.is_active ? 'Actif' : 'Inactif'}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Typography variant="body2" color="text.secondary">
                  Administrateur
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {user?.is_superuser ? 'Oui' : 'Non'}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Typography variant="body2" color="text.secondary">
                  Date de création
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {formatDate(user?.created_at)}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Typography variant="body2" color="text.secondary">
                  Dernière mise à jour
                </Typography>
                <Typography variant="body1">
                  {formatDate(user?.updated_at)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProfilePage;
