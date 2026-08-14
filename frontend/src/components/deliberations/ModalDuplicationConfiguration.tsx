import React, { useState } from 'react';
import { Modal, Button, Form, Alert, ListGroup, Badge } from 'react-bootstrap';
import { ExclamationTriangle } from 'react-bootstrap-icons';

interface Niveau {
  id: number;
  code: string;
  libelle: string;
  cycle?: string;
  hasConfiguration?: boolean;
}

interface ConfigurationDeliberation {
  id: number;
  niveau_id?: number;
}

interface ModalDuplicationConfigurationProps {
  show: boolean;
  onHide: () => void;
  configurationSource: ConfigurationDeliberation;
  niveauSource?: Niveau;
  niveaux: Niveau[];
  onDuplicate: (niveauIds: number[]) => Promise<void>;
}

const ModalDuplicationConfiguration: React.FC<ModalDuplicationConfigurationProps> = ({
  show,
  onHide,
  niveauSource,
  niveaux,
  onDuplicate
}) => {
  const [selectedNiveaux, setSelectedNiveaux] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const niveauxParCycle = niveaux.reduce((acc, niveau) => {
    const cycle = niveau.cycle || 'Autre';
    if (!acc[cycle]) acc[cycle] = [];
    acc[cycle].push(niveau);
    return acc;
  }, {} as Record<string, Niveau[]>);

  const niveauxAvecConfig = niveaux.filter(n => n.hasConfiguration && selectedNiveaux.includes(n.id));

  const handleToggleNiveau = (niveauId: number) => {
    setSelectedNiveaux(prev => 
      prev.includes(niveauId) 
        ? prev.filter(id => id !== niveauId)
        : [...prev, niveauId]
    );
  };

  const handleSelectAllCycle = (cycle: string, select: boolean) => {
    const cycleNiveauIds = niveauxParCycle[cycle]
      .filter(n => n.id !== niveauSource?.id)
      .map(n => n.id);
    
    if (select) {
      setSelectedNiveaux(prev => [...new Set([...prev, ...cycleNiveauIds])]);
    } else {
      setSelectedNiveaux(prev => prev.filter(id => !cycleNiveauIds.includes(id)));
    }
  };

  const handleDuplicate = async () => {
    if (niveauxAvecConfig.length > 0) {
      setShowConfirmation(true);
      return;
    }
    await executeDuplication();
  };

  const executeDuplication = async () => {
    setShowConfirmation(false);
    setLoading(true);
    try {
      await onDuplicate(selectedNiveaux);
      onHide();
    } catch (error) {
      console.error('Erreur lors de la duplication:', error);
    } finally {
      setLoading(false);
    }
  };

  const allCycleSelected = (cycle: string) => {
    const cycleNiveaux = niveauxParCycle[cycle].filter(n => n.id !== niveauSource?.id);
    return cycleNiveaux.every(n => selectedNiveaux.includes(n.id));
  };

  return (
    <>
      <Modal show={show && !showConfirmation} onHide={onHide} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Dupliquer la configuration</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Alert variant="info" className="mb-4">
            <strong>Configuration source :</strong>{' '}
            {niveauSource ? niveauSource.libelle : 'Configuration globale'}
          </Alert>

          <Form.Label className="fw-bold mb-3">
            Sélectionnez les niveaux cibles :
          </Form.Label>

          {Object.entries(niveauxParCycle).map(([cycle, cycleNiveaux]) => (
            <div key={cycle} className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0">{cycle}</h6>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => handleSelectAllCycle(cycle, !allCycleSelected(cycle))}
                >
                  {allCycleSelected(cycle) ? 'Tout désélectionner' : 'Tout sélectionner'}
                </Button>
              </div>
              <ListGroup>
                {cycleNiveaux.map(niveau => {
                  const isSource = niveau.id === niveauSource?.id;
                  const isSelected = selectedNiveaux.includes(niveau.id);

                  return (
                    <ListGroup.Item
                      key={niveau.id}
                      className={`d-flex justify-content-between align-items-center ${isSource ? 'bg-light' : ''}`}
                    >
                      <Form.Check
                        type="checkbox"
                        id={`niveau-${niveau.id}`}
                        label={
                          <span>
                            {niveau.libelle}
                            <small className="text-muted ms-2">({niveau.code})</small>
                          </span>
                        }
                        checked={isSelected}
                        onChange={() => handleToggleNiveau(niveau.id)}
                        disabled={isSource}
                      />
                      <div>
                        {isSource && (
                          <Badge bg="primary" className="me-2">Source</Badge>
                        )}
                        {niveau.hasConfiguration && !isSource && (
                          <Badge bg="warning" text="dark">
                            <ExclamationTriangle className="me-1" />
                            Config existante
                          </Badge>
                        )}
                      </div>
                    </ListGroup.Item>
                  );
                })}
              </ListGroup>
            </div>
          ))}

          {niveauxAvecConfig.length > 0 && (
            <Alert variant="warning" className="mt-3">
              <ExclamationTriangle className="me-2" />
              <strong>Attention :</strong> Les niveaux suivants ont déjà une configuration 
              qui sera écrasée :
              <ul className="mb-0 mt-2">
                {niveauxAvecConfig.map(n => (
                  <li key={n.id}>{n.libelle}</li>
                ))}
              </ul>
            </Alert>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Annuler
          </Button>
          <Button 
            variant="primary" 
            onClick={handleDuplicate}
            disabled={loading || selectedNiveaux.length === 0}
          >
            {loading ? 'Duplication...' : `Dupliquer vers ${selectedNiveaux.length} niveau(x)`}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de confirmation */}
      <Modal show={showConfirmation} onHide={() => setShowConfirmation(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmer l'écrasement</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <ExclamationTriangle className="me-2" />
            <strong>{niveauxAvecConfig.length} niveau(x)</strong> ont déjà une configuration 
            qui sera écrasée par cette duplication.
          </Alert>
          <p>Êtes-vous sûr de vouloir continuer ?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmation(false)}>
            Annuler
          </Button>
          <Button variant="danger" onClick={executeDuplication}>
            Confirmer l'écrasement
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ModalDuplicationConfiguration;
