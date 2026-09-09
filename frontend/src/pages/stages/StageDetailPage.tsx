/**
 * Page de détail d'un stage.
 * Informations enrichies, évaluation, soutenance et génération PV.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Button, Badge, Tab, Tabs, Form, Alert, Modal, InputGroup, Spinner } from 'react-bootstrap';
import { PageHeader } from '../../components/layouts';
import stageService from '../../services/stageService';
import soutenanceService from '../../services/soutenanceService';
import { getEtudiantById } from '../../services/etudiantService';
import { getNiveaux } from '../../services/niveauService';
import { getMatieres } from '../../services/matiereService';
import { getUsersForSelect } from '../../services/userService';
import { handleApiError } from '../../utils/errorHandler';
import type { Stage, Soutenance, ValiderStageRequest, CreateSoutenance } from '../../types/anneeAcademique';
import { TYPES_STAGE, STATUTS_STAGE, STATUTS_SOUTENANCE } from '../../types/anneeAcademique';
import type { User } from '../../types/auth';

const JURY_ROLES = new Set(['enseignant', 'teacher', 'admin', 'administrateur', 'scolarite', 'superuser']);

const formatUserLabel = (user: User): string => {
  if (user.full_name?.trim()) return user.full_name.trim();
  return user.email;
};

const apiBaseUrl = import.meta.env.VITE_API_URL || '';

const StageDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage | null>(null);
  const [soutenance, setSoutenance] = useState<Soutenance | null>(null);
  const [juryUsers, setJuryUsers] = useState<User[]>([]);
  const [etudiantLabel, setEtudiantLabel] = useState('-');
  const [etudiantMatricule, setEtudiantMatricule] = useState<string | null>(null);
  const [niveauLabel, setNiveauLabel] = useState('-');
  const [matiereLabel, setMatiereLabel] = useState('-');
  const [encadrantLabel, setEncadrantLabel] = useState('-');
  const [loading, setLoading] = useState(true);
  const [generatingPv, setGeneratingPv] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showEvalModal, setShowEvalModal] = useState(false);
  const [evalData, setEvalData] = useState<ValiderStageRequest>({
    note_entreprise: 0,
    note_rapport: 0,
    observations: '',
  });

  const [showSoutenanceModal, setShowSoutenanceModal] = useState(false);
  const [soutenanceData, setSoutenanceData] = useState<Partial<CreateSoutenance>>({
    date_soutenance: '',
    lieu: '',
    president_jury_id: undefined,
    rapporteur_id: undefined,
    examinateur_id: undefined,
    duree_minutes: 30,
  });

  const userLabelById = useMemo(() => {
    const map = new Map<number, string>();
    juryUsers.forEach((u) => map.set(u.id, formatUserLabel(u)));
    return map;
  }, [juryUsers]);

  const getJuryLabel = useCallback(
    (userId?: number | null) => {
      if (!userId) return '-';
      return userLabelById.get(userId) || `Utilisateur #${userId}`;
    },
    [userLabelById]
  );

  const loadStage = useCallback(async (stageId: number) => {
    setLoading(true);
    setError(null);
    setSoutenance(null);

    try {
      const [data, soutenances, niveaux, matieres, users] = await Promise.all([
        stageService.getStageById(stageId),
        soutenanceService.getSoutenances(),
        getNiveaux(),
        getMatieres({ limit: 500 }),
        getUsersForSelect({
          roles: ['enseignant', 'teacher', 'admin', 'administrateur', 'scolarite'],
          limit: 300,
        }),
      ]);

      setStage(data);

      const jury = users.filter((u) => u.role && JURY_ROLES.has(u.role));
      setJuryUsers(jury);

      const soutenanceStage = soutenances.find((s) => s.stage_id === stageId) ?? null;
      setSoutenance(soutenanceStage);

      try {
        const etudiant = await getEtudiantById(data.etudiant_id);
        setEtudiantLabel(`${etudiant.prenom} ${etudiant.nom}`);
        setEtudiantMatricule(etudiant.matricule ?? null);
      } catch {
        setEtudiantLabel(`Étudiant #${data.etudiant_id}`);
        setEtudiantMatricule(null);
      }

      const niveau = niveaux.find((n) => n.id === data.niveau_id);
      setNiveauLabel(niveau?.libelle || niveau?.code || `#${data.niveau_id}`);

      const matiere = matieres.find((m) => m.id === data.matiere_id);
      setMatiereLabel(matiere ? `${matiere.code} - ${matiere.libelle}` : `#${data.matiere_id}`);

      if (data.encadrant_academique_id) {
        const encadrant = users.find((u) => u.id === data.encadrant_academique_id);
        setEncadrantLabel(encadrant ? formatUserLabel(encadrant) : `#${data.encadrant_academique_id}`);
      } else {
        setEncadrantLabel('-');
      }
    } catch (err) {
      console.error('Erreur lors du chargement du stage:', err);
      setError('Impossible de charger les détails du stage.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      loadStage(Number(id));
    }
  }, [id, loadStage]);

  const handleTerminer = async () => {
    if (!stage) return;
    try {
      await stageService.terminerStage(stage.id);
      setSuccess('Stage marqué comme terminé.');
      loadStage(stage.id);
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const handleValider = async () => {
    if (!stage) return;
    try {
      await stageService.validerStage(stage.id, evalData);
      setSuccess('Stage validé avec succès.');
      setShowEvalModal(false);
      loadStage(stage.id);
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const handleProgrammerSoutenance = async () => {
    if (!stage) return;
    if (!soutenanceData.president_jury_id || !soutenanceData.rapporteur_id) {
      setError('Veuillez sélectionner le président et le rapporteur du jury.');
      return;
    }
    try {
      const payload: CreateSoutenance = {
        stage_id: stage.id,
        date_soutenance: soutenanceData.date_soutenance!,
        lieu: soutenanceData.lieu!,
        president_jury_id: soutenanceData.president_jury_id,
        rapporteur_id: soutenanceData.rapporteur_id,
        duree_minutes: soutenanceData.duree_minutes,
        examinateur_id: soutenanceData.examinateur_id || undefined,
      };
      await soutenanceService.createSoutenance(payload);
      setSuccess('Soutenance programmée avec succès.');
      setShowSoutenanceModal(false);
      loadStage(stage.id);
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const handleGenererPv = async () => {
    if (!soutenance || !stage) return;
    setGeneratingPv(true);
    setError(null);
    try {
      const result = await soutenanceService.genererPV(soutenance.id);
      setSuccess('Procès-verbal généré avec succès.');
      setSoutenance((prev) =>
        prev ? { ...prev, proces_verbal_url: result.pv_url, statut: 'validee' } : prev
      );
      loadStage(stage.id);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setGeneratingPv(false);
    }
  };

  const pvHref = soutenance?.proces_verbal_url
    ? `${apiBaseUrl}${soutenance.proces_verbal_url}`
    : null;

  const getStatutBadge = (statut: string) => {
    const statutInfo = STATUTS_STAGE.find((s) => s.value === statut);
    const colors: Record<string, string> = {
      info: 'info',
      warning: 'warning',
      success: 'success',
      error: 'danger',
    };
    return (
      <Badge bg={colors[statutInfo?.color || 'secondary'] || 'secondary'}>
        {statutInfo?.label || statut}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (!stage) {
    return <Alert variant="danger">Stage non trouvé.</Alert>;
  }

  const typeInfo = TYPES_STAGE.find((t) => t.value === stage.type_stage);
  const canGeneratePv = soutenance?.statut === 'validee' || soutenance?.note_finale != null;

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
        title={`Stage ${stage.code}`}
        subtitle={stage.theme}
        breadcrumbs={[
          { label: 'Stages', path: '/admin/stages' },
          { label: stage.code },
        ]}
        actions={
          <div className="d-flex gap-2 flex-wrap">
            {stage.statut === 'en_cours' && (
              <Button variant="warning" onClick={handleTerminer}>
                <i className="bi bi-check-circle me-2"></i>
                Terminer
              </Button>
            )}
            {stage.statut === 'termine' && !soutenance && (
              <Button variant="primary" onClick={() => setShowSoutenanceModal(true)}>
                <i className="bi bi-calendar-plus me-2"></i>
                Programmer soutenance
              </Button>
            )}
            {soutenance && canGeneratePv && (
              pvHref ? (
                <Button variant="success" href={pvHref} target="_blank" rel="noreferrer">
                  <i className="bi bi-file-earmark-pdf me-2"></i>
                  Télécharger le PV
                </Button>
              ) : (
                <Button variant="success" onClick={handleGenererPv} disabled={generatingPv}>
                  {generatingPv ? (
                    <Spinner animation="border" size="sm" className="me-2" />
                  ) : (
                    <i className="bi bi-file-earmark-plus me-2"></i>
                  )}
                  Générer le PV
                </Button>
              )
            )}
            <Button variant="outline-secondary" onClick={() => navigate('/admin/stages')}>
              <i className="bi bi-arrow-left me-2"></i>
              Retour
            </Button>
          </div>
        }
      />

      <Card className="mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={8}>
              <div className="d-flex align-items-center gap-3 flex-wrap">
                {getStatutBadge(stage.statut)}
                <Badge bg="light" text="dark">{typeInfo?.label}</Badge>
                <span className="text-muted">{stage.duree_semaines} semaines</span>
              </div>
            </Col>
            <Col md={4} className="text-md-end mt-2 mt-md-0">
              {stage.note_finale != null && (
                <div>
                  <span className="text-muted me-2">Note finale:</span>
                  <Badge bg={Number(stage.note_finale) >= 10 ? 'success' : 'danger'} className="fs-5">
                    {stage.note_finale}/20
                  </Badge>
                </div>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Tabs defaultActiveKey="informations" className="mb-4">
        <Tab eventKey="informations" title="Informations">
          <Row className="g-4">
            <Col md={6}>
              <Card className="h-100">
                <Card.Header>
                  <i className="bi bi-person me-2"></i>
                  Étudiant
                </Card.Header>
                <Card.Body>
                  <p className="mb-1"><strong>{etudiantLabel}</strong></p>
                  {etudiantMatricule && (
                    <p className="mb-1"><code>{etudiantMatricule}</code></p>
                  )}
                  <p className="mb-1"><strong>Niveau:</strong> {niveauLabel}</p>
                  <p className="mb-0"><strong>Matière:</strong> {matiereLabel}</p>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="h-100">
                <Card.Header>
                  <i className="bi bi-building me-2"></i>
                  Entreprise
                </Card.Header>
                <Card.Body>
                  <p><strong>Nom:</strong> {stage.entreprise_nom}</p>
                  {stage.entreprise_adresse && <p><strong>Adresse:</strong> {stage.entreprise_adresse}</p>}
                  {stage.entreprise_telephone && <p><strong>Téléphone:</strong> {stage.entreprise_telephone}</p>}
                  {stage.entreprise_email && <p><strong>Email:</strong> {stage.entreprise_email}</p>}
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="h-100">
                <Card.Header>
                  <i className="bi bi-person-badge me-2"></i>
                  Encadrement
                </Card.Header>
                <Card.Body>
                  <p><strong>Maître de stage:</strong> {stage.maitre_stage_nom}</p>
                  {stage.maitre_stage_fonction && <p><strong>Fonction:</strong> {stage.maitre_stage_fonction}</p>}
                  {stage.maitre_stage_email && <p><strong>Email:</strong> {stage.maitre_stage_email}</p>}
                  <p className="mb-0"><strong>Encadrant académique:</strong> {encadrantLabel}</p>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="h-100">
                <Card.Header>
                  <i className="bi bi-calendar me-2"></i>
                  Période
                </Card.Header>
                <Card.Body>
                  <p><strong>Début:</strong> {new Date(stage.date_debut).toLocaleDateString('fr-FR')}</p>
                  <p><strong>Fin:</strong> {new Date(stage.date_fin).toLocaleDateString('fr-FR')}</p>
                  <p className="mb-0"><strong>Durée:</strong> {stage.duree_semaines} semaines</p>
                </Card.Body>
              </Card>
            </Col>

            <Col md={12}>
              <Card>
                <Card.Header>
                  <i className="bi bi-file-text me-2"></i>
                  Thème et objectifs
                </Card.Header>
                <Card.Body>
                  <h6>Thème</h6>
                  <p>{stage.theme}</p>
                  {stage.objectifs && (
                    <>
                      <h6>Objectifs</h6>
                      <p className="mb-0">{stage.objectifs}</p>
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="evaluation" title="Évaluation">
          <Card>
            <Card.Body>
              <Row className="g-4">
                <Col md={4}>
                  <Card className="text-center h-100">
                    <Card.Body>
                      <h6 className="text-muted">Note entreprise</h6>
                      <h2 className={stage.note_entreprise ? 'text-primary' : 'text-muted'}>
                        {stage.note_entreprise ?? '-'}/20
                      </h2>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="text-center h-100">
                    <Card.Body>
                      <h6 className="text-muted">Note rapport</h6>
                      <h2 className={stage.note_rapport ? 'text-primary' : 'text-muted'}>
                        {stage.note_rapport ?? '-'}/20
                      </h2>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="text-center h-100">
                    <Card.Body>
                      <h6 className="text-muted">Note soutenance</h6>
                      <h2 className={stage.note_soutenance ? 'text-primary' : 'text-muted'}>
                        {stage.note_soutenance ?? '-'}/20
                      </h2>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {stage.observations && (
                <div className="mt-4">
                  <h6>Observations</h6>
                  <p>{stage.observations}</p>
                </div>
              )}

              {stage.statut === 'termine' && stage.note_entreprise == null && (
                <div className="text-center mt-4">
                  <Button variant="primary" onClick={() => setShowEvalModal(true)}>
                    <i className="bi bi-pencil me-2"></i>
                    Saisir les notes
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="soutenance" title="Soutenance">
          {soutenance ? (
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <span>Soutenance programmée</span>
                <Badge bg={
                  soutenance.statut === 'validee' ? 'success' :
                  soutenance.statut === 'terminee' ? 'primary' :
                  soutenance.statut === 'en_cours' ? 'warning' : 'info'
                }>
                  {STATUTS_SOUTENANCE.find((s) => s.value === soutenance.statut)?.label}
                </Badge>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <p><strong>Date:</strong> {new Date(soutenance.date_soutenance).toLocaleString('fr-FR')}</p>
                    <p><strong>Lieu:</strong> {soutenance.lieu}</p>
                    <p><strong>Durée:</strong> {soutenance.duree_minutes} minutes</p>
                  </Col>
                  <Col md={6}>
                    <p><strong>Président du jury:</strong> {getJuryLabel(soutenance.president_jury_id)}</p>
                    <p><strong>Rapporteur:</strong> {getJuryLabel(soutenance.rapporteur_id)}</p>
                    {soutenance.examinateur_id && (
                      <p><strong>Examinateur:</strong> {getJuryLabel(soutenance.examinateur_id)}</p>
                    )}
                  </Col>
                </Row>

                {soutenance.note_finale != null && (
                  <div className="mt-3 p-3 bg-light rounded">
                    <Row>
                      <Col md={3} className="text-center">
                        <small className="text-muted">Présentation</small>
                        <h4>{soutenance.note_presentation}/20</h4>
                      </Col>
                      <Col md={3} className="text-center">
                        <small className="text-muted">Défense</small>
                        <h4>{soutenance.note_defense}/20</h4>
                      </Col>
                      <Col md={3} className="text-center">
                        <small className="text-muted">Jury</small>
                        <h4>{soutenance.note_jury}/20</h4>
                      </Col>
                      <Col md={3} className="text-center">
                        <small className="text-muted">Note finale</small>
                        <h4 className="text-primary">{soutenance.note_finale}/20</h4>
                      </Col>
                    </Row>
                    {soutenance.mention && (
                      <div className="text-center mt-2">
                        <Badge bg="success" className="fs-6">Mention: {soutenance.mention}</Badge>
                      </div>
                    )}
                  </div>
                )}

                {canGeneratePv && (
                  <div className="mt-3 d-flex gap-2">
                    {pvHref ? (
                      <Button variant="outline-success" href={pvHref} target="_blank" rel="noreferrer">
                        <i className="bi bi-file-earmark-pdf me-2"></i>
                        Télécharger le PV
                      </Button>
                    ) : (
                      <Button variant="success" onClick={handleGenererPv} disabled={generatingPv}>
                        {generatingPv ? (
                          <Spinner animation="border" size="sm" className="me-2" />
                        ) : (
                          <i className="bi bi-file-earmark-plus me-2"></i>
                        )}
                        Générer le procès-verbal
                      </Button>
                    )}
                  </div>
                )}
              </Card.Body>
            </Card>
          ) : (
            <Card>
              <Card.Body className="text-center py-5">
                <i className="bi bi-calendar-x fs-1 text-muted mb-3 d-block"></i>
                <p className="text-muted">Aucune soutenance programmée</p>
                {stage.statut === 'termine' && (
                  <Button variant="primary" onClick={() => setShowSoutenanceModal(true)}>
                    <i className="bi bi-calendar-plus me-2"></i>
                    Programmer une soutenance
                  </Button>
                )}
              </Card.Body>
            </Card>
          )}
        </Tab>
      </Tabs>

      <Modal show={showEvalModal} onHide={() => setShowEvalModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Évaluation du stage</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Note entreprise *</Form.Label>
            <InputGroup>
              <Form.Control
                type="number"
                step="0.5"
                min="0"
                max="20"
                value={evalData.note_entreprise}
                onChange={(e) => setEvalData({ ...evalData, note_entreprise: Number(e.target.value) })}
              />
              <InputGroup.Text>/20</InputGroup.Text>
            </InputGroup>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Note rapport *</Form.Label>
            <InputGroup>
              <Form.Control
                type="number"
                step="0.5"
                min="0"
                max="20"
                value={evalData.note_rapport}
                onChange={(e) => setEvalData({ ...evalData, note_rapport: Number(e.target.value) })}
              />
              <InputGroup.Text>/20</InputGroup.Text>
            </InputGroup>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Observations</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={evalData.observations}
              onChange={(e) => setEvalData({ ...evalData, observations: e.target.value })}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEvalModal(false)}>Annuler</Button>
          <Button variant="primary" onClick={handleValider}>
            <i className="bi bi-check-lg me-2"></i>
            Valider
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showSoutenanceModal} onHide={() => setShowSoutenanceModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Programmer une soutenance</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Date et heure *</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={soutenanceData.date_soutenance}
                  onChange={(e) => setSoutenanceData({ ...soutenanceData, date_soutenance: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Lieu *</Form.Label>
                <Form.Control
                  type="text"
                  value={soutenanceData.lieu}
                  onChange={(e) => setSoutenanceData({ ...soutenanceData, lieu: e.target.value })}
                  placeholder="Salle, bâtiment..."
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Durée (minutes)</Form.Label>
                <Form.Control
                  type="number"
                  min="15"
                  max="120"
                  value={soutenanceData.duree_minutes}
                  onChange={(e) => setSoutenanceData({ ...soutenanceData, duree_minutes: Number(e.target.value) })}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Président du jury *</Form.Label>
                <Form.Select
                  value={soutenanceData.president_jury_id ?? ''}
                  onChange={(e) =>
                    setSoutenanceData({
                      ...soutenanceData,
                      president_jury_id: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                >
                  <option value="">Sélectionner…</option>
                  {juryUsers.map((u) => (
                    <option key={u.id} value={u.id}>{formatUserLabel(u)}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Rapporteur *</Form.Label>
                <Form.Select
                  value={soutenanceData.rapporteur_id ?? ''}
                  onChange={(e) =>
                    setSoutenanceData({
                      ...soutenanceData,
                      rapporteur_id: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                >
                  <option value="">Sélectionner…</option>
                  {juryUsers.map((u) => (
                    <option key={u.id} value={u.id}>{formatUserLabel(u)}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group>
                <Form.Label>Examinateur (optionnel)</Form.Label>
                <Form.Select
                  value={soutenanceData.examinateur_id ?? ''}
                  onChange={(e) =>
                    setSoutenanceData({
                      ...soutenanceData,
                      examinateur_id: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                >
                  <option value="">Aucun</option>
                  {juryUsers.map((u) => (
                    <option key={u.id} value={u.id}>{formatUserLabel(u)}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSoutenanceModal(false)}>Annuler</Button>
          <Button variant="primary" onClick={handleProgrammerSoutenance}>
            <i className="bi bi-calendar-check me-2"></i>
            Programmer
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default StageDetailPage;
