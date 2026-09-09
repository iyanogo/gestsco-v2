import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AxiosError } from 'axios';
import { PageHeader } from '../../../components/layouts';
import { usePermissions } from '../../../hooks/usePermissions';
import { getEtudiantById, updateEtudiant } from '../../../services/etudiantService';
import { handleApiError } from '../../../utils/errorHandler';
import type { UpdateEtudiant } from '../../../types/etudiant';

const extractErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError && Array.isArray(error.response?.data?.detail)) {
    return error.response.data.detail
      .map((item: { msg?: string }) => item.msg)
      .filter(Boolean)
      .join(', ');
  }
  return handleApiError(error);
};

const EditEtudiantPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { moduleActions } = usePermissions();
  const { canUpdate } = moduleActions('etudiants');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [matricule, setMatricule] = useState('');
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    dateNaissance: '',
    lieuNaissance: '',
    sexe: 'M',
    nationalite: '',
    email: '',
    telephone: '',
    adresse: '',
    statut: 'actif',
    isActive: true,
  });

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const etudiant = await getEtudiantById(parseInt(id, 10));
        setMatricule(etudiant.matricule || '');
        setFormData({
          nom: etudiant.nom || '',
          prenom: etudiant.prenom || '',
          dateNaissance: etudiant.date_naissance?.slice(0, 10) || '',
          lieuNaissance: etudiant.lieu_naissance || '',
          sexe: etudiant.sexe || 'M',
          nationalite: etudiant.nationalite || '',
          email: etudiant.email || '',
          telephone: etudiant.telephone || '',
          adresse: etudiant.adresse || '',
          statut: etudiant.statut || 'actif',
          isActive: etudiant.is_active ?? true,
        });
      } catch (err) {
        setError(extractErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !canUpdate) return;

    if (!formData.nom.trim() || !formData.prenom.trim() || !formData.email.trim()) {
      setError('Nom, prénom et email sont obligatoires.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload: UpdateEtudiant = {
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
        date_naissance: formData.dateNaissance || undefined,
        lieu_naissance: formData.lieuNaissance || undefined,
        sexe: formData.sexe,
        nationalite: formData.nationalite || undefined,
        email: formData.email.trim(),
        telephone: formData.telephone || undefined,
        adresse: formData.adresse || undefined,
        statut: formData.statut,
        is_active: formData.isActive,
      };

      await updateEtudiant(parseInt(id, 10), payload);
      setSuccess(true);
      setTimeout(() => navigate(`/admin/etudiants/${id}`), 1200);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!canUpdate) {
    return (
      <div className="fade-in">
        <PageHeader
          title="Modifier l'étudiant"
          breadcrumbs={[
            { label: 'Étudiants', path: '/admin/etudiants' },
            { label: 'Accès refusé' },
          ]}
        />
        <Alert variant="warning">Vous n'avez pas la permission de modifier un étudiant.</Alert>
        <Link to="/admin/etudiants" className="btn btn-outline-secondary">Retour à la liste</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="text-muted mt-3 mb-0">Chargement de la fiche...</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <PageHeader
        title="Modifier l'étudiant"
        subtitle={matricule ? `Matricule : ${matricule}` : undefined}
        breadcrumbs={[
          { label: 'Étudiants', path: '/admin/etudiants' },
          { label: 'Modifier' },
        ]}
        actions={
          <Link to={`/admin/etudiants/${id}`} className="btn btn-outline-secondary">
            <i className="bi bi-arrow-left me-2"></i>
            Retour à la fiche
          </Link>
        }
      />

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success">
          <i className="bi bi-check-circle me-2"></i>
          Modifications enregistrées. Redirection en cours...
        </Alert>
      )}

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-4">
          <Form onSubmit={handleSubmit}>
            <h5 className="mb-4 fw-bold">
              <i className="bi bi-person me-2 text-primary"></i>
              Informations personnelles
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
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Statut</Form.Label>
                  <Form.Select name="statut" value={formData.statut} onChange={handleChange}>
                    <option value="actif">Actif</option>
                    <option value="inactif">Inactif</option>
                    <option value="suspendu">Suspendu</option>
                    <option value="diplome">Diplômé</option>
                    <option value="abandon">Abandon</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6} className="d-flex align-items-center">
                <Form.Check
                  type="switch"
                  id="isActive"
                  name="isActive"
                  label="Compte actif"
                  checked={formData.isActive}
                  onChange={handleChange}
                />
              </Col>
            </Row>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <Link to={`/admin/etudiants/${id}`} className="btn btn-outline-secondary">
                Annuler
              </Link>
              <Button type="submit" variant="primary" disabled={saving || success}>
                {saving ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-lg me-2"></i>
                    Enregistrer
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default EditEtudiantPage;
