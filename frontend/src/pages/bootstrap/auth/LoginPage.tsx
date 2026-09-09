import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, InputGroup } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getPostLoginPath } from '@/utils/authRedirect';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
      navigate(from || getPostLoginPath(user), { replace: true });
    }
  }, [isAuthenticated, user, navigate, location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Identifiants invalides. Vérifiez votre email et mot de passe.';
      setError(typeof message === 'string' ? message : 'Erreur de connexion');
    }
  };

  const fillDemoCredentials = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="min-vh-100 d-flex align-items-center bg-light">
      <Container>
        <Row className="justify-content-center">
          <Col md={10} lg={8} xl={6}>
            <Card className="border-0 shadow-lg overflow-hidden">
              <Row className="g-0">
                <Col md={5} className="d-none d-md-flex bg-primary text-white p-4 flex-column justify-content-center">
                  <div className="text-center">
                    <div className="mb-4">
                      <i className="bi bi-mortarboard-fill display-1"></i>
                    </div>
                    <h3 className="fw-bold mb-3">GestSco</h3>
                    <p className="mb-4 opacity-75">
                      Système de Gestion Scolaire pour établissements d'enseignement supérieur
                    </p>
                  </div>
                </Col>

                <Col md={7}>
                  <Card.Body className="p-4 p-lg-5">
                    <div className="text-center mb-4 d-md-none">
                      <i className="bi bi-mortarboard-fill text-primary display-4"></i>
                      <h4 className="fw-bold text-primary mt-2">GestSco</h4>
                    </div>

                    <h4 className="fw-bold mb-1">Connexion</h4>
                    <p className="text-muted mb-4">Accédez à votre espace personnel</p>

                    {error && (
                      <Alert variant="danger" className="d-flex align-items-center">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        {error}
                      </Alert>
                    )}

                    <Form onSubmit={handleSubmit}>
                      <Form.Group className="mb-3">
                        <Form.Label>Adresse email</Form.Label>
                        <InputGroup>
                          <InputGroup.Text className="bg-light border-end-0">
                            <i className="bi bi-envelope text-muted"></i>
                          </InputGroup.Text>
                          <Form.Control
                            type="email"
                            placeholder="votre@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="border-start-0"
                          />
                        </InputGroup>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <div className="d-flex justify-content-between">
                          <Form.Label>Mot de passe</Form.Label>
                          <Link to="/forgot-password" className="small text-primary text-decoration-none">
                            Mot de passe oublié ?
                          </Link>
                        </div>
                        <InputGroup>
                          <InputGroup.Text className="bg-light border-end-0">
                            <i className="bi bi-lock text-muted"></i>
                          </InputGroup.Text>
                          <Form.Control
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="border-start-0 border-end-0"
                          />
                          <InputGroup.Text
                            className="bg-light border-start-0 cursor-pointer"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{ cursor: 'pointer' }}
                          >
                            <i className={`bi bi-eye${showPassword ? '-slash' : ''} text-muted`}></i>
                          </InputGroup.Text>
                        </InputGroup>
                      </Form.Group>

                      <Form.Group className="mb-4">
                        <Form.Check
                          type="checkbox"
                          label="Se souvenir de moi"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                        />
                      </Form.Group>

                      <Button
                        variant="primary"
                        type="submit"
                        className="w-100 py-2"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            Connexion en cours...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-box-arrow-in-right me-2"></i>
                            Se connecter
                          </>
                        )}
                      </Button>
                    </Form>

                    <hr className="my-4" />

                    <div className="text-center">
                      <p className="text-muted mb-3">Comptes de démonstration</p>
                      <div className="d-flex flex-wrap justify-content-center gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => fillDemoCredentials('admin@gestsco.com', 'Admin@123')}
                        >
                          <i className="bi bi-shield-check me-1"></i>
                          Admin
                        </Button>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => fillDemoCredentials('scolarite@gestsco.com', 'Scolarite@123')}
                        >
                          <i className="bi bi-mortarboard me-1"></i>
                          Scolarité
                        </Button>
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => fillDemoCredentials('comptable@gestsco.com', 'Comptable@123')}
                        >
                          <i className="bi bi-cash-stack me-1"></i>
                          Comptable
                        </Button>
                      </div>
                    </div>
                  </Card.Body>
                </Col>
              </Row>
            </Card>

            <p className="text-center text-muted mt-4 small">
              © 2026 GestSco - Système de Gestion Scolaire
            </p>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default LoginPage;
