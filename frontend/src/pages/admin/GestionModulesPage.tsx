/**
 * Page de gestion des modules système.
 * Activation/désactivation des modules par université et année académique.
 */

import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Badge, Form, Alert, Modal } from 'react-bootstrap';
import { PageHeader } from '../../components/layouts';
import moduleSystemeService from '../../services/moduleSystemeService';
import type { ModuleSysteme } from '../../types/anneeAcademique';

const GestionModulesPage: React.FC = () => {
  const [modules, setModules] = useState<ModuleSysteme[]>([]);
  const [modulesActifs, setModulesActifs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filter, setFilter] = useState<'tous' | 'actifs' | 'inactifs'>('tous');
  
  // Modal configuration
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedModule, setSelectedModule] = useState<ModuleSysteme | null>(null);
  const [moduleConfig, setModuleConfig] = useState<Record<string, unknown>>({});

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    setLoading(true);
    setError(null);
    try {
      const [allModules, actifs] = await Promise.all([
        moduleSystemeService.getModulesSysteme(),
        moduleSystemeService.getModulesActifs(),
      ]);
      setModules(allModules);
      setModulesActifs(actifs.map(m => m.code));
    } catch (err) {
      console.error('Erreur lors du chargement des modules:', err);
      setError('Impossible de charger les modules.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleModule = async (module: ModuleSysteme) => {
    const isActif = modulesActifs.includes(module.code);
    
    try {
      if (isActif) {
        await moduleSystemeService.desactiverModule(module.code, {});
        setModulesActifs(prev => prev.filter(code => code !== module.code));
        setSuccess(`Module ${module.libelle} désactivé`);
      } else {
        await moduleSystemeService.activerModule(module.code, {});
        setModulesActifs(prev => [...prev, module.code]);
        setSuccess(`Module ${module.libelle} activé`);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la modification';
      setError(errorMessage);
    }
  };

  const handleConfigurer = (module: ModuleSysteme) => {
    setSelectedModule(module);
    setModuleConfig({});
    setShowConfigModal(true);
  };

  const handleSaveConfig = async () => {
    if (!selectedModule) return;
    
    try {
      await moduleSystemeService.activerModule(selectedModule.code, {
        configuration: moduleConfig,
      });
      setSuccess(`Configuration du module ${selectedModule.libelle} enregistrée`);
      setShowConfigModal(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la configuration';
      setError(errorMessage);
    }
  };

  const getModuleIcon = (icone?: string) => {
    return icone ? `bi bi-${icone}` : 'bi bi-box';
  };

  const filteredModules = modules.filter(module => {
    const isActif = modulesActifs.includes(module.code);
    if (filter === 'actifs') return isActif;
    if (filter === 'inactifs') return !isActif;
    return true;
  });

  const renderModuleCard = (module: ModuleSysteme) => {
    const isActif = modulesActifs.includes(module.code);
    
    return (
      <Col md={6} lg={4} key={module.id}>
        <Card className={`h-100 shadow-sm ${isActif ? 'border-success' : ''}`}>
          <Card.Body>
            <div className="d-flex align-items-start mb-3">
              <div 
                className={`rounded-circle p-3 me-3 ${isActif ? 'bg-success bg-opacity-10' : 'bg-secondary bg-opacity-10'}`}
              >
                <i className={`${getModuleIcon(module.icone)} fs-4 ${isActif ? 'text-success' : 'text-secondary'}`}></i>
              </div>
              <div className="flex-grow-1">
                <h5 className="mb-1">{module.libelle}</h5>
                <code className="text-muted small">{module.code}</code>
              </div>
              {module.est_obligatoire && (
                <Badge bg="warning" className="ms-2">Obligatoire</Badge>
              )}
            </div>
            
            <p className="text-muted small mb-3">
              {module.description || 'Aucune description disponible.'}
            </p>
            
            {module.dependances && module.dependances.length > 0 && (
              <div className="mb-3">
                <small className="text-muted">Dépendances:</small>
                <div className="d-flex flex-wrap gap-1 mt-1">
                  {module.dependances.map(dep => (
                    <Badge key={dep} bg="light" text="dark" className="fw-normal">
                      {dep}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            <div className="d-flex justify-content-between align-items-center">
              <Form.Check
                type="switch"
                id={`switch-${module.code}`}
                label={isActif ? 'Actif' : 'Inactif'}
                checked={isActif}
                onChange={() => handleToggleModule(module)}
                disabled={module.est_obligatoire && isActif}
              />
              
              <Button 
                size="sm" 
                variant="outline-primary"
                onClick={() => handleConfigurer(module)}
                disabled={!isActif}
              >
                <i className="bi bi-gear me-1"></i>
                Configurer
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Col>
    );
  };

  return (
    <div className="fade-in">
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      
      <PageHeader
        title="Gestion des Modules"
        subtitle="Activation et configuration des modules système"
        breadcrumbs={[
          { label: 'Administration', path: '/admin' },
          { label: 'Modules' }
        ]}
        actions={
          <Button variant="outline-secondary" onClick={loadModules}>
            <i className="bi bi-arrow-clockwise me-2"></i>
            Actualiser
          </Button>
        }
      />

      {/* Filtres */}
      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex gap-2">
            <Button
              variant={filter === 'tous' ? 'primary' : 'outline-primary'}
              size="sm"
              onClick={() => setFilter('tous')}
            >
              Tous ({modules.length})
            </Button>
            <Button
              variant={filter === 'actifs' ? 'success' : 'outline-success'}
              size="sm"
              onClick={() => setFilter('actifs')}
            >
              Actifs ({modulesActifs.length})
            </Button>
            <Button
              variant={filter === 'inactifs' ? 'secondary' : 'outline-secondary'}
              size="sm"
              onClick={() => setFilter('inactifs')}
            >
              Inactifs ({modules.length - modulesActifs.length})
            </Button>
          </div>
        </Card.Body>
      </Card>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      ) : (
        <Row className="g-4">
          {filteredModules.map(renderModuleCard)}
        </Row>
      )}

      {/* Modal Configuration */}
      <Modal show={showConfigModal} onHide={() => setShowConfigModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            Configurer {selectedModule?.libelle}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            <i className="bi bi-info-circle me-2"></i>
            La configuration spécifique de ce module sera disponible dans une version ultérieure.
          </Alert>
          
          <Form.Group className="mb-3">
            <Form.Label>Configuration JSON (avancé)</Form.Label>
            <Form.Control
              as="textarea"
              rows={5}
              value={JSON.stringify(moduleConfig, null, 2)}
              onChange={(e) => {
                try {
                  setModuleConfig(JSON.parse(e.target.value));
                } catch {
                  // Ignorer les erreurs de parsing
                }
              }}
              placeholder='{"option": "valeur"}'
            />
            <Form.Text className="text-muted">
              Configuration au format JSON pour les options avancées.
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfigModal(false)}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleSaveConfig}>
            <i className="bi bi-check-lg me-2"></i>
            Enregistrer
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default GestionModulesPage;
