import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Button, 
  Alert, 
  Form, 
  Card, 
  ProgressBar, 
  Table,
  Spinner,
  Badge
} from 'react-bootstrap';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  ArrowRepeat,
  Download,
  ExclamationTriangle
} from 'react-bootstrap-icons';
import { AnneeAcademique } from '../../types/anneeAcademique';

interface ElementReconduction {
  id: string;
  label: string;
  checked: boolean;
}

interface EtapeReconduction {
  id: string;
  label: string;
  statut: 'attente' | 'en_cours' | 'termine' | 'erreur';
  nombreCopie?: number;
  erreur?: string;
}

interface ModalOuvertureAnneeProps {
  show: boolean;
  onHide: () => void;
  annee: AnneeAcademique | null;
  onSuccess: () => void;
}

const ModalOuvertureAnnee: React.FC<ModalOuvertureAnneeProps> = ({
  show,
  onHide,
  annee,
  onSuccess
}) => {
  const [reconduire, setReconduire] = useState(false);
  const [elements, setElements] = useState<ElementReconduction[]>([
    { id: 'filieres', label: 'Filières et niveaux', checked: true },
    { id: 'modules', label: 'Modules pédagogiques', checked: true },
    { id: 'matieres', label: 'Matières', checked: true },
    { id: 'salles', label: 'Salles et bâtiments', checked: true },
    { id: 'creneaux', label: 'Créneaux horaires', checked: true },
    { id: 'frais', label: 'Frais de scolarité', checked: true },
    { id: 'types_frais', label: 'Types de frais', checked: true },
    { id: 'configurations', label: 'Configurations de délibération', checked: true }
  ]);
  const [enCours, setEnCours] = useState(false);
  const [termine, setTermine] = useState(false);
  const [progression, setProgression] = useState(0);
  const [etapes, setEtapes] = useState<EtapeReconduction[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (show) {
      resetState();
    }
  }, [show]);

  const resetState = () => {
    setReconduire(false);
    setEnCours(false);
    setTermine(false);
    setProgression(0);
    setEtapes([]);
    setErreur(null);
    setElements(elements.map(e => ({ ...e, checked: true })));
  };

  const handleElementChange = (id: string) => {
    setElements(elements.map(e => 
      e.id === id ? { ...e, checked: !e.checked } : e
    ));
  };

  const handleSelectAll = (selectAll: boolean) => {
    setElements(elements.map(e => ({ ...e, checked: selectAll })));
  };

  const allSelected = elements.every(e => e.checked);
  const noneSelected = elements.every(e => !e.checked);

  const handleOuvrir = () => {
    setShowConfirmation(true);
  };

  const confirmerOuverture = async () => {
    setShowConfirmation(false);
    setEnCours(true);
    setErreur(null);

    try {
      if (reconduire) {
        const elementsActifs = elements.filter(e => e.checked);
        const etapesInitiales: EtapeReconduction[] = elementsActifs.map(e => ({
          id: e.id,
          label: e.label,
          statut: 'attente'
        }));
        setEtapes(etapesInitiales);

        for (let i = 0; i < etapesInitiales.length; i++) {
          setEtapes(prev => prev.map((e, idx) => 
            idx === i ? { ...e, statut: 'en_cours' } : e
          ));
          setProgression(Math.round(((i + 0.5) / etapesInitiales.length) * 100));

          // Simuler l'appel API
          await new Promise(resolve => setTimeout(resolve, 500));

          const nombreCopie = Math.floor(Math.random() * 50) + 10;
          setEtapes(prev => prev.map((e, idx) => 
            idx === i ? { ...e, statut: 'termine', nombreCopie } : e
          ));
          setProgression(Math.round(((i + 1) / etapesInitiales.length) * 100));
        }
      }

      // Appel API pour ouvrir l'année
      // await anneeAcademiqueGestionService.ouvrirAnnee(annee!.id, { reconduire, elements: elements.filter(e => e.checked).map(e => e.id) });

      setTermine(true);
      setEnCours(false);
    } catch (error) {
      setErreur(error instanceof Error ? error.message : 'Erreur lors de l\'ouverture');
      setEnCours(false);
    }
  };

  const handleTerminer = () => {
    onSuccess();
    onHide();
  };

  const getStatutIcon = (statut: EtapeReconduction['statut']) => {
    switch (statut) {
      case 'attente':
        return <Clock className="text-secondary" />;
      case 'en_cours':
        return <Spinner animation="border" size="sm" className="text-primary" />;
      case 'termine':
        return <CheckCircle className="text-success" />;
      case 'erreur':
        return <XCircle className="text-danger" />;
    }
  };

  const totalCopie = etapes.reduce((sum, e) => sum + (e.nombreCopie || 0), 0);

  if (!annee) return null;

  return (
    <>
      <Modal show={show} onHide={onHide} size="lg" backdrop="static">
        <Modal.Header closeButton={!enCours}>
          <Modal.Title>Ouverture de l'année {annee.code}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {erreur && (
            <Alert variant="danger" dismissible onClose={() => setErreur(null)}>
              <ExclamationTriangle className="me-2" />
              {erreur}
            </Alert>
          )}

          {!enCours && !termine && (
            <>
              <Alert variant="info">
                <strong>Processus d'ouverture</strong>
                <p className="mb-0 mt-2">
                  L'ouverture de l'année académique permet d'activer les inscriptions 
                  et de commencer les activités pédagogiques. Vous pouvez optionnellement 
                  reconduire les données de l'année précédente.
                </p>
              </Alert>

              <Form.Check
                type="checkbox"
                id="reconduire"
                label="Reconduire le référentiel de l'année précédente"
                checked={reconduire}
                onChange={(e) => setReconduire(e.target.checked)}
                className="mb-3"
              />

              {reconduire && (
                <Card className="mb-3">
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <span>Éléments à reconduire</span>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => handleSelectAll(!allSelected)}
                    >
                      {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                    </Button>
                  </Card.Header>
                  <Card.Body>
                    <div className="row">
                      {elements.map(element => (
                        <div key={element.id} className="col-md-6 mb-2">
                          <Form.Check
                            type="checkbox"
                            id={element.id}
                            label={element.label}
                            checked={element.checked}
                            onChange={() => handleElementChange(element.id)}
                          />
                        </div>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              )}
            </>
          )}

          {enCours && (
            <>
              <div className="mb-4">
                <div className="d-flex justify-content-between mb-2">
                  <span>Progression</span>
                  <span>{progression}%</span>
                </div>
                <ProgressBar now={progression} animated striped />
              </div>

              <Card>
                <Card.Header>Étapes de reconduction</Card.Header>
                <Card.Body className="p-0">
                  <ul className="list-group list-group-flush">
                    {etapes.map(etape => (
                      <li 
                        key={etape.id} 
                        className="list-group-item d-flex justify-content-between align-items-center"
                      >
                        <div className="d-flex align-items-center">
                          {getStatutIcon(etape.statut)}
                          <span className="ms-2">{etape.label}</span>
                        </div>
                        {etape.nombreCopie !== undefined && (
                          <Badge bg="success">{etape.nombreCopie} copiés</Badge>
                        )}
                        {etape.erreur && (
                          <span className="text-danger small">{etape.erreur}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </Card.Body>
              </Card>
            </>
          )}

          {termine && (
            <>
              <Alert variant="success">
                <CheckCircle className="me-2" />
                <strong>Reconduction terminée avec succès !</strong>
                <p className="mb-0 mt-2">
                  L'année académique {annee.code} est maintenant ouverte.
                </p>
              </Alert>

              {etapes.length > 0 && (
                <Card className="mb-3">
                  <Card.Header>Récapitulatif de la reconduction</Card.Header>
                  <Card.Body className="p-0">
                    <Table responsive className="mb-0">
                      <thead>
                        <tr>
                          <th>Élément</th>
                          <th className="text-center">Nombre copié</th>
                          <th className="text-center">Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {etapes.map(etape => (
                          <tr key={etape.id}>
                            <td>{etape.label}</td>
                            <td className="text-center">{etape.nombreCopie || 0}</td>
                            <td className="text-center">
                              {getStatutIcon(etape.statut)}
                            </td>
                          </tr>
                        ))}
                        <tr className="table-light fw-bold">
                          <td>Total</td>
                          <td className="text-center">{totalCopie}</td>
                          <td></td>
                        </tr>
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              )}

              <Button variant="outline-secondary" size="sm">
                <Download className="me-1" /> Télécharger rapport détaillé
              </Button>
            </>
          )}
        </Modal.Body>

        <Modal.Footer>
          {!termine ? (
            <>
              <Button variant="secondary" onClick={onHide} disabled={enCours}>
                Annuler
              </Button>
              <Button 
                variant="primary" 
                onClick={handleOuvrir}
                disabled={enCours || (reconduire && noneSelected)}
              >
                {enCours ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Ouverture en cours...
                  </>
                ) : (
                  "Ouvrir l'année"
                )}
              </Button>
            </>
          ) : (
            <Button variant="primary" onClick={handleTerminer}>
              Terminer
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Modal de confirmation */}
      <Modal show={showConfirmation} onHide={() => setShowConfirmation(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Êtes-vous sûr de vouloir ouvrir l'année académique <strong>{annee.code}</strong> ?</p>
          {reconduire && (
            <Alert variant="info" className="mb-0">
              <ArrowRepeat className="me-2" />
              {elements.filter(e => e.checked).length} éléments seront reconduits de l'année précédente.
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmation(false)}>
            Annuler
          </Button>
          <Button variant="primary" onClick={confirmerOuverture}>
            Confirmer l'ouverture
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ModalOuvertureAnnee;
