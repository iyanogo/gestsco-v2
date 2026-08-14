import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { InfoCircle } from 'react-bootstrap-icons';
import { ModuleSysteme } from '../../types/anneeAcademique';

interface ConfigurationFinances {
  facturation_automatique: boolean;
  relances_automatiques: boolean;
  delai_relance_jours: number;
  devise: string;
}

interface ConfigurationEvaluations {
  saisie_enseignants: boolean;
  note_maximale: number;
  anonymat: boolean;
}

interface ConfigurationEmploiTemps {
  verifier_conflits_salles: boolean;
  verifier_conflits_enseignants: boolean;
  duree_seance_defaut: number;
}

interface ConfigurationStages {
  duree_minimale_semaines: number;
  soutenance_obligatoire: boolean;
  note_minimale_validation: number;
}

type ModuleConfiguration = 
  | ConfigurationFinances 
  | ConfigurationEvaluations 
  | ConfigurationEmploiTemps 
  | ConfigurationStages
  | Record<string, unknown>;

interface ModalConfigurationModuleProps {
  show: boolean;
  onHide: () => void;
  module: ModuleSysteme | null;
  configuration: ModuleConfiguration | null;
  onSave: (moduleId: number, config: ModuleConfiguration) => Promise<void>;
}

const ModalConfigurationModule: React.FC<ModalConfigurationModuleProps> = ({
  show,
  onHide,
  module,
  configuration,
  onSave
}) => {
  const [config, setConfig] = useState<ModuleConfiguration>({});
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (module && configuration) {
      setConfig(configuration);
    } else if (module) {
      setConfig(getDefaultConfiguration(module.code));
    }
  }, [module, configuration]);

  const getDefaultConfiguration = (code: string): ModuleConfiguration => {
    switch (code) {
      case 'FINANCES':
        return {
          facturation_automatique: false,
          relances_automatiques: false,
          delai_relance_jours: 30,
          devise: 'XOF'
        };
      case 'EVALUATIONS':
        return {
          saisie_enseignants: true,
          note_maximale: 20,
          anonymat: false
        };
      case 'EMPLOI_TEMPS':
        return {
          verifier_conflits_salles: true,
          verifier_conflits_enseignants: true,
          duree_seance_defaut: 120
        };
      case 'STAGES':
        return {
          duree_minimale_semaines: 4,
          soutenance_obligatoire: true,
          note_minimale_validation: 10
        };
      default:
        return {};
    }
  };

  const handleChange = (key: string, value: unknown) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!module) return;

    setLoading(true);
    setErreur(null);

    try {
      await onSave(module.id, config);
      onHide();
    } catch (error) {
      setErreur(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const renderConfigurationForm = () => {
    if (!module) return null;

    switch (module.code) {
      case 'FINANCES':
        const finConfig = config as ConfigurationFinances;
        return (
          <>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                id="facturation_automatique"
                label="Activer la facturation automatique"
                checked={finConfig.facturation_automatique || false}
                onChange={(e) => handleChange('facturation_automatique', e.target.checked)}
              />
              <Form.Text className="text-muted">
                <InfoCircle className="me-1" />
                Génère automatiquement les factures lors de l'inscription
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                id="relances_automatiques"
                label="Activer les relances automatiques"
                checked={finConfig.relances_automatiques || false}
                onChange={(e) => handleChange('relances_automatiques', e.target.checked)}
              />
              <Form.Text className="text-muted">
                <InfoCircle className="me-1" />
                Envoie des rappels automatiques pour les factures impayées
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Délai de relance (jours)</Form.Label>
              <Form.Control
                type="number"
                min={1}
                max={90}
                value={finConfig.delai_relance_jours || 30}
                onChange={(e) => handleChange('delai_relance_jours', parseInt(e.target.value))}
              />
              <Form.Text className="text-muted">
                Nombre de jours après l'échéance avant d'envoyer une relance
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Devise par défaut</Form.Label>
              <Form.Select
                value={finConfig.devise || 'XOF'}
                onChange={(e) => handleChange('devise', e.target.value)}
              >
                <option value="XOF">Franc CFA (XOF)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="USD">Dollar US (USD)</option>
              </Form.Select>
            </Form.Group>
          </>
        );

      case 'EVALUATIONS':
        const evalConfig = config as ConfigurationEvaluations;
        return (
          <>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                id="saisie_enseignants"
                label="Autoriser la saisie de notes par les enseignants"
                checked={evalConfig.saisie_enseignants ?? true}
                onChange={(e) => handleChange('saisie_enseignants', e.target.checked)}
              />
              <Form.Text className="text-muted">
                <InfoCircle className="me-1" />
                Permet aux enseignants de saisir directement les notes
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Note maximale</Form.Label>
              <Form.Control
                type="number"
                min={10}
                max={100}
                value={evalConfig.note_maximale || 20}
                onChange={(e) => handleChange('note_maximale', parseInt(e.target.value))}
              />
              <Form.Text className="text-muted">
                Note maximale pour les évaluations (généralement 20)
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                id="anonymat"
                label="Activer l'anonymat des copies"
                checked={evalConfig.anonymat || false}
                onChange={(e) => handleChange('anonymat', e.target.checked)}
              />
              <Form.Text className="text-muted">
                <InfoCircle className="me-1" />
                Masque l'identité des étudiants lors de la correction
              </Form.Text>
            </Form.Group>
          </>
        );

      case 'EMPLOI_TEMPS':
        const etConfig = config as ConfigurationEmploiTemps;
        return (
          <>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                id="verifier_conflits_salles"
                label="Vérifier les conflits de salles"
                checked={etConfig.verifier_conflits_salles ?? true}
                onChange={(e) => handleChange('verifier_conflits_salles', e.target.checked)}
              />
              <Form.Text className="text-muted">
                <InfoCircle className="me-1" />
                Empêche la double réservation d'une salle
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                id="verifier_conflits_enseignants"
                label="Vérifier les conflits d'enseignants"
                checked={etConfig.verifier_conflits_enseignants ?? true}
                onChange={(e) => handleChange('verifier_conflits_enseignants', e.target.checked)}
              />
              <Form.Text className="text-muted">
                <InfoCircle className="me-1" />
                Empêche l'affectation d'un enseignant à deux cours simultanés
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Durée par défaut d'une séance (minutes)</Form.Label>
              <Form.Control
                type="number"
                min={30}
                max={240}
                step={15}
                value={etConfig.duree_seance_defaut || 120}
                onChange={(e) => handleChange('duree_seance_defaut', parseInt(e.target.value))}
              />
            </Form.Group>
          </>
        );

      case 'STAGES':
        const stageConfig = config as ConfigurationStages;
        return (
          <>
            <Form.Group className="mb-3">
              <Form.Label>Durée minimale du stage (semaines)</Form.Label>
              <Form.Control
                type="number"
                min={1}
                max={52}
                value={stageConfig.duree_minimale_semaines || 4}
                onChange={(e) => handleChange('duree_minimale_semaines', parseInt(e.target.value))}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                id="soutenance_obligatoire"
                label="Soutenance obligatoire"
                checked={stageConfig.soutenance_obligatoire ?? true}
                onChange={(e) => handleChange('soutenance_obligatoire', e.target.checked)}
              />
              <Form.Text className="text-muted">
                <InfoCircle className="me-1" />
                Exige une soutenance pour valider le stage
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Note minimale de validation</Form.Label>
              <Form.Control
                type="number"
                min={0}
                max={20}
                step={0.5}
                value={stageConfig.note_minimale_validation || 10}
                onChange={(e) => handleChange('note_minimale_validation', parseFloat(e.target.value))}
              />
            </Form.Group>
          </>
        );

      default:
        return (
          <Alert variant="info">
            Aucune configuration spécifique disponible pour ce module.
          </Alert>
        );
    }
  };

  if (!module) return null;

  return (
    <Modal show={show} onHide={onHide} backdrop="static">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Configuration du module {module.libelle}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {erreur && (
            <Alert variant="danger" dismissible onClose={() => setErreur(null)}>
              {erreur}
            </Alert>
          )}

          {renderConfigurationForm()}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Annuler
          </Button>
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
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ModalConfigurationModule;
