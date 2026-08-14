import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, InputGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulation de connexion pour la démo
    // En production, utiliser: await login(email, password);
    setTimeout(() => {
      setLoading(false);
      
      // Déterminer le rôle et les informations utilisateur
      let role = 'student';
      let nom = 'Utilisateur Demo';
      let redirectPath = '/etudiant/dashboard';
      
      if (email.includes('superadmin')) {
        role = 'superadmin';
        nom = 'Super Administrateur';
        redirectPath = '/admin/dashboard';
      } else if (email.includes('admin')) {
        role = 'admin';
        nom = 'Administrateur';
        redirectPath = '/admin/dashboard';
      } else if (email.includes('enseignant')) {
        role = 'teacher';
        nom = 'Enseignant Demo';
        redirectPath = '/enseignant/dashboard';
      } else if (email.includes('etudiant')) {
        role = 'student';
        nom = 'Étudiant Demo';
        redirectPath = '/etudiant/dashboard';
      }
      
      // Stocker un token fictif pour la démo
      localStorage.setItem('token', 'demo-token');
      localStorage.setItem('user', JSON.stringify({ 
        email, 
        role,
        nom,
        permissions: role === 'superadmin' ? ['all'] : []
      }));
      
      navigate(redirectPath);
    }, 500);
  };

  return (
    <div className="min-vh-100 d-flex align-items-center bg-light">
      <Container>
        <Row className="justify-content-center">
          <Col md={10} lg={8} xl={6}>
            <Card className="border-0 shadow-lg overflow-hidden">
              <Row className="g-0">
                {/* Panneau gauche - Branding */}
                <Col md={5} className="d-none d-md-flex bg-primary text-white p-4 flex-column justify-content-center">
                  <div className="text-center">
                    <div className="mb-4">
                      <i className="bi bi-mortarboard-fill display-1"></i>
                    </div>
                    <h3 className="fw-bold mb-3">GestSco</h3>
                    <p className="mb-4 opacity-75">
                      Système de Gestion Scolaire pour établissements d'enseignement supérieur
                    </p>
                    <div className="d-flex justify-content-center gap-3">
                      <div className="text-center">
                        <div className="fs-4 fw-bold">1250+</div>
                        <small className="opacity-75">Étudiants</small>
                      </div>
                      <div className="text-center">
                        <div className="fs-4 fw-bold">85</div>
                        <small className="opacity-75">Enseignants</small>
                      </div>
                      <div className="text-center">
                        <div className="fs-4 fw-bold">42</div>
                        <small className="opacity-75">Classes</small>
                      </div>
                    </div>
                  </div>
                </Col>

                {/* Panneau droit - Formulaire */}
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
                        disabled={loading}
                      >
                        {loading ? (
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
                      <p className="text-muted mb-3">Accès rapide pour la démo</p>
                      <div className="d-flex flex-wrap justify-content-center gap-2">
                        <Button 
                          variant="danger" 
                          size="sm"
                          onClick={() => { setEmail('superadmin@gestsco.com'); setPassword('superadmin123'); }}
                        >
                          <i className="bi bi-shield-fill-check me-1"></i>
                          SuperAdmin
                        </Button>
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => { setEmail('admin@gestsco.com'); setPassword('admin123'); }}
                        >
                          <i className="bi bi-shield-check me-1"></i>
                          Admin
                        </Button>
                        <Button 
                          variant="outline-success" 
                          size="sm"
                          onClick={() => { setEmail('enseignant@gestsco.com'); setPassword('enseignant123'); }}
                        >
                          <i className="bi bi-person-workspace me-1"></i>
                          Enseignant
                        </Button>
                        <Button 
                          variant="outline-info" 
                          size="sm"
                          onClick={() => { setEmail('etudiant@gestsco.com'); setPassword('etudiant123'); }}
                        >
                          <i className="bi bi-mortarboard me-1"></i>
                          Étudiant
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
