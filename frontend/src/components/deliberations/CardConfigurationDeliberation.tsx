import React from 'react';
import { Card, Badge, Button, Row, Col } from 'react-bootstrap';
import { 
  Pencil, 
  Trash, 
  CheckCircle, 
  XCircle,
  Calculator,
  Calendar,
  People,
  ClipboardCheck
} from 'react-bootstrap-icons';

interface ConfigurationDeliberation {
  id: number;
  periodicite: 'semestrielle' | 'annuelle';
  compensation_semestres: boolean;
  moyenne_validation: number;
  moyenne_passage_conditionnel?: number;
  note_eliminatoire?: number;
  nombre_matieres_dette_max?: number;
  credits_min_passage?: number;
  taux_presence_min?: number;
  autoriser_rattrapage: boolean;
  nombre_sessions_max: number;
}

interface Niveau {
  id: number;
  code: string;
  libelle: string;
}

interface CardConfigurationDeliberationProps {
  configuration: ConfigurationDeliberation;
  niveau?: Niveau;
  onEdit: (config: ConfigurationDeliberation) => void;
  onDelete: (configId: number) => void;
}

const CardConfigurationDeliberation: React.FC<CardConfigurationDeliberationProps> = ({
  configuration,
  niveau,
  onEdit,
  onDelete
}) => {
  const renderBooleanIcon = (value: boolean) => {
    return value ? (
      <CheckCircle className="text-success" />
    ) : (
      <XCircle className="text-danger" />
    );
  };

  return (
    <Card className="h-100 shadow-sm">
      <Card.Header className="bg-white d-flex justify-content-between align-items-center">
        <div>
          <h6 className="mb-0 fw-bold">
            {niveau ? niveau.libelle : 'Configuration globale'}
          </h6>
          {niveau && <small className="text-muted">{niveau.code}</small>}
        </div>
        <Badge bg={configuration.periodicite === 'semestrielle' ? 'primary' : 'info'}>
          {configuration.periodicite === 'semestrielle' ? 'Semestrielle' : 'Annuelle'}
        </Badge>
      </Card.Header>

      <Card.Body>
        <Row className="g-3">
          <Col xs={6}>
            <div className="d-flex align-items-center">
              <Calculator className="text-primary me-2" />
              <div>
                <div className="small text-muted">Moyenne validation</div>
                <div className="fw-bold">{configuration.moyenne_validation}/20</div>
              </div>
            </div>
          </Col>

          <Col xs={6}>
            <div className="d-flex align-items-center">
              <div className="me-2">{renderBooleanIcon(configuration.compensation_semestres)}</div>
              <div>
                <div className="small text-muted">Compensation</div>
                <div className="fw-bold">{configuration.compensation_semestres ? 'Oui' : 'Non'}</div>
              </div>
            </div>
          </Col>

          <Col xs={6}>
            <div className="d-flex align-items-center">
              <ClipboardCheck className="text-success me-2" />
              <div>
                <div className="small text-muted">Crédits min</div>
                <div className="fw-bold">
                  {configuration.credits_min_passage ?? '-'}
                </div>
              </div>
            </div>
          </Col>

          <Col xs={6}>
            <div className="d-flex align-items-center">
              <People className="text-info me-2" />
              <div>
                <div className="small text-muted">Présence min</div>
                <div className="fw-bold">
                  {configuration.taux_presence_min ? `${configuration.taux_presence_min}%` : '-'}
                </div>
              </div>
            </div>
          </Col>

          <Col xs={6}>
            <div className="d-flex align-items-center">
              <div className="me-2">{renderBooleanIcon(configuration.autoriser_rattrapage)}</div>
              <div>
                <div className="small text-muted">Rattrapage</div>
                <div className="fw-bold">{configuration.autoriser_rattrapage ? 'Oui' : 'Non'}</div>
              </div>
            </div>
          </Col>

          <Col xs={6}>
            <div className="d-flex align-items-center">
              <Calendar className="text-warning me-2" />
              <div>
                <div className="small text-muted">Sessions max</div>
                <div className="fw-bold">{configuration.nombre_sessions_max}</div>
              </div>
            </div>
          </Col>
        </Row>
      </Card.Body>

      <Card.Footer className="bg-white border-top d-flex justify-content-end gap-2">
        <Button
          variant="outline-primary"
          size="sm"
          onClick={() => onEdit(configuration)}
        >
          <Pencil className="me-1" /> Modifier
        </Button>
        <Button
          variant="outline-danger"
          size="sm"
          onClick={() => onDelete(configuration.id)}
        >
          <Trash className="me-1" /> Supprimer
        </Button>
      </Card.Footer>
    </Card>
  );
};

export default CardConfigurationDeliberation;
