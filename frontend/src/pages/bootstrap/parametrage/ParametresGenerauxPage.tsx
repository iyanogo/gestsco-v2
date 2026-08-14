import React, { useState } from 'react';
import { Row, Col, Card, Button, Form, Alert, Tab, Tabs } from 'react-bootstrap';
import { PageHeader } from '../../../components/layouts';

const ParametresGenerauxPage: React.FC = () => {
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('etablissement');

  const [etablissement, setEtablissement] = useState({
    nom: 'ESCO-IGES',
    sigle: 'ESCO-IGES',
    adresse: 'Avenue de la Liberté, Secteur 30',
    ville: 'Ouagadougou',
    pays: 'Burkina Faso',
    telephone: '+226 25 34 39 15',
    email: 'contact@esco-iges.com',
    siteWeb: 'www.esco-iges.com',
    directeur: 'Dr. Jean François BOUDA'
  });

  const [academique, setAcademique] = useState({
    anneeEnCours: '2025-2026',
    semestreEnCours: 'S1',
    dateDebutAnnee: '2025-10-01',
    dateFinAnnee: '2026-07-31',
    noteValidation: 10,
    noteMax: 20,
    moyenneValidation: 10
  });

  const [notifications, setNotifications] = useState({
    emailInscription: true,
    emailPaiement: true,
    emailNotes: true,
    smsRappelPaiement: false,
    smsAbsence: false
  });

  const handleSave = () => {
    console.log('Saving settings:', { etablissement, academique, notifications });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Paramètres généraux"
        subtitle="Configuration de l'établissement et du système"
        breadcrumbs={[
          { label: 'Paramétrage', path: '/admin/parametrage' },
          { label: 'Paramètres généraux' }
        ]}
        actions={
          <Button variant="primary" onClick={handleSave}>
            <i className="bi bi-check-lg me-2"></i>
            Enregistrer les modifications
          </Button>
        }
      />

      {saved && (
        <Alert variant="success" className="d-flex align-items-center">
          <i className="bi bi-check-circle me-2"></i>
          Les paramètres ont été enregistrés avec succès !
        </Alert>
      )}

      <Card className="border-0 shadow-sm">
        <Card.Body>
          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'etablissement')} className="mb-4">
            {/* Onglet Établissement */}
            <Tab eventKey="etablissement" title={<><i className="bi bi-building me-2"></i>Établissement</>}>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Nom de l'établissement</Form.Label>
                    <Form.Control
                      value={etablissement.nom}
                      onChange={(e) => setEtablissement({ ...etablissement, nom: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Sigle</Form.Label>
                    <Form.Control
                      value={etablissement.sigle}
                      onChange={(e) => setEtablissement({ ...etablissement, sigle: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Adresse</Form.Label>
                    <Form.Control
                      value={etablissement.adresse}
                      onChange={(e) => setEtablissement({ ...etablissement, adresse: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Ville</Form.Label>
                    <Form.Control
                      value={etablissement.ville}
                      onChange={(e) => setEtablissement({ ...etablissement, ville: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Pays</Form.Label>
                    <Form.Control
                      value={etablissement.pays}
                      onChange={(e) => setEtablissement({ ...etablissement, pays: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Téléphone</Form.Label>
                    <Form.Control
                      value={etablissement.telephone}
                      onChange={(e) => setEtablissement({ ...etablissement, telephone: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      value={etablissement.email}
                      onChange={(e) => setEtablissement({ ...etablissement, email: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Site web</Form.Label>
                    <Form.Control
                      value={etablissement.siteWeb}
                      onChange={(e) => setEtablissement({ ...etablissement, siteWeb: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Directeur / Responsable</Form.Label>
                    <Form.Control
                      value={etablissement.directeur}
                      onChange={(e) => setEtablissement({ ...etablissement, directeur: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Logo de l'établissement</Form.Label>
                    <Form.Control type="file" accept="image/*" />
                    <Form.Text className="text-muted">
                      Format recommandé: PNG ou JPG, 200x200 pixels minimum
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
            </Tab>

            {/* Onglet Académique */}
            <Tab eventKey="academique" title={<><i className="bi bi-mortarboard me-2"></i>Académique</>}>
              <Row className="g-3">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Année académique en cours</Form.Label>
                    <Form.Select
                      value={academique.anneeEnCours}
                      onChange={(e) => setAcademique({ ...academique, anneeEnCours: e.target.value })}
                    >
                      <option value="2025-2026">2025-2026</option>
                      <option value="2024-2025">2024-2025</option>
                      <option value="2026-2027">2026-2027</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Semestre en cours</Form.Label>
                    <Form.Select
                      value={academique.semestreEnCours}
                      onChange={(e) => setAcademique({ ...academique, semestreEnCours: e.target.value })}
                    >
                      <option value="S1">Semestre 1</option>
                      <option value="S2">Semestre 2</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}></Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Date début année</Form.Label>
                    <Form.Control
                      type="date"
                      value={academique.dateDebutAnnee}
                      onChange={(e) => setAcademique({ ...academique, dateDebutAnnee: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Date fin année</Form.Label>
                    <Form.Control
                      type="date"
                      value={academique.dateFinAnnee}
                      onChange={(e) => setAcademique({ ...academique, dateFinAnnee: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}></Col>
                <Col md={12}>
                  <hr className="my-4" />
                  <h6 className="mb-3">Paramètres de notation</h6>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Note maximale</Form.Label>
                    <Form.Control
                      type="number"
                      value={academique.noteMax}
                      onChange={(e) => setAcademique({ ...academique, noteMax: parseInt(e.target.value) })}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Note de validation (matière)</Form.Label>
                    <Form.Control
                      type="number"
                      value={academique.noteValidation}
                      onChange={(e) => setAcademique({ ...academique, noteValidation: parseInt(e.target.value) })}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Moyenne de validation (semestre)</Form.Label>
                    <Form.Control
                      type="number"
                      value={academique.moyenneValidation}
                      onChange={(e) => setAcademique({ ...academique, moyenneValidation: parseInt(e.target.value) })}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Tab>

            {/* Onglet Notifications */}
            <Tab eventKey="notifications" title={<><i className="bi bi-bell me-2"></i>Notifications</>}>
              <Row className="g-4">
                <Col md={6}>
                  <Card className="h-100">
                    <Card.Header className="bg-white">
                      <h6 className="mb-0">
                        <i className="bi bi-envelope me-2"></i>
                        Notifications par email
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      <Form.Check
                        type="switch"
                        id="emailInscription"
                        label="Confirmation d'inscription"
                        checked={notifications.emailInscription}
                        onChange={(e) => setNotifications({ ...notifications, emailInscription: e.target.checked })}
                        className="mb-3"
                      />
                      <Form.Check
                        type="switch"
                        id="emailPaiement"
                        label="Confirmation de paiement"
                        checked={notifications.emailPaiement}
                        onChange={(e) => setNotifications({ ...notifications, emailPaiement: e.target.checked })}
                        className="mb-3"
                      />
                      <Form.Check
                        type="switch"
                        id="emailNotes"
                        label="Publication des notes"
                        checked={notifications.emailNotes}
                        onChange={(e) => setNotifications({ ...notifications, emailNotes: e.target.checked })}
                      />
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="h-100">
                    <Card.Header className="bg-white">
                      <h6 className="mb-0">
                        <i className="bi bi-phone me-2"></i>
                        Notifications par SMS
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      <Form.Check
                        type="switch"
                        id="smsRappelPaiement"
                        label="Rappel de paiement"
                        checked={notifications.smsRappelPaiement}
                        onChange={(e) => setNotifications({ ...notifications, smsRappelPaiement: e.target.checked })}
                        className="mb-3"
                      />
                      <Form.Check
                        type="switch"
                        id="smsAbsence"
                        label="Notification d'absence"
                        checked={notifications.smsAbsence}
                        onChange={(e) => setNotifications({ ...notifications, smsAbsence: e.target.checked })}
                      />
                      <Alert variant="info" className="mt-3 mb-0">
                        <small>
                          <i className="bi bi-info-circle me-1"></i>
                          Les notifications SMS nécessitent une configuration du service SMS.
                        </small>
                      </Alert>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Tab>

            {/* Onglet Sécurité */}
            <Tab eventKey="securite" title={<><i className="bi bi-shield-lock me-2"></i>Sécurité</>}>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Durée de session (minutes)</Form.Label>
                    <Form.Control type="number" defaultValue={60} min={15} max={480} />
                    <Form.Text className="text-muted">
                      Durée d'inactivité avant déconnexion automatique
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Tentatives de connexion max</Form.Label>
                    <Form.Control type="number" defaultValue={5} min={3} max={10} />
                    <Form.Text className="text-muted">
                      Nombre de tentatives avant blocage du compte
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <hr className="my-4" />
                  <h6 className="mb-3">Politique de mot de passe</h6>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Longueur minimale</Form.Label>
                    <Form.Control type="number" defaultValue={8} min={6} max={20} />
                  </Form.Group>
                </Col>
                <Col md={8}>
                  <Form.Label>Exigences</Form.Label>
                  <div className="d-flex flex-wrap gap-3">
                    <Form.Check type="checkbox" label="Majuscules" defaultChecked />
                    <Form.Check type="checkbox" label="Minuscules" defaultChecked />
                    <Form.Check type="checkbox" label="Chiffres" defaultChecked />
                    <Form.Check type="checkbox" label="Caractères spéciaux" />
                  </div>
                </Col>
              </Row>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ParametresGenerauxPage;
