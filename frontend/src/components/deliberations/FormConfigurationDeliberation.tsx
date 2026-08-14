import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Button, 
  Accordion, 
  Alert, 
  Row, 
  Col,
  Spinner
} from 'react-bootstrap';
import { InfoCircle, CheckCircle, XCircle } from 'react-bootstrap-icons';

interface ConfigurationDeliberation {
  periodicite: 'semestrielle' | 'annuelle';
  compensation_semestres: boolean;
  moyenne_validation: number;
  moyenne_passage_conditionnel: number;
  note_eliminatoire?: number;
  nombre_matieres_dette_max: number;
  credits_min_passage?: number;
  validation_par_credits: boolean;
  taux_presence_min: number;
  presence_obligatoire: boolean;
  autoriser_rattrapage: boolean;
  nombre_sessions_max: number;
  regles_specifiques?: string;
}

interface FormConfigurationDeliberationProps {
  initialData?: Partial<ConfigurationDeliberation>;
  onSubmit: (data: ConfigurationDeliberation) => Promise<void>;
  onCancel: () => void;
  onDuplicate?: () => void;
}

const FormConfigurationDeliberation: React.FC<FormConfigurationDeliberationProps> = ({
  initialData,
  onSubmit,
  onCancel,
  onDuplicate
}) => {
  const [formData, setFormData] = useState<ConfigurationDeliberation>({
    periodicite: 'semestrielle',
    compensation_semestres: true,
    moyenne_validation: 10,
    moyenne_passage_conditionnel: 8,
    nombre_matieres_dette_max: 2,
    validation_par_credits: false,
    taux_presence_min: 75,
    presence_obligatoire: false,
    autoriser_rattrapage: true,
    nombre_sessions_max: 2
  });

  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [jsonValide, setJsonValide] = useState<boolean | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const handleChange = (field: keyof ConfigurationDeliberation, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateJson = () => {
    if (!formData.regles_specifiques) {
      setJsonValide(null);
      return;
    }
    try {
      JSON.parse(formData.regles_specifiques);
      setJsonValide(true);
    } catch {
      setJsonValide(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErreur(null);

    try {
      if (formData.regles_specifiques) {
        try {
          JSON.parse(formData.regles_specifiques);
        } catch {
          throw new Error('Le JSON des règles spécifiques est invalide');
        }
      }
      await onSubmit(formData);
    } catch (error) {
      setErreur(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      {erreur && (
        <Alert variant="danger" dismissible onClose={() => setErreur(null)}>
          {erreur}
        </Alert>
      )}

      <Accordion defaultActiveKey={['0', '1']} alwaysOpen>
        {/* Paramètres généraux */}
        <Accordion.Item eventKey="0">
          <Accordion.Header>Paramètres généraux</Accordion.Header>
          <Accordion.Body>
            <Form.Group className="mb-3">
              <Form.Label>Périodicité</Form.Label>
              <div>
                <Form.Check
                  inline
                  type="radio"
                  id="periodicite-semestrielle"
                  label="Semestrielle"
                  name="periodicite"
                  checked={formData.periodicite === 'semestrielle'}
                  onChange={() => handleChange('periodicite', 'semestrielle')}
                />
                <Form.Check
                  inline
                  type="radio"
                  id="periodicite-annuelle"
                  label="Annuelle"
                  name="periodicite"
                  checked={formData.periodicite === 'annuelle'}
                  onChange={() => handleChange('periodicite', 'annuelle')}
                />
              </div>
              <Form.Text className="text-muted">
                <InfoCircle className="me-1" />
                Semestrielle : délibération à chaque semestre. Annuelle : en fin d'année uniquement.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                id="compensation_semestres"
                label="Autoriser la compensation des semestres"
                checked={formData.compensation_semestres}
                onChange={(e) => handleChange('compensation_semestres', e.target.checked)}
              />
              <Form.Text className="text-muted">
                <InfoCircle className="me-1" />
                Si activé, la moyenne des 2 semestres peut compenser un semestre insuffisant.
              </Form.Text>
            </Form.Group>
          </Accordion.Body>
        </Accordion.Item>

        {/* Critères de validation */}
        <Accordion.Item eventKey="1">
          <Accordion.Header>Critères de validation</Accordion.Header>
          <Accordion.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Moyenne de validation</Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    max={20}
                    step={0.01}
                    value={formData.moyenne_validation}
                    onChange={(e) => handleChange('moyenne_validation', parseFloat(e.target.value))}
                  />
                  <Form.Text className="text-muted">
                    Moyenne minimale pour valider (généralement 10/20)
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Moyenne de passage conditionnel</Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    max={20}
                    step={0.01}
                    value={formData.moyenne_passage_conditionnel}
                    onChange={(e) => handleChange('moyenne_passage_conditionnel', parseFloat(e.target.value))}
                  />
                  <Form.Text className="text-muted">
                    Moyenne pour passage avec dette
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Note éliminatoire (optionnel)</Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    max={20}
                    step={0.01}
                    value={formData.note_eliminatoire || ''}
                    onChange={(e) => handleChange('note_eliminatoire', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="Non définie"
                  />
                  <Form.Text className="text-muted">
                    Note en dessous de laquelle l'étudiant est éliminé
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre max de matières en dette</Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    max={10}
                    value={formData.nombre_matieres_dette_max}
                    onChange={(e) => handleChange('nombre_matieres_dette_max', parseInt(e.target.value))}
                  />
                  <Form.Text className="text-muted">
                    Nombre de matières {"<"} 10 autorisées
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </Accordion.Body>
        </Accordion.Item>

        {/* Crédits ECTS */}
        <Accordion.Item eventKey="2">
          <Accordion.Header>Crédits ECTS</Accordion.Header>
          <Accordion.Body>
            <Form.Group className="mb-3">
              <Form.Label>Crédits minimaux pour passage</Form.Label>
              <Form.Control
                type="number"
                min={0}
                max={60}
                value={formData.credits_min_passage || ''}
                onChange={(e) => handleChange('credits_min_passage', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Non défini"
              />
              <Form.Text className="text-muted">
                Nombre de crédits ECTS requis pour passer
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                id="validation_par_credits"
                label="Validation par crédits uniquement"
                checked={formData.validation_par_credits}
                onChange={(e) => handleChange('validation_par_credits', e.target.checked)}
              />
              <Form.Text className="text-muted">
                <InfoCircle className="me-1" />
                Ignorer la moyenne, valider uniquement par crédits acquis
              </Form.Text>
            </Form.Group>
          </Accordion.Body>
        </Accordion.Item>

        {/* Présence */}
        <Accordion.Item eventKey="3">
          <Accordion.Header>Présence</Accordion.Header>
          <Accordion.Body>
            <Form.Group className="mb-3">
              <Form.Label>Taux de présence minimal (%)</Form.Label>
              <Form.Control
                type="number"
                min={0}
                max={100}
                value={formData.taux_presence_min}
                onChange={(e) => handleChange('taux_presence_min', parseFloat(e.target.value))}
              />
              <Form.Text className="text-muted">
                Taux de présence requis pour valider
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                id="presence_obligatoire"
                label="Présence obligatoire pour validation"
                checked={formData.presence_obligatoire}
                onChange={(e) => handleChange('presence_obligatoire', e.target.checked)}
              />
            </Form.Group>
          </Accordion.Body>
        </Accordion.Item>

        {/* Rattrapage */}
        <Accordion.Item eventKey="4">
          <Accordion.Header>Rattrapage</Accordion.Header>
          <Accordion.Body>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                id="autoriser_rattrapage"
                label="Autoriser le rattrapage"
                checked={formData.autoriser_rattrapage}
                onChange={(e) => handleChange('autoriser_rattrapage', e.target.checked)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Nombre de sessions maximum</Form.Label>
              <Form.Control
                type="number"
                min={1}
                max={5}
                value={formData.nombre_sessions_max}
                onChange={(e) => handleChange('nombre_sessions_max', parseInt(e.target.value))}
                disabled={!formData.autoriser_rattrapage}
              />
              <Form.Text className="text-muted">
                Nombre de sessions d'examen (normale + rattrapages)
              </Form.Text>
            </Form.Group>
          </Accordion.Body>
        </Accordion.Item>

        {/* Règles spécifiques */}
        <Accordion.Item eventKey="5">
          <Accordion.Header>Règles spécifiques (optionnel)</Accordion.Header>
          <Accordion.Body>
            <Form.Group className="mb-3">
              <Form.Label>Règles spécifiques en JSON</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                value={formData.regles_specifiques || ''}
                onChange={(e) => handleChange('regles_specifiques', e.target.value)}
                placeholder='{"regle_exemple": "valeur"}'
                className="font-monospace"
              />
              <div className="d-flex justify-content-between align-items-center mt-2">
                <Form.Text className="text-muted">
                  Format JSON pour règles avancées
                </Form.Text>
                <div className="d-flex align-items-center">
                  {jsonValide === true && (
                    <span className="text-success me-2">
                      <CheckCircle className="me-1" /> JSON valide
                    </span>
                  )}
                  {jsonValide === false && (
                    <span className="text-danger me-2">
                      <XCircle className="me-1" /> JSON invalide
                    </span>
                  )}
                  <Button variant="outline-secondary" size="sm" onClick={validateJson}>
                    Valider JSON
                  </Button>
                </div>
              </div>
            </Form.Group>
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>

      <div className="d-flex justify-content-between mt-4">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          Annuler
        </Button>
        <div>
          {onDuplicate && (
            <Button 
              variant="outline-primary" 
              className="me-2" 
              onClick={onDuplicate}
              disabled={loading}
            >
              Dupliquer vers d'autres niveaux
            </Button>
          )}
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Enregistrement...
              </>
            ) : (
              'Enregistrer'
            )}
          </Button>
        </div>
      </div>
    </Form>
  );
};

export default FormConfigurationDeliberation;
