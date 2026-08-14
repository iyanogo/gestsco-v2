import React from 'react';
import { Modal, Button, Badge, Tab, Tabs, Row, Col, Card } from 'react-bootstrap';
import { 
  Calendar, 
  GeoAlt, 
  Clock, 
  Person, 
  Building, 
  FileEarmarkText,
  Download,
  Pencil,
  ClipboardCheck,
  Award
} from 'react-bootstrap-icons';
import { Soutenance, Stage } from '../../types/anneeAcademique';

interface Etudiant {
  id: number;
  nom: string;
  prenom: string;
  matricule: string;
  photo_url?: string;
}

interface Enseignant {
  id: number;
  nom: string;
  prenom: string;
}

interface ModalDetailsSoutenanceProps {
  show: boolean;
  onHide: () => void;
  soutenance: Soutenance | null;
  stage?: Stage;
  etudiant?: Etudiant;
  president?: Enseignant;
  rapporteur?: Enseignant;
  examinateur?: Enseignant;
  onEdit?: (soutenance: Soutenance) => void;
  onEvaluer?: (soutenance: Soutenance) => void;
  onGenererPV?: (soutenance: Soutenance) => void;
}

const ModalDetailsSoutenance: React.FC<ModalDetailsSoutenanceProps> = ({
  show,
  onHide,
  soutenance,
  stage,
  etudiant,
  president,
  rapporteur,
  examinateur,
  onEdit,
  onEvaluer,
  onGenererPV
}) => {
  if (!soutenance) return null;

  const getStatutBadge = (statut: string) => {
    const config: Record<string, { bg: string; text: string }> = {
      programmee: { bg: 'info', text: 'Programmée' },
      en_cours: { bg: 'warning', text: 'En cours' },
      terminee: { bg: 'success', text: 'Terminée' },
      validee: { bg: 'primary', text: 'Validée' }
    };
    const { bg, text } = config[statut] || { bg: 'secondary', text: statut };
    return <Badge bg={bg}>{text}</Badge>;
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getNoteColor = (note: number) => {
    if (note >= 16) return 'success';
    if (note >= 14) return 'info';
    if (note >= 12) return 'primary';
    if (note >= 10) return 'warning';
    return 'danger';
  };

  const canEdit = soutenance.statut === 'programmee';
  const canEvaluer = soutenance.statut === 'terminee';
  const canGenererPV = soutenance.statut === 'validee';

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center gap-2">
          Soutenance de stage
          {getStatutBadge(soutenance.statut)}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Tabs defaultActiveKey="informations" className="mb-3">
          <Tab eventKey="informations" title="Informations">
            <Row className="g-4">
              <Col md={6}>
                <Card className="h-100 border-0 bg-light">
                  <Card.Body>
                    <h6 className="text-muted mb-3">Étudiant</h6>
                    <div className="d-flex align-items-center">
                      {etudiant?.photo_url ? (
                        <img src={etudiant.photo_url} alt="" className="rounded-circle me-3" style={{ width: 50, height: 50, objectFit: 'cover' }} />
                      ) : (
                        <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3" style={{ width: 50, height: 50 }}>
                          {etudiant ? `${etudiant.prenom[0]}${etudiant.nom[0]}` : '?'}
                        </div>
                      )}
                      <div>
                        <div className="fw-bold">{etudiant ? `${etudiant.prenom} ${etudiant.nom}` : 'Non spécifié'}</div>
                        <small className="text-muted">{etudiant?.matricule}</small>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6}>
                <Card className="h-100 border-0 bg-light">
                  <Card.Body>
                    <h6 className="text-muted mb-3">Planification</h6>
                    <div className="mb-2"><Calendar className="me-2 text-primary" />{formatDateTime(soutenance.date_soutenance)}</div>
                    <div className="mb-2"><GeoAlt className="me-2 text-primary" />{soutenance.lieu}</div>
                    <div><Clock className="me-2 text-primary" />{soutenance.duree_minutes} minutes</div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={12}>
                <Card className="border-0 bg-light">
                  <Card.Body>
                    <h6 className="text-muted mb-3">Composition du jury</h6>
                    <Row>
                      <Col md={4}>
                        <div className="d-flex align-items-center">
                          <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2" style={{ width: 36, height: 36 }}>
                            <Person />
                          </div>
                          <div>
                            <small className="text-muted">Président</small>
                            <div className="fw-medium">{president ? `${president.prenom} ${president.nom}` : '-'}</div>
                          </div>
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="d-flex align-items-center">
                          <div className="rounded-circle bg-info text-white d-flex align-items-center justify-content-center me-2" style={{ width: 36, height: 36 }}>
                            <Person />
                          </div>
                          <div>
                            <small className="text-muted">Rapporteur</small>
                            <div className="fw-medium">{rapporteur ? `${rapporteur.prenom} ${rapporteur.nom}` : '-'}</div>
                          </div>
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="d-flex align-items-center">
                          <div className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-2" style={{ width: 36, height: 36 }}>
                            <Person />
                          </div>
                          <div>
                            <small className="text-muted">Examinateur</small>
                            <div className="fw-medium">{examinateur ? `${examinateur.prenom} ${examinateur.nom}` : '-'}</div>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Tab>

          <Tab eventKey="stage" title="Stage">
            {stage ? (
              <Row className="g-3">
                <Col md={6}>
                  <div className="mb-3">
                    <small className="text-muted">Thème</small>
                    <div className="fw-medium">{stage.theme}</div>
                  </div>
                  <div className="mb-3">
                    <small className="text-muted">Type de stage</small>
                    <div><Badge bg="info">{stage.type_stage}</Badge></div>
                  </div>
                  <div className="mb-3">
                    <small className="text-muted">Durée</small>
                    <div>{stage.duree_semaines} semaines</div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-3">
                    <small className="text-muted">Entreprise</small>
                    <div className="d-flex align-items-center"><Building className="me-2" />{stage.entreprise_nom}</div>
                  </div>
                  <div className="mb-3">
                    <small className="text-muted">Période</small>
                    <div>{formatDate(stage.date_debut)} - {formatDate(stage.date_fin)}</div>
                  </div>
                  <div className="mb-3">
                    <small className="text-muted">Maître de stage</small>
                    <div>{stage.maitre_stage_nom}</div>
                  </div>
                </Col>
              </Row>
            ) : (
              <p className="text-muted">Informations du stage non disponibles</p>
            )}
          </Tab>

          <Tab eventKey="evaluation" title="Évaluation" disabled={soutenance.statut === 'programmee'}>
            {soutenance.note_finale !== undefined && soutenance.note_finale !== null ? (
              <div className="text-center py-4">
                <Award className={`text-${getNoteColor(soutenance.note_finale)} mb-3`} size={48} />
                <div className={`display-4 fw-bold text-${getNoteColor(soutenance.note_finale)}`}>
                  {soutenance.note_finale.toFixed(2)}/20
                </div>
                {soutenance.appreciation && (
                  <Badge bg={getNoteColor(soutenance.note_finale)} className="mt-2 fs-6">{soutenance.appreciation}</Badge>
                )}
                {soutenance.mention && (
                  <div className="mt-2 text-muted">Mention : {soutenance.mention}</div>
                )}
                {soutenance.observations_jury && (
                  <Card className="mt-4 text-start">
                    <Card.Header className="bg-light">Observations du jury</Card.Header>
                    <Card.Body><p className="mb-0">{soutenance.observations_jury}</p></Card.Body>
                  </Card>
                )}
              </div>
            ) : (
              <p className="text-muted text-center py-4">Évaluation non encore effectuée</p>
            )}
          </Tab>

          <Tab eventKey="documents" title="Documents">
            <div className="d-flex flex-column gap-3">
              {stage?.rapport_url ? (
                <Card className="border">
                  <Card.Body className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      <FileEarmarkText className="text-primary me-3" size={24} />
                      <div>
                        <div className="fw-medium">Rapport de stage</div>
                        <small className="text-muted">Déposé le {stage.date_depot_rapport ? formatDate(stage.date_depot_rapport) : '-'}</small>
                      </div>
                    </div>
                    <Button variant="outline-primary" size="sm"><Download className="me-1" /> Télécharger</Button>
                  </Card.Body>
                </Card>
              ) : (
                <p className="text-muted">Rapport de stage non déposé</p>
              )}
              {soutenance.statut === 'validee' && (
                <Card className="border">
                  <Card.Body className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      <FileEarmarkText className="text-success me-3" size={24} />
                      <div>
                        <div className="fw-medium">Procès-verbal de soutenance</div>
                        <small className="text-muted">Généré automatiquement</small>
                      </div>
                    </div>
                    <Button variant="outline-success" size="sm"><Download className="me-1" /> Télécharger</Button>
                  </Card.Body>
                </Card>
              )}
            </div>
          </Tab>
        </Tabs>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Fermer</Button>
        {canEdit && onEdit && (
          <Button variant="outline-primary" onClick={() => onEdit(soutenance)}><Pencil className="me-1" /> Modifier</Button>
        )}
        {canEvaluer && onEvaluer && (
          <Button variant="success" onClick={() => onEvaluer(soutenance)}><ClipboardCheck className="me-1" /> Évaluer</Button>
        )}
        {canGenererPV && onGenererPV && (
          <Button variant="info" onClick={() => onGenererPV(soutenance)}><FileEarmarkText className="me-1" /> Générer PV</Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default ModalDetailsSoutenance;
