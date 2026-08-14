import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Button, 
  Card, 
  Row, 
  Col, 
  Alert,
  Spinner
} from 'react-bootstrap';
import { 
  Calendar, 
  People, 
  CheckCircle, 
  XCircle,
  ExclamationTriangle
} from 'react-bootstrap-icons';
import { Stage, Soutenance } from '../../types/anneeAcademique';

interface Salle {
  id: number;
  code: string;
  libelle: string;
  capacite: number;
  disponible?: boolean;
}

interface Enseignant {
  id: number;
  nom: string;
  prenom: string;
  disponible?: boolean;
}

interface FormSoutenanceProps {
  stageId: number;
  stage?: Stage;
  initialData?: Partial<Soutenance>;
  salles?: Salle[];
  enseignants?: Enseignant[];
  onSubmit: (data: Partial<Soutenance>) => Promise<void>;
  onCancel: () => void;
}

const FormSoutenance: React.FC<FormSoutenanceProps> = ({
  stageId,
  stage,
  initialData,
  salles = [],
  enseignants = [],
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState<Partial<Soutenance>>({
    stage_id: stageId,
    duree_minutes: 30,
    lieu: '',
    ...initialData
  });

  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [conflits, setConflits] = useState<string[]>([]);

  const handleChange = (field: keyof Soutenance, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (erreurs[field]) {
      setErreurs(prev => {
        const newErreurs = { ...prev };
        delete newErreurs[field];
        return newErreurs;
      });
    }
  };

  const verifierDisponibilite = async () => {
    const nouveauxConflits: string[] = [];
    
    // Simulation de vérification de disponibilité
    if (formData.salle_id) {
      const salle = salles.find(s => s.id === formData.salle_id);
      if (salle && salle.disponible === false) {
        nouveauxConflits.push(`La salle ${salle.libelle} n'est pas disponible à cette date`);
      }
    }

    if (formData.president_jury_id) {
      const president = enseignants.find(e => e.id === formData.president_jury_id);
      if (president && president.disponible === false) {
        nouveauxConflits.push(`${president.prenom} ${president.nom} n'est pas disponible`);
      }
    }

    setConflits(nouveauxConflits);
  };

  useEffect(() => {
    if (formData.date_soutenance) {
      verifierDisponibilite();
    }
  }, [formData.date_soutenance, formData.salle_id, formData.president_jury_id, formData.rapporteur_id]);

  const valider = (): boolean => {
    const newErreurs: Record<string, string> = {};

    if (!formData.date_soutenance) newErreurs.date_soutenance = 'Date requise';
    if (!formData.lieu) newErreurs.lieu = 'Lieu requis';
    if (!formData.president_jury_id) newErreurs.president_jury_id = 'Président du jury requis';
    if (!formData.rapporteur_id) newErreurs.rapporteur_id = 'Rapporteur requis';

    // Vérifier que les membres du jury sont différents
    const juryIds = [formData.president_jury_id, formData.rapporteur_id, formData.examinateur_id].filter(Boolean);
    if (new Set(juryIds).size !== juryIds.length) {
      newErreurs.jury = 'Les membres du jury doivent être différents';
    }

    setErreurs(newErreurs);
    return Object.keys(newErreurs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valider()) return;

    setLoading(true);
    setErreur(null);

    try {
      await onSubmit(formData);
    } catch (error) {
      setErreur(error instanceof Error ? error.message : 'Erreur lors de la programmation');
    } finally {
      setLoading(false);
    }
  };

  const renderDisponibiliteIcon = (disponible?: boolean) => {
    if (disponible === undefined) return null;
    return disponible ? (
      <CheckCircle className="text-success ms-2" />
    ) : (
      <XCircle className="text-danger ms-2" />
    );
  };

  return (
    <Form onSubmit={handleSubmit}>
      {erreur && (
        <Alert variant="danger" dismissible onClose={() => setErreur(null)}>
          {erreur}
        </Alert>
      )}

      {conflits.length > 0 && (
        <Alert variant="warning">
          <ExclamationTriangle className="me-2" />
          <strong>Conflits détectés :</strong>
          <ul className="mb-0 mt-2">
            {conflits.map((conflit, index) => (
              <li key={index}>{conflit}</li>
            ))}
          </ul>
        </Alert>
      )}

      {erreurs.jury && (
        <Alert variant="danger">{erreurs.jury}</Alert>
      )}

      <Card className="mb-4">
        <Card.Header className="bg-white">
          <Calendar className="me-2" />
          Planification
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Date et heure de soutenance <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={formData.date_soutenance || ''}
                  onChange={(e) => handleChange('date_soutenance', e.target.value)}
                  isInvalid={!!erreurs.date_soutenance}
                />
                <Form.Control.Feedback type="invalid">{erreurs.date_soutenance}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Durée (minutes)</Form.Label>
                <Form.Control
                  type="number"
                  min={15}
                  max={120}
                  step={15}
                  value={formData.duree_minutes || 30}
                  onChange={(e) => handleChange('duree_minutes', parseInt(e.target.value))}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Salle</Form.Label>
                <Form.Select
                  value={formData.salle_id || ''}
                  onChange={(e) => handleChange('salle_id', e.target.value ? parseInt(e.target.value) : undefined)}
                >
                  <option value="">Sélectionner une salle</option>
                  {salles.map(salle => (
                    <option key={salle.id} value={salle.id}>
                      {salle.code} - {salle.libelle} (Capacité: {salle.capacite})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Lieu <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  value={formData.lieu || ''}
                  onChange={(e) => handleChange('lieu', e.target.value)}
                  isInvalid={!!erreurs.lieu}
                  placeholder="Ex: Amphi A, Salle de conférence..."
                />
                <Form.Control.Feedback type="invalid">{erreurs.lieu}</Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header className="bg-white">
          <People className="me-2" />
          Composition du jury
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Président du jury <span className="text-danger">*</span>
                </Form.Label>
                <div className="d-flex align-items-center">
                  <Form.Select
                    value={formData.president_jury_id || ''}
                    onChange={(e) => handleChange('president_jury_id', parseInt(e.target.value))}
                    isInvalid={!!erreurs.president_jury_id}
                    className="flex-grow-1"
                  >
                    <option value="">Sélectionner</option>
                    {enseignants.map(e => (
                      <option key={e.id} value={e.id}>
                        {e.prenom} {e.nom}
                      </option>
                    ))}
                  </Form.Select>
                  {formData.president_jury_id && renderDisponibiliteIcon(
                    enseignants.find(e => e.id === formData.president_jury_id)?.disponible
                  )}
                </div>
                <Form.Control.Feedback type="invalid">{erreurs.president_jury_id}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Rapporteur <span className="text-danger">*</span>
                </Form.Label>
                <div className="d-flex align-items-center">
                  <Form.Select
                    value={formData.rapporteur_id || ''}
                    onChange={(e) => handleChange('rapporteur_id', parseInt(e.target.value))}
                    isInvalid={!!erreurs.rapporteur_id}
                    className="flex-grow-1"
                  >
                    <option value="">Sélectionner</option>
                    {enseignants.map(e => (
                      <option key={e.id} value={e.id}>
                        {e.prenom} {e.nom}
                      </option>
                    ))}
                  </Form.Select>
                  {formData.rapporteur_id && renderDisponibiliteIcon(
                    enseignants.find(e => e.id === formData.rapporteur_id)?.disponible
                  )}
                </div>
                <Form.Control.Feedback type="invalid">{erreurs.rapporteur_id}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Examinateur (optionnel)</Form.Label>
                <div className="d-flex align-items-center">
                  <Form.Select
                    value={formData.examinateur_id || ''}
                    onChange={(e) => handleChange('examinateur_id', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="flex-grow-1"
                  >
                    <option value="">Sélectionner</option>
                    {enseignants.map(e => (
                      <option key={e.id} value={e.id}>
                        {e.prenom} {e.nom}
                      </option>
                    ))}
                  </Form.Select>
                  {formData.examinateur_id && renderDisponibiliteIcon(
                    enseignants.find(e => e.id === formData.examinateur_id)?.disponible
                  )}
                </div>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {stage && (
        <Card className="mb-4 bg-light border-0">
          <Card.Header className="bg-transparent">
            Récapitulatif du stage
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <p className="mb-1"><strong>Étudiant :</strong> #{stage.etudiant_id}</p>
                <p className="mb-1"><strong>Entreprise :</strong> {stage.entreprise_nom}</p>
              </Col>
              <Col md={6}>
                <p className="mb-1"><strong>Thème :</strong> {stage.theme}</p>
                <p className="mb-1"><strong>Durée :</strong> {stage.duree_semaines} semaines</p>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      <div className="d-flex justify-content-between">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          Annuler
        </Button>
        <Button variant="primary" type="submit" disabled={loading || conflits.length > 0}>
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Programmation...
            </>
          ) : (
            'Programmer la soutenance'
          )}
        </Button>
      </div>
    </Form>
  );
};

export default FormSoutenance;
