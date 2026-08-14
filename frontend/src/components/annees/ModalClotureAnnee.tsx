import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Button, 
  Alert, 
  Card, 
  Form,
  Spinner,
  ListGroup,
  Row,
  Col
} from 'react-bootstrap';
import { 
  CheckCircle, 
  XCircle, 
  ExclamationTriangle,
  People,
  Trophy,
  CurrencyDollar,
  Mortarboard,
  ListCheck
} from 'react-bootstrap-icons';
import { AnneeAcademique } from '../../types/anneeAcademique';

interface Verification {
  id: string;
  label: string;
  valide: boolean;
  detail?: string;
}

interface StatistiquesFinales {
  nbEtudiants: number;
  tauxReussite: number;
  montantFacture: number;
  montantPaye: number;
  nbDiplomes: number;
}

interface ModalClotureAnneeProps {
  show: boolean;
  onHide: () => void;
  annee: AnneeAcademique | null;
  onSuccess: () => void;
}

const ModalClotureAnnee: React.FC<ModalClotureAnneeProps> = ({
  show,
  onHide,
  annee,
  onSuccess
}) => {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [statistiques, setStatistiques] = useState<StatistiquesFinales | null>(null);
  const [loading, setLoading] = useState(true);
  const [rapportCloture, setRapportCloture] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [codeConfirmation, setCodeConfirmation] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (show && annee) {
      chargerDonnees();
    }
  }, [show, annee]);

  const chargerDonnees = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setVerifications([
        { id: 'semestre1', label: 'Semestre 1 clôturé', valide: true },
        { id: 'semestre2', label: 'Semestre 2 clôturé', valide: true },
        { id: 'deliberations', label: 'Toutes les délibérations validées', valide: true },
        { id: 'bulletins', label: 'Tous les bulletins générés', valide: true },
        { id: 'comptable', label: 'Période comptable clôturée', valide: false, detail: 'La période comptable est encore ouverte' }
      ]);

      setStatistiques({
        nbEtudiants: 1250,
        tauxReussite: 78.5,
        montantFacture: 125000000,
        montantPaye: 98750000,
        nbDiplomes: 320
      });
    } catch (error) {
      setErreur('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const toutesVerificationsValides = verifications.every(v => v.valide);

  const handleCloturer = () => {
    if (!rapportCloture.trim()) {
      setErreur('Le rapport de clôture est obligatoire');
      return;
    }
    setShowConfirmation(true);
    setCodeConfirmation('');
  };

  const confirmerCloture = async () => {
    if (codeConfirmation !== annee?.code) {
      setErreur('Le code saisi ne correspond pas');
      return;
    }

    setShowConfirmation(false);
    setEnCours(true);
    setErreur(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      onSuccess();
      onHide();
    } catch (error) {
      setErreur(error instanceof Error ? error.message : 'Erreur lors de la clôture');
      setEnCours(false);
    }
  };

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(montant);
  };

  const actions = [
    'Calcul des résultats annuels',
    'Application des compensations entre semestres',
    'Génération des bulletins annuels',
    'Clôture comptable de l\'année',
    'Archivage des données'
  ];

  if (!annee) return null;

  return (
    <>
      <Modal show={show} onHide={onHide} size="lg" backdrop="static">
        <Modal.Header closeButton={!enCours}>
          <Modal.Title>Clôture de l'année académique {annee.code}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {erreur && (
            <Alert variant="danger" dismissible onClose={() => setErreur(null)}>
              <ExclamationTriangle className="me-2" />
              {erreur}
            </Alert>
          )}

          <Alert variant="danger">
            <ExclamationTriangle className="me-2" />
            <strong>Attention !</strong> Cette action est irréversible et archive définitivement 
            l'année académique {annee.code}. Toutes les données seront figées.
          </Alert>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
              <p className="mt-2">Chargement des données...</p>
            </div>
          ) : (
            <>
              <Card className="mb-3">
                <Card.Header>
                  <ListCheck className="me-2" />
                  Vérifications préalables
                </Card.Header>
                <Card.Body className="p-0">
                  <ListGroup variant="flush">
                    {verifications.map(verif => (
                      <ListGroup.Item 
                        key={verif.id}
                        className="d-flex justify-content-between align-items-start"
                      >
                        <div className="d-flex align-items-center">
                          {verif.valide ? (
                            <CheckCircle className="text-success me-2" />
                          ) : (
                            <XCircle className="text-danger me-2" />
                          )}
                          <div>
                            <div>{verif.label}</div>
                            {verif.detail && (
                              <small className="text-danger">{verif.detail}</small>
                            )}
                          </div>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </Card.Body>
              </Card>

              {statistiques && (
                <Card className="mb-3">
                  <Card.Header>Statistiques finales</Card.Header>
                  <Card.Body>
                    <Row className="g-3">
                      <Col xs={6} md={4}>
                        <div className="text-center p-2 bg-light rounded">
                          <People className="text-primary mb-1" size={24} />
                          <div className="small text-muted">Étudiants</div>
                          <div className="fw-bold">{statistiques.nbEtudiants}</div>
                        </div>
                      </Col>
                      <Col xs={6} md={4}>
                        <div className="text-center p-2 bg-light rounded">
                          <Trophy className="text-success mb-1" size={24} />
                          <div className="small text-muted">Taux de réussite</div>
                          <div className="fw-bold">{statistiques.tauxReussite}%</div>
                        </div>
                      </Col>
                      <Col xs={6} md={4}>
                        <div className="text-center p-2 bg-light rounded">
                          <Mortarboard className="text-info mb-1" size={24} />
                          <div className="small text-muted">Diplômés</div>
                          <div className="fw-bold">{statistiques.nbDiplomes}</div>
                        </div>
                      </Col>
                      <Col xs={6} md={6}>
                        <div className="text-center p-2 bg-light rounded">
                          <CurrencyDollar className="text-warning mb-1" size={24} />
                          <div className="small text-muted">Montant facturé</div>
                          <div className="fw-bold">{formatMontant(statistiques.montantFacture)}</div>
                        </div>
                      </Col>
                      <Col xs={6} md={6}>
                        <div className="text-center p-2 bg-light rounded">
                          <CurrencyDollar className="text-success mb-1" size={24} />
                          <div className="small text-muted">Montant payé</div>
                          <div className="fw-bold">{formatMontant(statistiques.montantPaye)}</div>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              )}

              <Card className="mb-3">
                <Card.Header>Actions qui seront effectuées</Card.Header>
                <Card.Body className="p-0">
                  <ListGroup variant="flush">
                    {actions.map((action, index) => (
                      <ListGroup.Item key={index}>
                        <span className="badge bg-primary me-2">{index + 1}</span>
                        {action}
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </Card.Body>
              </Card>

              <Form.Group>
                <Form.Label>
                  Rapport de clôture <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={rapportCloture}
                  onChange={(e) => setRapportCloture(e.target.value)}
                  placeholder="Rédigez le rapport de clôture de l'année académique..."
                  required
                />
                <Form.Text className="text-muted">
                  Ce rapport sera archivé avec les données de l'année.
                </Form.Text>
              </Form.Group>
            </>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={enCours}>
            Annuler
          </Button>
          <Button 
            variant="danger" 
            onClick={handleCloturer}
            disabled={enCours || loading || !toutesVerificationsValides || !rapportCloture.trim()}
          >
            {enCours ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Clôture en cours...
              </>
            ) : (
              "Clôturer l'année"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showConfirmation} onHide={() => setShowConfirmation(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmation de clôture</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger">
            <ExclamationTriangle className="me-2" />
            Cette action est <strong>définitive et irréversible</strong>.
          </Alert>
          <p>
            Pour confirmer la clôture de l'année académique, veuillez saisir le code : 
            <strong> {annee.code}</strong>
          </p>
          <Form.Control
            type="text"
            value={codeConfirmation}
            onChange={(e) => setCodeConfirmation(e.target.value)}
            placeholder="Saisissez le code de l'année"
            autoFocus
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmation(false)}>
            Annuler
          </Button>
          <Button 
            variant="danger" 
            onClick={confirmerCloture}
            disabled={codeConfirmation !== annee.code}
          >
            Confirmer la clôture définitive
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ModalClotureAnnee;
