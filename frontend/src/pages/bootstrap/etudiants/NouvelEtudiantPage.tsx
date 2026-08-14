import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const NouvelEtudiantPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    // Informations personnelles
    nom: '', prenom: '', dateNaissance: '', lieuNaissance: '', sexe: 'M',
    nationalite: 'Sénégalaise', email: '', telephone: '', adresse: '',
    // Informations académiques
    filiere: '', niveau: '', anneeScolaire: '2025-2026', typeInscription: 'nouvelle',
    // Documents
    photo: null as File | null, cni: null as File | null, diplome: null as File | null
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData({ ...formData, [name]: files[0] });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulation de création
    setSuccess(true);
    setTimeout(() => navigate('/admin/etudiants'), 2000);
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1 fw-bold">Nouvel étudiant</h2>
              <p className="text-muted mb-0">Création d'un nouveau dossier étudiant</p>
            </div>
            <Button variant="outline-secondary" onClick={() => navigate('/admin/etudiants')}>
              <i className="bi bi-arrow-left me-2"></i>Retour
            </Button>
          </div>
        </Col>
      </Row>

      {/* Progress Steps */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-center">
            {[1, 2, 3].map((s) => (
              <div key={s} className="d-flex align-items-center">
                <div className={`rounded-circle d-flex align-items-center justify-content-center ${step >= s ? 'bg-primary text-white' : 'bg-light text-muted'}`} style={{ width: 40, height: 40 }}>
                  {step > s ? <i className="bi bi-check"></i> : s}
                </div>
                <span className={`ms-2 me-4 ${step >= s ? 'text-primary fw-semibold' : 'text-muted'}`}>
                  {s === 1 ? 'Informations personnelles' : s === 2 ? 'Informations académiques' : 'Documents'}
                </span>
                {s < 3 && <div className={`mx-2 ${step > s ? 'bg-primary' : 'bg-light'}`} style={{ width: 50, height: 3 }}></div>}
              </div>
            ))}
          </div>
        </Col>
      </Row>

      {success && (
        <Alert variant="success" className="mb-4">
          <i className="bi bi-check-circle me-2"></i>
          Étudiant créé avec succès ! Redirection en cours...
        </Alert>
      )}

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-4">
          <Form onSubmit={handleSubmit}>
            {/* Step 1: Informations personnelles */}
            {step === 1 && (
              <>
                <h5 className="mb-4 fw-bold"><i className="bi bi-person me-2 text-primary"></i>Informations personnelles</h5>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Nom <span className="text-danger">*</span></Form.Label>
                      <Form.Control type="text" name="nom" value={formData.nom} onChange={handleChange} required />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Prénom <span className="text-danger">*</span></Form.Label>
                      <Form.Control type="text" name="prenom" value={formData.prenom} onChange={handleChange} required />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Date de naissance <span className="text-danger">*</span></Form.Label>
                      <Form.Control type="date" name="dateNaissance" value={formData.dateNaissance} onChange={handleChange} required />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Lieu de naissance</Form.Label>
                      <Form.Control type="text" name="lieuNaissance" value={formData.lieuNaissance} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Sexe <span className="text-danger">*</span></Form.Label>
                      <Form.Select name="sexe" value={formData.sexe} onChange={handleChange}>
                        <option value="M">Masculin</option>
                        <option value="F">Féminin</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Nationalité</Form.Label>
                      <Form.Control type="text" name="nationalite" value={formData.nationalite} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                      <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} required />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Téléphone</Form.Label>
                      <Form.Control type="tel" name="telephone" value={formData.telephone} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Adresse</Form.Label>
                      <Form.Control type="text" name="adresse" value={formData.adresse} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                </Row>
              </>
            )}

            {/* Step 2: Informations académiques */}
            {step === 2 && (
              <>
                <h5 className="mb-4 fw-bold"><i className="bi bi-mortarboard me-2 text-primary"></i>Informations académiques</h5>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Filière <span className="text-danger">*</span></Form.Label>
                      <Form.Select name="filiere" value={formData.filiere} onChange={handleChange} required>
                        <option value="">Sélectionner une filière</option>
                        <option value="informatique">Informatique</option>
                        <option value="gestion">Gestion</option>
                        <option value="economie">Économie</option>
                        <option value="droit">Droit</option>
                        <option value="medecine">Médecine</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Niveau <span className="text-danger">*</span></Form.Label>
                      <Form.Select name="niveau" value={formData.niveau} onChange={handleChange} required>
                        <option value="">Sélectionner un niveau</option>
                        <option value="L1">Licence 1</option>
                        <option value="L2">Licence 2</option>
                        <option value="L3">Licence 3</option>
                        <option value="M1">Master 1</option>
                        <option value="M2">Master 2</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Année scolaire</Form.Label>
                      <Form.Select name="anneeScolaire" value={formData.anneeScolaire} onChange={handleChange}>
                        <option value="2025-2026">2025-2026</option>
                        <option value="2024-2025">2024-2025</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Type d'inscription</Form.Label>
                      <Form.Select name="typeInscription" value={formData.typeInscription} onChange={handleChange}>
                        <option value="nouvelle">Nouvelle inscription</option>
                        <option value="transfert">Transfert</option>
                        <option value="reinscription">Réinscription</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </>
            )}

            {/* Step 3: Documents */}
            {step === 3 && (
              <>
                <h5 className="mb-4 fw-bold"><i className="bi bi-file-earmark me-2 text-primary"></i>Documents requis</h5>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Photo d'identité</Form.Label>
                      <Form.Control type="file" name="photo" accept="image/*" onChange={handleFileChange} />
                      <Form.Text className="text-muted">Format: JPG, PNG (max 2MB)</Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Carte d'identité / Passeport</Form.Label>
                      <Form.Control type="file" name="cni" accept=".pdf,image/*" onChange={handleFileChange} />
                      <Form.Text className="text-muted">Format: PDF, JPG, PNG</Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Diplôme / Attestation</Form.Label>
                      <Form.Control type="file" name="diplome" accept=".pdf,image/*" onChange={handleFileChange} />
                      <Form.Text className="text-muted">Format: PDF, JPG, PNG</Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
                <Alert variant="info" className="mt-3">
                  <i className="bi bi-info-circle me-2"></i>
                  Les documents peuvent être ajoutés ultérieurement depuis le dossier de l'étudiant.
                </Alert>
              </>
            )}

            {/* Navigation buttons */}
            <div className="d-flex justify-content-between mt-4 pt-3 border-top">
              <Button variant="outline-secondary" onClick={prevStep} disabled={step === 1}>
                <i className="bi bi-arrow-left me-2"></i>Précédent
              </Button>
              {step < 3 ? (
                <Button variant="primary" onClick={nextStep}>
                  Suivant<i className="bi bi-arrow-right ms-2"></i>
                </Button>
              ) : (
                <Button variant="success" type="submit">
                  <i className="bi bi-check-lg me-2"></i>Créer l'étudiant
                </Button>
              )}
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default NouvelEtudiantPage;
