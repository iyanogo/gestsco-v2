import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Box,
  Link,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '@/hooks/useAuth';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Clear any existing errors when the login page loads
  useEffect(() => {
    clearError();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log('[LoginPage] Form submitted with email:', email);
    
    if (!email || !password) {
      setSubmitError('Veuillez remplir tous les champs');
      return;
    }

    setSubmitError(null);
    clearError();
    setSubmitting(true);

    try {
      console.log('[LoginPage] Calling login...');
      await login(email, password);
      console.log('[LoginPage] Login successful, redirecting to /admin/dashboard');
      navigate('/admin/dashboard');
    } catch (err: any) {
      console.error('[LoginPage] Login error:', err);
      setSubmitError(err.response?.data?.detail || 'Erreur de connexion');
    } finally {
      setSubmitting(false);
    }
  };

  const isButtonDisabled = isLoading || submitting;

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Card sx={{ width: '100%', p: 2 }}>
          <CardContent>
            <Typography variant="h4" component="h1" gutterBottom textAlign="center">
              Connexion
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" mb={3}>
              Connectez-vous à votre compte GestSco
            </Typography>

            {(error || submitError) && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error || submitError}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                margin="normal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <TextField
                fullWidth
                label="Mot de passe"
                type="password"
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{ mt: 3, mb: 2 }}
                disabled={isButtonDisabled}
              >
                {isButtonDisabled ? <CircularProgress size={24} /> : 'Se connecter'}
              </Button>

              <Box textAlign="center">
                <Typography variant="body2">
                  Pas encore de compte ?{' '}
                  <Link component={RouterLink} to="/register">
                    S'inscrire
                  </Link>
                </Typography>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default LoginPage;
