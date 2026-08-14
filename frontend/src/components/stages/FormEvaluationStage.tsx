import React, { useState } from 'react';
import { Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { Award, CheckCircle } from 'react-bootstrap-icons';
import { Stage } from '../../types/anneeAcademique';

interface FormEvaluationStageProps {
  stage: Stage;
  onSubmit: (data: { 
    note_entreprise?: number; 
    note_rapport?: number; 
    note_soutenance?: number;
    observations?: string;
  }) => Promise<void>;
  onCancel: () => void;
  onValider?: () => Promise<void>;
}

const FormEvaluationStage: React.FC<FormEvaluationStageProps> = ({
  stage,
  onSubmit,
  onCancel,
  onValider
}) => {
  const [noteEntreprise, setNoteEntreprise] = useState<number>(stage.note_entreprise || 0);
  const [noteRapport, setNoteRapport] = useState<number>(stage.note_rapport || 0);
  const [noteSoutenance, setNoteSoutenance] = useState<number>(stage.note_soutenance || 0);
  const [observations, setObservations] = useState<string>(stage.observations || '');
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const coefEntreprise = 0.3;
  const coefRapport = 0.3;
  const coefSoutenance = 0.4;

  const noteFinale = (
    noteEntreprise * coefEntreprise +
    noteRapport * coefRapport +
    noteSoutenance * coefSoutenance
  );

  const getNoteColor = (note: number) => {
    if (note >= 16) return 'success';
    if (note >= 14) return 'info';
    if (note >= 12) return 'primary';
    if (note >= 10) return 'warning';
    return 'danger';
  };

  const getMention = (note: number) => {
    if (note >= 16) return 'Très Bien';
    if (note >= 14) return 'Bien';
    if (note >= 12) return 'Assez Bien';
    if (note >= 10) return 'Passable';
    return 'Insuffisant';
  };

  const toutesNotesSaisies = noteEntreprise > 0 && noteRapport > 0 && noteSoutenance > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErreur(null);

    try {
      await onSubmit({
        note_entreprise: noteEntreprise,
        note_rapport: noteRapport,
        note_soutenance: noteSoutenance,
        observations
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
    coef: number,
    disabled: boolean = false
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
            disabled={disabled}
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
        disabled={disabled}
        className={`form-range-${getNoteColor(value)}`}
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
      {erreur && (
        <Alert variant="danger" dismissible onClose={() => setErreur(null)}>
          {erreur}
        </Alert>
      )}

      <Card className="mb-4">
        <Card.Header className="bg-white">
          <h5 className="mb-0">Notes</h5>
        </Card.Header>
        <Card.Body>
          {renderSlider(
            'Note entreprise',
            noteEntreprise,
            setNoteEntreprise,
            coefEntreprise
          )}

          {renderSlider(
            'Note rapport',
            noteRapport,
            setNoteRapport,
            coefRapport
          )}

          {renderSlider(
            'Note soutenance',
            noteSoutenance,
            setNoteSoutenance,
            coefSoutenance,
            !stage.note_soutenance && stage.statut !== 'termine'
          )}

          {!stage.note_soutenance && stage.statut !== 'termine' && (
            <Alert variant="info" className="mb-0">
              La note de soutenance sera disponible après la soutenance.
            </Alert>
          )}
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
          {toutesNotesSaisies && (
            <span className={`badge bg-${getNoteColor(noteFinale)} mt-2`}>
              {getMention(noteFinale)}
            </span>
          )}
        </Card.Body>
      </Card>

      <Form.Group className="mb-4">
        <Form.Label>Observations</Form.Label>
        <Form.Control
          as="textarea"
          rows={4}
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          placeholder="Ajoutez des observations sur le stage..."
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
              'Enregistrer'
            )}
          </Button>
          {onValider && toutesNotesSaisies && (
            <Button 
              variant="success" 
              onClick={handleValider} 
              disabled={loading}
            >
              <CheckCircle className="me-1" /> Valider le stage
            </Button>
          )}
        </div>
      </div>

      <style>{`
        .form-range-success::-webkit-slider-thumb { background-color: var(--bs-success); }
        .form-range-info::-webkit-slider-thumb { background-color: var(--bs-info); }
        .form-range-primary::-webkit-slider-thumb { background-color: var(--bs-primary); }
        .form-range-warning::-webkit-slider-thumb { background-color: var(--bs-warning); }
        .form-range-danger::-webkit-slider-thumb { background-color: var(--bs-danger); }
      `}</style>
    </Form>
  );
};

export default FormEvaluationStage;
