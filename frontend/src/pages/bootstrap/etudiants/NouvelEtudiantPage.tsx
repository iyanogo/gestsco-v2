import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { createEtudiant } from '../../../services/etudiantService';
import { createInscription } from '../../../services/inscriptionService';
import { createDocument } from '../../../services/documentEtudiantService';
import { getFilieres } from '../../../services/filiereService';
import { getNiveaux } from '../../../services/niveauService';
import { handleApiError } from '../../../utils/errorHandler';
import type { CreateEtudiant } from '../../../types/etudiant';
import type { Filiere, Niveau } from '../../../types/reference';

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const mapTypeInscription = (type: string): string => {
  if (type === 'reinscription') return 'redoublement';
  return type;
};

const extractErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError && Array.isArray(error.response?.data?.detail)) {
    return error.response.data.detail
      .map((item: { msg?: string }) => item.msg)
      .filter(Boolean)
      .join(', ');
  }
  return handleApiError(error);
};

const NouvelEtudiantPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    dateNaissance: '',
    lieuNaissance: '',
    sexe: 'M',
    nationalite: 'Burkinabè',
    email: '',
    telephone: '',
    adresse: '',
    filiereId: '',
    niveauId: '',
    anneeScolaire: '2025-2026',
    typeInscription: 'nouvelle',
    photo: null as File | null,
    cni: null as File | null,
    diplome: null as File | null,
  });

  useEffect(() => {
    const loadRefs = async () => {
      try {
        const [filiereData, niveauData] = await Promise.all([getFilieres(), getNiveaux()]);
        setFilieres(filiereData);
        setNiveaux(niveauData);
      } catch (err) {
        setError(extractErrorMessage(err));
      } finally {
        setLoadingRefs(false);
      }
    };
    loadRefs();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    const file = files?.[0] ?? null;
    if (file && file.size > MAX_FILE_SIZE) {
      setError(`Le fichier « ${file.name} » dépasse la taille maximale de 2 Mo.`);
      return;
    }
    setError(null);
    setFormData((prev) => ({ ...prev, [name]: file }));
  };

  const validateStep = (currentStep: number): boolean => {
    if (currentStep === 1) {
      if (!formData.nom.trim() || !formData.prenom.trim() || !formData.email.trim()) {
        setError('Nom, prénom et email sont obligatoires.');
        return false;
      }
    }
    if (currentStep === 2) {
      if (!formData.filiereId || !formData.niveauId) {
        setError('Veuillez sélectionner une filière et un niveau.');
        return false;
      }
    }
    setError(null);
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const prevStep = () => setStep(step - 1);

  const registerDocuments = async (etudiantId: number) => {
    const uploads: Array<{ file: File | null; type: string }> = [
      { file: formData.photo, type: "Photo d'identité" },
      { file: formData.cni, type: "Carte d'identité" },
      { file: formData.diplome, type: 'Baccalauréat' },
    ];

    for (const { file, type } of uploads) {
      if (!file) continue;
      await createDocument({
        etudiant_id: etudiantId,
        type_document: type,
        libelle: file.name,
        format_fichier: file.type,
        taille_fichier: file.size,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(2)) return;

    setLoading(true);
    setError(null);

    try {
      const payload: CreateEtudiant = {
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
        date_naissance: formData.dateNaissance || undefined,
        lieu_naissance: formData.lieuNaissance || undefined,
        sexe: formData.sexe,
        nationalite: formData.nationalite || undefined,
        email: formData.email.trim(),
        telephone: formData.telephone || undefined,
        adresse: formData.adresse || undefined,
        statut: 'actif',
        is_active: true,
      };

      const etudiant = await createEtudiant(payload);

      await createInscription({
        etudiant_id: etudiant.id,
        filiere_id: Number(formData.filiereId),
        niveau_id: Number(formData.niveauId),
        annee_academique: formData.anneeScolaire,
        type_inscription: mapTypeInscription(formData.typeInscription),
      });

      await registerDocuments(etudiant.id);

      setSuccess(true);
      setTimeout(() => navigate(`/admin/etudiants/${etudiant.id}`), 1500);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

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

      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-center">
            {[1, 2, 3].map((s) => (
              <div key={s} className="d-flex align-items-center">
                <div
                  className={`rounded-circle d-flex align-items-center justify-content-center ${
                    step >= s ? 'bg-primary text-white' : 'bg-light text-muted'
                  }`}
                  style={{ width: 40, height: 40 }}
                >
                  {step > s ? <i className="bi bi-check"></i> : s}
                </div>
                <span className={`ms-2 me-4 ${step >= s ? 'text-primary fw-semibold' : 'text-muted'}`}>
                  {s === 1 ? 'Informations personnelles' : s === 2 ? 'Informations académiques' : 'Documents'}
                </span>
                {s < 3 && (
                  <div
                    className={`mx-2 ${step > s ? 'bg-primary' : 'bg-light'}`}
                    style={{ width: 50, height: 3 }}
                  />
                )}
              </div>
            ))}
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success">
          <i className="bi bi-check-circle me-2"></i>
          Étudiant créé avec succès. Redirection en cours...
        </Alert>
      )}

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-4">
          {loadingRefs ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="text-muted mt-3 mb-0">Chargement des filières et niveaux...</p>
            </div>
          ) : (
            <Form onSubmit={handleSubmit}>
              {step === 1 && (
                <>
                  <h5 className="mb-4 fw-bold">
                    <i className="bi bi-person me-2 text-primary"></i>Informations personnelles
                  </h5>
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
                        <Form.Label>Date de naissance</Form.Label>
                        <Form.Control type="date" name="dateNaissance" value={formData.dateNaissance} onChange={handleChange} />
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
                        <Form.Label>Sexe</Form.Label>
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

              {step === 2 && (
                <>
                  <h5 className="mb-4 fw-bold">
                    <i className="bi bi-mortarboard me-2 text-primary"></i>Informations académiques
                  </h5>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Filière <span className="text-danger">*</span></Form.Label>
                        <Form.Select name="filiereId" value={formData.filiereId} onChange={handleChange} required>
                          <option value="">Sélectionner une filière</option>
                          {filieres.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.libelle || f.code || `Filière ${f.id}`}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Niveau <span className="text-danger">*</span></Form.Label>
                        <Form.Select name="niveauId" value={formData.niveauId} onChange={handleChange} required>
                          <option value="">Sélectionner un niveau</option>
                          {niveaux.map((n) => (
                            <option key={n.id} value={n.id}>
                              {n.libelle || n.code || `Niveau ${n.id}`}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Année académique</Form.Label>
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

              {step === 3 && (
                <>
                  <h5 className="mb-4 fw-bold">
                    <i className="bi bi-file-earmark me-2 text-primary"></i>Documents requis
                  </h5>
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Photo d'identité</Form.Label>
                        <Form.Control type="file" name="photo" accept="image/*" onChange={handleFileChange} />
                        <Form.Text className="text-muted">JPG, PNG (max 2 Mo)</Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Carte d'identité / Passeport</Form.Label>
                        <Form.Control type="file" name="cni" accept=".pdf,image/*" onChange={handleFileChange} />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Diplôme / Attestation</Form.Label>
                        <Form.Control type="file" name="diplome" accept=".pdf,image/*" onChange={handleFileChange} />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Alert variant="info" className="mt-3">
                    <i className="bi bi-info-circle me-2"></i>
                    Les métadonnées des documents sont enregistrées. L'upload de fichiers binaires pourra être activé ultérieurement.
                  </Alert>
                </>
              )}

              <div className="d-flex justify-content-between mt-4 pt-3 border-top">
                <Button variant="outline-secondary" onClick={prevStep} disabled={step === 1 || loading}>
                  <i className="bi bi-arrow-left me-2"></i>Précédent
                </Button>
                {step < 3 ? (
                  <Button variant="primary" onClick={nextStep} disabled={loading}>
                    Suivant<i className="bi bi-arrow-right ms-2"></i>
                  </Button>
                ) : (
                  <Button variant="success" type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-lg me-2"></i>Créer l'étudiant
                      </>
                    )}
                  </Button>
                )}
              </div>
            </Form>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default NouvelEtudiantPage;
