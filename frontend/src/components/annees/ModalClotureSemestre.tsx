import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Button, 
  Alert, 
  Card, 
  Form,
  Spinner,
  ListGroup
} from 'react-bootstrap';
import { 
  CheckCircle, 
  XCircle, 
  ExclamationTriangle,
  ListCheck
} from 'react-bootstrap-icons';
import { AnneeAcademique } from '../../types/anneeAcademique';

interface Verification {
  id: string;
  label: string;
  valide: boolean;
  detail?: string;
}

interface ModalClotureSemestreProps {
  show: boolean;
  onHide: () => void;
  annee: AnneeAcademique | null;
  semestre: number;
  onSuccess: () => void;
}

const ModalClotureSemestre: React.FC<ModalClotureSemestreProps> = ({
  show,
  onHide,
  annee,
  semestre,
  onSuccess
}) => {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [observations, setObservations] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [codeConfirmation, setCodeConfirmation] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (show && annee) {
      chargerVerifications();
    }
  }, [show, annee]);

  const chargerVerifications = async () => {
    setLoading(true);
    try {
      // Simuler l'appel API pour vérifier les prérequis
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setVerifications([
        { id: 'notes_saisies', label: 'Toutes les notes saisies', valide: true },
        { id: 'notes_validees', label: 'Toutes les notes validées', valide: true },
        { id: 'presences_saisies', label: 'Toutes les présences saisies', valide: false, detail: '3 séances sans présences' },
        { id: 'examens_termines', label: 'Tous les examens terminés', valide: true }
      ]);
    } catch (error) {
      setErreur('Erreur lors de la vérification des prérequis');
    } finally {
      setLoading(false);
    }
  };

  const toutesVerificationsValides = verifications.every(v => v.valide);

  const handleCloturer = () => {
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
      // Appel API pour clôturer le semestre
      // await anneeAcademiqueGestionService.cloturerSemestre(annee!.id, semestre, { observations });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      onSuccess();
      onHide();
    } catch (error) {
      setErreur(error instanceof Error ? error.message : 'Erreur lors de la clôture');
      setEnCours(false);
    }
  };

  const actions = [
    'Lancement des délibérations du semestre',
    'Calcul des résultats semestriels',
    'Génération des bulletins semestriels',
    semestre === 1 ? 'Passage au semestre 2' : 'Préparation de la clôture annuelle'
  ];

  if (!annee) return null;

  return (
    <>
      <Modal show={show} onHide={onHide} backdrop="static">
        <Modal.Header closeButton={!enCours}>
          <Modal.Title>Clôture du semestre {semestre}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {erreur && (
            <Alert variant="danger" dismissible onClose={() => setErreur(null)}>
              <ExclamationTriangle className="me-2" />
              {erreur}
            </Alert>
          )}

          <Alert variant="warning">
            <ExclamationTriangle className="me-2" />
            <strong>Attention !</strong> Cette action est irréversible. Le semestre {semestre} 
            de l'année {annee.code} sera définitivement clôturé.
          </Alert>

          <Card className="mb-3">
            <Card.Header>
              <ListCheck className="me-2" />
              Vérifications préalables
            </Card.Header>
            <Card.Body className="p-0">
              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" size="sm" className="me-2" />
                  Vérification en cours...
                </div>
              ) : (
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
              )}
            </Card.Body>
          </Card>

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
            <Form.Label>Observations (optionnel)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Ajoutez des observations sur cette clôture..."
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={enCours}>
            Annuler
          </Button>
          <Button 
            variant="danger" 
            onClick={handleCloturer}
            disabled={enCours || loading || !toutesVerificationsValides}
          >
            {enCours ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Clôture en cours...
              </>
            ) : (
              'Clôturer le semestre'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de confirmation avec saisie du code */}
      <Modal show={showConfirmation} onHide={() => setShowConfirmation(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmation de clôture</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Pour confirmer la clôture du semestre {semestre}, veuillez saisir le code 
            de l'année académique : <strong>{annee.code}</strong>
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
            Confirmer la clôture
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ModalClotureSemestre;
