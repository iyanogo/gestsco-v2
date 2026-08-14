/**
 * Page de gestion des années académiques.
 * Ouverture, clôture, reconduction du référentiel.
 */

import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Badge, Modal, Form, Alert, ProgressBar } from 'react-bootstrap';
import { PageHeader } from '../../components/layouts';
// import { StatCard } from '../../components/ui';
import { anneeAcademiqueService } from '../../services/anneeAcademiqueService';
import anneeAcademiqueGestionService from '../../services/anneeAcademiqueGestionService';
import type { AnneeAcademique, ElementsReconduction, RapportReconduction } from '../../types/anneeAcademique';

const GestionAnneesPage: React.FC = () => {
  const [annees, setAnnees] = useState<AnneeAcademique[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Modal ouverture
  const [showOuvrirModal, setShowOuvrirModal] = useState(false);
  const [selectedAnnee, setSelectedAnnee] = useState<AnneeAcademique | null>(null);
  const [reconduire, setReconduire] = useState(true);
  const [elements, setElements] = useState<ElementsReconduction>({
    filieres: true,
    modules: true,
    matieres: true,
    salles: false,
    creneaux: false,
    frais_scolarite: true,
    types_frais: true,
    configurations: true,
  });
  const [ouvertureEnCours, setOuvertureEnCours] = useState(false);
  const [progressOuverture, setProgressOuverture] = useState(0);
  const [, setRapportReconduction] = useState<RapportReconduction | null>(null);
  
  // Modal clôture semestre
  const [showCloturerSemestreModal, setShowCloturerSemestreModal] = useState(false);
  const [semestreACloturer, setSemestreACloturer] = useState<number>(1);

  useEffect(() => {
    loadAnnees();
  }, []);

  const loadAnnees = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await anneeAcademiqueService.getAnnees();
      setAnnees(data);
    } catch (err) {
      console.error('Erreur lors du chargement des années:', err);
      setError('Impossible de charger les années académiques.');
    } finally {
      setLoading(false);
    }
  };

  const getStatutBadge = (statut: string) => {
    const badges: Record<string, { bg: string; label: string }> = {
      brouillon: { bg: 'secondary', label: 'Brouillon' },
      ouverte: { bg: 'info', label: 'Ouverte' },
      en_cours: { bg: 'primary', label: 'En cours' },
      cloturee: { bg: 'success', label: 'Clôturée' },
      archivee: { bg: 'dark', label: 'Archivée' },
    };
    const badge = badges[statut] || { bg: 'secondary', label: statut };
    return <Badge bg={badge.bg}>{badge.label}</Badge>;
  };

  const handleOuvrirClick = (annee: AnneeAcademique) => {
    setSelectedAnnee(annee);
    setShowOuvrirModal(true);
    setRapportReconduction(null);
    setProgressOuverture(0);
  };

  const handleOuvrirAnnee = async () => {
    if (!selectedAnnee) return;
    
    setOuvertureEnCours(true);
    setProgressOuverture(10);
    
    try {
      setProgressOuverture(30);
      
      const result = await anneeAcademiqueGestionService.ouvrirAnnee(selectedAnnee.id, {
        reconduire,
        elements_a_reconduire: reconduire ? elements : undefined,
      });
      
      setProgressOuverture(100);
      setSuccess(result.message);
      setShowOuvrirModal(false);
      loadAnnees();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'ouverture';
      setError(errorMessage);
    } finally {
      setOuvertureEnCours(false);
    }
  };

  const handleCloturerSemestre = async () => {
    if (!selectedAnnee) return;
    
    try {
      const result = await anneeAcademiqueGestionService.cloturerSemestre(selectedAnnee.id, {
        semestre: semestreACloturer,
      });
      setSuccess(result.message);
      setShowCloturerSemestreModal(false);
      loadAnnees();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la clôture';
      setError(errorMessage);
    }
  };

  const handleCloturerAnnee = async (annee: AnneeAcademique) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir clôturer l'année ${annee.code} ?`)) return;
    
    try {
      const result = await anneeAcademiqueGestionService.cloturerAnnee(annee.id);
      setSuccess(result.message);
      loadAnnees();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la clôture';
      setError(errorMessage);
    }
  };

  const handleArchiverAnnee = async (annee: AnneeAcademique) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir archiver l'année ${annee.code} ?`)) return;
    
    try {
      const result = await anneeAcademiqueGestionService.archiverAnnee(annee.id);
      setSuccess(result.message);
      loadAnnees();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'archivage';
      setError(errorMessage);
    }
  };

  const renderAnneeCard = (annee: AnneeAcademique) => {
    const statut = (annee as unknown as { statut?: string }).statut || 'brouillon';
    
    return (
      <Col md={6} lg={4} key={annee.id}>
        <Card className="h-100 shadow-sm">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">{annee.code}</h5>
            {getStatutBadge(statut)}
          </Card.Header>
          <Card.Body>
            <p className="text-muted mb-2">{annee.libelle}</p>
            <div className="small text-muted mb-3">
              <div><strong>Début:</strong> {new Date(annee.date_debut).toLocaleDateString('fr-FR')}</div>
              <div><strong>Fin:</strong> {new Date(annee.date_fin).toLocaleDateString('fr-FR')}</div>
            </div>
            
            {annee.is_current && (
              <Badge bg="warning" className="mb-2">Année en cours</Badge>
            )}
          </Card.Body>
          <Card.Footer className="bg-transparent">
            <div className="d-flex gap-2 flex-wrap">
              {statut === 'brouillon' && (
                <Button 
                  size="sm" 
                  variant="success"
                  onClick={() => handleOuvrirClick(annee)}
                >
                  <i className="bi bi-play-fill me-1"></i>
                  Ouvrir
                </Button>
              )}
              
              {statut === 'ouverte' && (
                <Button 
                  size="sm" 
                  variant="warning"
                  onClick={() => {
                    setSelectedAnnee(annee);
                    setSemestreACloturer(1);
                    setShowCloturerSemestreModal(true);
                  }}
                >
                  <i className="bi bi-stop-fill me-1"></i>
                  Clôturer S1
                </Button>
              )}
              
              {statut === 'en_cours' && (
                <>
                  <Button 
                    size="sm" 
                    variant="warning"
                    onClick={() => {
                      setSelectedAnnee(annee);
                      setSemestreACloturer(2);
                      setShowCloturerSemestreModal(true);
                    }}
                  >
                    <i className="bi bi-stop-fill me-1"></i>
                    Clôturer S2
                  </Button>
                  <Button 
                    size="sm" 
                    variant="danger"
                    onClick={() => handleCloturerAnnee(annee)}
                  >
                    <i className="bi bi-lock-fill me-1"></i>
                    Clôturer
                  </Button>
                </>
              )}
              
              {statut === 'cloturee' && (
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={() => handleArchiverAnnee(annee)}
                >
                  <i className="bi bi-archive me-1"></i>
                  Archiver
                </Button>
              )}
              
              <Button 
                size="sm" 
                variant="outline-info"
                onClick={() => window.location.href = `/admin/annees/${annee.id}/rapport`}
              >
                <i className="bi bi-bar-chart me-1"></i>
                Rapport
              </Button>
            </div>
          </Card.Footer>
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
        title="Gestion des Années Académiques"
        subtitle="Ouverture, clôture et reconduction du référentiel"
        breadcrumbs={[
          { label: 'Administration', path: '/admin' },
          { label: 'Années Académiques' }
        ]}
        actions={
          <Button variant="outline-secondary" onClick={loadAnnees}>
            <i className="bi bi-arrow-clockwise me-2"></i>
            Actualiser
          </Button>
        }
      />

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      ) : (
        <Row className="g-4">
          {annees.map(renderAnneeCard)}
        </Row>
      )}

      {/* Modal Ouverture Année */}
      <Modal show={showOuvrirModal} onHide={() => setShowOuvrirModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Ouvrir l'année {selectedAnnee?.code}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {ouvertureEnCours ? (
            <div className="text-center py-4">
              <h5 className="mb-3">Ouverture en cours...</h5>
              <ProgressBar 
                now={progressOuverture} 
                label={`${progressOuverture}%`}
                animated 
                striped 
              />
              <p className="text-muted mt-3">
                Veuillez patienter pendant l'ouverture de l'année académique.
              </p>
            </div>
          ) : (
            <>
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
                  <Card.Header>Éléments à reconduire</Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={6}>
                        <Form.Check
                          type="checkbox"
                          id="filieres"
                          label="Filières"
                          checked={elements.filieres}
                          onChange={(e) => setElements({ ...elements, filieres: e.target.checked })}
                        />
                        <Form.Check
                          type="checkbox"
                          id="modules"
                          label="Modules"
                          checked={elements.modules}
                          onChange={(e) => setElements({ ...elements, modules: e.target.checked })}
                        />
                        <Form.Check
                          type="checkbox"
                          id="matieres"
                          label="Matières"
                          checked={elements.matieres}
                          onChange={(e) => setElements({ ...elements, matieres: e.target.checked })}
                        />
                        <Form.Check
                          type="checkbox"
                          id="salles"
                          label="Salles"
                          checked={elements.salles}
                          onChange={(e) => setElements({ ...elements, salles: e.target.checked })}
                        />
                      </Col>
                      <Col md={6}>
                        <Form.Check
                          type="checkbox"
                          id="creneaux"
                          label="Créneaux horaires"
                          checked={elements.creneaux}
                          onChange={(e) => setElements({ ...elements, creneaux: e.target.checked })}
                        />
                        <Form.Check
                          type="checkbox"
                          id="frais_scolarite"
                          label="Frais de scolarité"
                          checked={elements.frais_scolarite}
                          onChange={(e) => setElements({ ...elements, frais_scolarite: e.target.checked })}
                        />
                        <Form.Check
                          type="checkbox"
                          id="types_frais"
                          label="Types de frais"
                          checked={elements.types_frais}
                          onChange={(e) => setElements({ ...elements, types_frais: e.target.checked })}
                        />
                        <Form.Check
                          type="checkbox"
                          id="configurations"
                          label="Configurations"
                          checked={elements.configurations}
                          onChange={(e) => setElements({ ...elements, configurations: e.target.checked })}
                        />
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              )}
              
              <Alert variant="warning">
                <i className="bi bi-exclamation-triangle me-2"></i>
                <strong>Attention :</strong> Cette action va ouvrir l'année académique et la rendre active.
                Assurez-vous que toutes les configurations sont correctes.
              </Alert>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowOuvrirModal(false)} disabled={ouvertureEnCours}>
            Annuler
          </Button>
          <Button variant="success" onClick={handleOuvrirAnnee} disabled={ouvertureEnCours}>
            <i className="bi bi-play-fill me-2"></i>
            Ouvrir l'année
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Clôture Semestre */}
      <Modal show={showCloturerSemestreModal} onHide={() => setShowCloturerSemestreModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            Clôturer le semestre {semestreACloturer}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            <i className="bi bi-info-circle me-2"></i>
            La clôture du semestre va :
            <ul className="mb-0 mt-2">
              <li>Vérifier que toutes les notes sont saisies</li>
              <li>Lancer les délibérations</li>
              <li>Calculer les résultats semestriels</li>
              <li>Passer au semestre suivant</li>
            </ul>
          </Alert>
          
          <Alert variant="warning">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Cette action est irréversible.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCloturerSemestreModal(false)}>
            Annuler
          </Button>
          <Button variant="warning" onClick={handleCloturerSemestre}>
            <i className="bi bi-stop-fill me-2"></i>
            Clôturer le semestre
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default GestionAnneesPage;
