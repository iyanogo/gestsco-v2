import React, { useState } from 'react';
import { Container, Row, Col, Card, Nav, Tab } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const BootstrapDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState('admin');

  return (
    <Container fluid className="py-5 bg-light min-vh-100">
      <Container>
        <div className="text-center mb-5">
          <h1 className="display-4 fw-bold text-primary mb-3">
            <i className="bi bi-mortarboard me-3"></i>
            GestSco
          </h1>
          <p className="lead text-muted">
            Système de Gestion Scolaire - Interface React Bootstrap 5
          </p>
        </div>

        <Card className="shadow-lg border-0 mb-5">
          <Card.Header className="bg-white border-bottom">
            <h5 className="mb-0 py-2">
              <i className="bi bi-grid-3x3-gap me-2"></i>
              Sélectionnez votre espace
            </h5>
          </Card.Header>
          <Card.Body className="p-4">
            <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'admin')}>
              <Nav variant="pills" className="justify-content-center mb-4">
                <Nav.Item>
                  <Nav.Link eventKey="admin" className="px-4">
                    <i className="bi bi-shield-check me-2"></i>
                    Administration
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="teacher" className="px-4">
                    <i className="bi bi-person-workspace me-2"></i>
                    Enseignant
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="student" className="px-4">
                    <i className="bi bi-mortarboard me-2"></i>
                    Étudiant
                  </Nav.Link>
                </Nav.Item>
              </Nav>

              <Tab.Content>
                <Tab.Pane eventKey="admin">
                  <Row className="justify-content-center">
                    <Col md={8} lg={6}>
                      <Card className="border-primary border-2">
                        <Card.Body className="text-center p-5">
                          <div className="mb-4">
                            <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                              <i className="bi bi-shield-check fs-1 text-primary"></i>
                            </div>
                          </div>
                          <h4 className="mb-3">Espace Administration</h4>
                          <p className="text-muted mb-4">
                            Gérez l'ensemble de l'établissement : étudiants, enseignants, 
                            inscriptions, finances, paramétrage et plus encore.
                          </p>
                          <ul className="list-unstyled text-start mb-4">
                            <li className="mb-2"><i className="bi bi-check-circle text-success me-2"></i>Gestion des étudiants et inscriptions</li>
                            <li className="mb-2"><i className="bi bi-check-circle text-success me-2"></i>Suivi des finances et paiements</li>
                            <li className="mb-2"><i className="bi bi-check-circle text-success me-2"></i>Configuration du système</li>
                            <li className="mb-2"><i className="bi bi-check-circle text-success me-2"></i>Rapports et statistiques</li>
                          </ul>
                          <Link to="/admin/dashboard" className="btn btn-primary btn-lg px-5">
                            <i className="bi bi-box-arrow-in-right me-2"></i>
                            Accéder
                          </Link>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Tab.Pane>

                <Tab.Pane eventKey="teacher">
                  <Row className="justify-content-center">
                    <Col md={8} lg={6}>
                      <Card className="border-success border-2">
                        <Card.Body className="text-center p-5">
                          <div className="mb-4">
                            <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                              <i className="bi bi-person-workspace fs-1 text-success"></i>
                            </div>
                          </div>
                          <h4 className="mb-3">Espace Enseignant</h4>
                          <p className="text-muted mb-4">
                            Gérez vos cours, saisissez les notes, suivez les présences 
                            et consultez votre emploi du temps.
                          </p>
                          <ul className="list-unstyled text-start mb-4">
                            <li className="mb-2"><i className="bi bi-check-circle text-success me-2"></i>Emploi du temps personnel</li>
                            <li className="mb-2"><i className="bi bi-check-circle text-success me-2"></i>Saisie des notes</li>
                            <li className="mb-2"><i className="bi bi-check-circle text-success me-2"></i>Gestion des présences</li>
                            <li className="mb-2"><i className="bi bi-check-circle text-success me-2"></i>Liste des étudiants</li>
                          </ul>
                          <Link to="/enseignant/dashboard" className="btn btn-success btn-lg px-5">
                            <i className="bi bi-box-arrow-in-right me-2"></i>
                            Accéder
                          </Link>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Tab.Pane>

                <Tab.Pane eventKey="student">
                  <Row className="justify-content-center">
                    <Col md={8} lg={6}>
                      <Card className="border-info border-2">
                        <Card.Body className="text-center p-5">
                          <div className="mb-4">
                            <div className="bg-info bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                              <i className="bi bi-mortarboard fs-1 text-info"></i>
                            </div>
                          </div>
                          <h4 className="mb-3">Espace Étudiant</h4>
                          <p className="text-muted mb-4">
                            Consultez vos notes, votre emploi du temps, vos bulletins 
                            et gérez votre situation financière.
                          </p>
                          <ul className="list-unstyled text-start mb-4">
                            <li className="mb-2"><i className="bi bi-check-circle text-success me-2"></i>Consultation des notes</li>
                            <li className="mb-2"><i className="bi bi-check-circle text-success me-2"></i>Emploi du temps</li>
                            <li className="mb-2"><i className="bi bi-check-circle text-success me-2"></i>Bulletins et relevés</li>
                            <li className="mb-2"><i className="bi bi-check-circle text-success me-2"></i>Situation financière</li>
                          </ul>
                          <Link to="/etudiant/dashboard" className="btn btn-info btn-lg px-5 text-white">
                            <i className="bi bi-box-arrow-in-right me-2"></i>
                            Accéder
                          </Link>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Tab.Pane>
              </Tab.Content>
            </Tab.Container>
          </Card.Body>
        </Card>

        <div className="text-center text-muted">
          <small>
            <i className="bi bi-info-circle me-1"></i>
            Interface construite avec React Bootstrap 5 • Design moderne pour établissements éducatifs
          </small>
        </div>
      </Container>
    </Container>
  );
};

export default BootstrapDemo;
