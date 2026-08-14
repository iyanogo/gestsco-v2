import React, { useState } from 'react';
import { 
  Form, 
  Button, 
  Card, 
  Alert,
  Spinner,
  Row,
  Col
} from 'react-bootstrap';
import { Award, CheckCircle } from 'react-bootstrap-icons';
import { Soutenance } from '../../types/anneeAcademique';

interface FormEvaluationSoutenanceProps {
  soutenance: Soutenance;
  userRole: 'president' | 'rapporteur' | 'examinateur';
  etudiantNom?: string;
  theme?: string;
  onSubmit: (data: {
    note_presentation: number;
    note_defense: number;
    note_jury: number;
    appreciation: string;
    observations_jury?: string;
  }) => Promise<void>;
  onValider?: () => Promise<void>;
  onCancel: () => void;
}

const FormEvaluationSoutenance: React.FC<FormEvaluationSoutenanceProps> = ({
  soutenance,
  userRole,
  etudiantNom,
  theme,
  onSubmit,
  onValider,
  onCancel
}) => {
  const [notePresentation, setNotePresentation] = useState<number>(soutenance.note_presentation || 0);
  const [noteDefense, setNoteDefense] = useState<number>(soutenance.note_defense || 0);
  const [noteJury, setNoteJury] = useState<number>(soutenance.note_jury || 0);
  const [appreciation, setAppreciation] = useState<string>(soutenance.appreciation || '');
  const [observationsJury, setObservationsJury] = useState<string>(soutenance.observations_jury || '');
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const coefPresentation = 0.3;
  const coefDefense = 0.4;
  const coefJury = 0.3;

  const noteFinale = (
    notePresentation * coefPresentation +
    noteDefense * coefDefense +
    noteJury * coefJury
  );

  const getNoteColor = (note: number) => {
    if (note >= 16) return 'success';
    if (note >= 14) return 'info';
    if (note >= 12) return 'primary';
    if (note >= 10) return 'warning';
    return 'danger';
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      president: 'Président du jury',
      rapporteur: 'Rapporteur',
      examinateur: 'Examinateur'
    };
    return labels[role] || role;
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!appreciation) {
      setErreur('Veuillez sélectionner une appréciation');
      return;
    }

    setLoading(true);
    setErreur(null);

    try {
      await onSubmit({
        note_presentation: notePresentation,
        note_defense: noteDefense,
        note_jury: noteJury,
        appreciation,
        observations_jury: observationsJury
      });
    } catch (error) {
      setErreur(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleValider = async () => {
    if (!onValider) return;
    setLoading(true);
    setErreur(null);

    try {
      await onValider();
    } catch (error) {
      setErreur(error instanceof Error ? error.message : 'Erreur lors de la validation');
    } finally {
      setLoading(false);
    }
  };

  const renderSlider = (
    label: string,
    value: number,
    onChange: (val: number) => void,
    coef: number
  ) => (
    <Form.Group className="mb-4">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <Form.Label className="mb-0">
          {label} <small className="text-muted">({(coef * 100).toFixed(0)}%)</small>
        </Form.Label>
        <div className="d-flex align-items-center">
          <Form.Control
            type="number"
            min={0}
            max={20}
            step={0.25}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            style={{ width: 80 }}
            className="text-center"
          />
          <span className="ms-2">/20</span>
        </div>
      </div>
      <Form.Range
        min={0}
        max={20}
        step={0.25}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <div className="d-flex justify-content-between text-muted small">
        <span>0</span>
        <span>5</span>
        <span>10</span>
        <span>15</span>
        <span>20</span>
      </div>
    </Form.Group>
  );

  return (
    <Form onSubmit={handleSubmit}>
      <Alert variant="info" className="mb-4">
        <strong>Vous évaluez en tant que {getRoleLabel(userRole)}</strong>
      </Alert>

      {erreur && (
        <Alert variant="danger" dismissible onClose={() => setErreur(null)}>
          {erreur}
        </Alert>
      )}

      <Card className="mb-4 bg-light border-0">
        <Card.Header className="bg-transparent">Informations</Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <p className="mb-1"><strong>Étudiant :</strong> {etudiantNom || 'Non spécifié'}</p>
              <p className="mb-1"><strong>Thème :</strong> {theme || 'Non spécifié'}</p>
            </Col>
            <Col md={6}>
              <p className="mb-1"><strong>Date :</strong> {formatDateTime(soutenance.date_soutenance)}</p>
              <p className="mb-1"><strong>Lieu :</strong> {soutenance.lieu}</p>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header className="bg-white">
          <h5 className="mb-0">Évaluation</h5>
        </Card.Header>
        <Card.Body>
          {renderSlider('Note présentation', notePresentation, setNotePresentation, coefPresentation)}
          {renderSlider('Note défense', noteDefense, setNoteDefense, coefDefense)}
          {renderSlider('Note du jury', noteJury, setNoteJury, coefJury)}
        </Card.Body>
      </Card>

      {/* Note finale */}
      <Card className="mb-4 border-0 bg-light">
        <Card.Body className="text-center py-4">
          <div className="d-flex align-items-center justify-content-center mb-2">
            <Award className={`text-${getNoteColor(noteFinale)} me-2`} size={32} />
            <span className="text-muted">Note finale</span>
          </div>
          <div className={`display-4 fw-bold text-${getNoteColor(noteFinale)}`}>
            {noteFinale.toFixed(2)}/20
          </div>
        </Card.Body>
      </Card>

      <Form.Group className="mb-4">
        <Form.Label>Appréciation <span className="text-danger">*</span></Form.Label>
        <Form.Select
          value={appreciation}
          onChange={(e) => setAppreciation(e.target.value)}
          required
        >
          <option value="">Sélectionner une appréciation</option>
          <option value="excellent">Excellent</option>
          <option value="tres_bien">Très bien</option>
          <option value="bien">Bien</option>
          <option value="assez_bien">Assez bien</option>
          <option value="passable">Passable</option>
          <option value="insuffisant">Insuffisant</option>
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-4">
        <Form.Label>Observations du jury</Form.Label>
        <Form.Control
          as="textarea"
          rows={4}
          value={observationsJury}
          onChange={(e) => setObservationsJury(e.target.value)}
          placeholder="Observations, recommandations, points forts et points à améliorer..."
        />
      </Form.Group>

      <div className="d-flex justify-content-between">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          Annuler
        </Button>
        <div>
          <Button variant="primary" type="submit" disabled={loading} className="me-2">
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Enregistrement...
              </>
            ) : (
              "Enregistrer l'évaluation"
            )}
          </Button>
          {userRole === 'president' && onValider && (
            <Button 
              variant="success" 
              onClick={handleValider} 
              disabled={loading || !appreciation}
            >
              <CheckCircle className="me-1" /> Valider la soutenance
            </Button>
          )}
        </div>
      </div>
    </Form>
  );
};

export default FormEvaluationSoutenance;
