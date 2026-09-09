import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Row, Col, Button, Badge, Form, Card, Table, Alert, Spinner, Tab, Tabs,
} from 'react-bootstrap';
import { AxiosError } from 'axios';
import { PageHeader } from '../../../components/layouts';
import { DataCard } from '../../../components/ui';
import { usePermissions } from '../../../hooks/usePermissions';
import { resultatService } from '../../../services/resultatService';
import { sessionExamenService } from '../../../services/sessionExamenService';
import { getInscriptions } from '../../../services/inscriptionService';
import { getEtudiants } from '../../../services/etudiantService';
import { getMatieres } from '../../../services/matiereService';
import { getFilieres } from '../../../services/filiereService';
import { getNiveaux } from '../../../services/niveauService';
import { handleApiError } from '../../../utils/errorHandler';
import api from '../../../services/api';
import type { ConfigurationDeliberation } from '../../../types/anneeAcademique';
import {
  DECISION_LABELS,
  MENTION_LABELS,
  type ResultatAnnuel,
  type ResultatMatiere,
  type ResultatSemestre,
  type SessionExamen,
} from '../../../types/evaluation';
import type { Etudiant, Inscription } from '../../../types/etudiant';
import type { Filiere, Matiere, Niveau } from '../../../types/reference';

interface InscriptionOption extends Inscription {
  label: string;
}

const extractErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail.map((item: { msg?: string }) => item.msg).filter(Boolean).join(', ');
    }
  }
  return handleApiError(error);
};

const formatNote = (value?: number | null) =>
  value != null ? value.toFixed(2) : '-';

const statutMatiereBadge = (statut: string) => {
  if (statut === 'valide') return <Badge bg="success">Validé</Badge>;
  if (statut === 'non_valide') return <Badge bg="danger">Non validé</Badge>;
  return <Badge bg="secondary">{statut || 'En cours'}</Badge>;
};

const decisionBadge = (decision?: string) => {
  if (!decision) return <Badge bg="secondary">-</Badge>;
  const variant =
    decision === 'admis'
      ? 'success'
      : decision === 'admis_avec_dette'
        ? 'info'
        : decision === 'ajourne' || decision === 'rattrapage'
          ? 'warning'
          : decision === 'redouble' || decision === 'exclus'
            ? 'danger'
            : 'secondary';
  const label = DECISION_LABELS[decision as keyof typeof DECISION_LABELS] || decision;
  return <Badge bg={variant}>{label}</Badge>;
};

const ResultatsPage: React.FC = () => {
  const { canPerform } = usePermissions();
  const canCalculate = canPerform('evaluations_resultats', 'calculate');
  const [sessions, setSessions] = useState<SessionExamen[]>([]);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [inscriptionOptions, setInscriptionOptions] = useState<InscriptionOption[]>([]);

  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [selectedFiliereId, setSelectedFiliereId] = useState('');
  const [selectedNiveauId, setSelectedNiveauId] = useState('');
  const [selectedInscriptionId, setSelectedInscriptionId] = useState('');

  const [resultatsMatieres, setResultatsMatieres] = useState<ResultatMatiere[]>([]);
  const [resultatSemestre, setResultatSemestre] = useState<ResultatSemestre | null>(null);
  const [resultatAnnuel, setResultatAnnuel] = useState<ResultatAnnuel | null>(null);
  const [annuelIndisponible, setAnnuelIndisponible] = useState<string | null>(null);

  const [loadingRefs, setLoadingRefs] = useState(true);
  const [loadingResultats, setLoadingResultats] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('matieres');
  const [seuilValidation, setSeuilValidation] = useState(10);

  const matiereMap = useMemo(
    () => new Map(matieres.map((m) => [m.id, m])),
    [matieres],
  );

  const selectedSession = useMemo(
    () => sessions.find((s) => s.id === parseInt(selectedSessionId, 10)),
    [sessions, selectedSessionId],
  );

  const selectedInscription = useMemo(
    () => inscriptionOptions.find((i) => i.id === parseInt(selectedInscriptionId, 10)),
    [inscriptionOptions, selectedInscriptionId],
  );

  const filtersComplete =
    selectedSessionId && selectedFiliereId && selectedNiveauId && selectedInscriptionId;

  useEffect(() => {
    const loadRefs = async () => {
      try {
        const [sessionData, filiereData, niveauData, matiereData, inscriptionData, etudiantData] =
          await Promise.all([
            sessionExamenService.getSessions({ limit: 100 }),
            getFilieres(),
            getNiveaux(),
            getMatieres({ limit: 500 }),
            getInscriptions({ limit: 500 }),
            getEtudiants({ limit: 500 }),
          ]);
        setSessions(sessionData);
        setFilieres(filiereData);
        setNiveaux(niveauData);
        setMatieres(matiereData);

        const etudiantMap = new Map<number, Etudiant>(etudiantData.map((e) => [e.id, e]));
        const filiereMap = new Map(filiereData.map((f) => [f.id, f]));
        const niveauMap = new Map(niveauData.map((n) => [n.id, n]));

        setInscriptionOptions(
          inscriptionData.map((ins) => {
            const etu = ins.etudiant_id ? etudiantMap.get(ins.etudiant_id) : undefined;
            const fil = ins.filiere_id ? filiereMap.get(ins.filiere_id) : undefined;
            const niv = ins.niveau_id ? niveauMap.get(ins.niveau_id) : undefined;
            const nom = etu ? `${etu.nom || ''} ${etu.prenom || ''}`.trim() : `#${ins.etudiant_id}`;
            return {
              ...ins,
              label: `${etu?.matricule || '-'} - ${nom} (${fil?.code || fil?.libelle || '-'} / ${niv?.code || niv?.libelle || '-'})`,
            };
          }),
        );
      } catch (err) {
        setError(extractErrorMessage(err));
      } finally {
        setLoadingRefs(false);
      }
    };
    loadRefs();
  }, []);

  const filteredInscriptions = useMemo(() => {
    const filiereId = parseInt(selectedFiliereId, 10);
    const niveauId = parseInt(selectedNiveauId, 10);
    if (!selectedFiliereId || !selectedNiveauId) return [];
    return inscriptionOptions.filter(
      (i) => i.filiere_id === filiereId && i.niveau_id === niveauId,
    );
  }, [inscriptionOptions, selectedFiliereId, selectedNiveauId]);

  useEffect(() => {
    const loadConfigDeliberation = async () => {
      if (!selectedSession?.annee_academique_id) {
        setSeuilValidation(10);
        return;
      }
      const niveauId = selectedNiveauId ? parseInt(selectedNiveauId, 10) : undefined;
      try {
        const response = await api.get<ConfigurationDeliberation[]>(
          '/api/v1/configurations-deliberation/',
          { params: { annee_academique_id: selectedSession.annee_academique_id } },
        );
        const configs = response.data;
        const niveauConfig = niveauId
          ? configs.find((c) => c.niveau_id === niveauId)
          : undefined;
        const globalConfig = configs.find((c) => c.niveau_id == null);
        const applicable = niveauConfig || globalConfig;
        setSeuilValidation(applicable?.moyenne_validation ?? 10);
      } catch {
        setSeuilValidation(10);
      }
    };
    loadConfigDeliberation();
  }, [selectedSession, selectedNiveauId]);

  const loadResultats = useCallback(async () => {
    if (!filtersComplete || !selectedInscription || !selectedSession) return;

    const etudiantId = selectedInscription.etudiant_id;
    const sessionId = selectedSession.id;
    const semestre = selectedSession.semestre;

    if (!etudiantId) {
      setError('Inscription sans étudiant associé.');
      return;
    }

    setLoadingResultats(true);
    setError(null);
    setAnnuelIndisponible(null);

    try {
      const [matieresRes, semestresRes, annuelsRes] = await Promise.all([
        resultatService.getResultatsMatieres(etudiantId, sessionId),
        resultatService.getResultatsSemestres(etudiantId),
        resultatService.getResultatsAnnuels(etudiantId),
      ]);

      setResultatsMatieres(matieresRes);
      setResultatSemestre(
        semestresRes.find(
          (r) => r.session_id === sessionId && r.semestre === semestre,
        ) ?? null,
      );

      const annuel = annuelsRes.find((r) => r.inscription_id === selectedInscription.id) ?? null;
      setResultatAnnuel(annuel);
      if (!annuel) {
        setAnnuelIndisponible(
          'Aucun résultat annuel en base - lancer le calcul après les deux semestres.',
        );
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoadingResultats(false);
    }
  }, [filtersComplete, selectedInscription, selectedSession]);

  const handleCalculerEtCharger = async () => {
    if (!filtersComplete || !selectedInscription || !selectedSession) return;

    setCalculating(true);
    setError(null);
    setSuccess(null);

    const sessionId = selectedSession.id;
    const semestre = selectedSession.semestre;
    const inscriptionId = selectedInscription.id;

    try {
      const sessionCalc = await resultatService.calculerResultatsSession(sessionId);
      const semestreCalc = await resultatService.calculerResultatsSemestre(sessionId, semestre);

      let annuelMsg = '';
      try {
        await resultatService.calculerResultatAnnuel(inscriptionId);
      } catch (err) {
        annuelMsg = ' (résultat annuel partiel ou indisponible - deux semestres requis)';
        setAnnuelIndisponible(extractErrorMessage(err));
      }

      setSuccess(
        `${sessionCalc.message}. ${semestreCalc.message}${annuelMsg}`,
      );
      await loadResultats();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setCalculating(false);
    }
  };

  const matiereLabel = (matiereId: number) => {
    const m = matiereMap.get(matiereId);
    if (!m) return `Matière #${matiereId}`;
    return `${m.code || '-'} - ${m.libelle || '-'}`;
  };

  const creditsObtenusMatieres = resultatsMatieres.reduce(
    (sum, r) => sum + (r.credit_obtenu || 0),
    0,
  );
  const creditsInscritsMatieres = resultatsMatieres.reduce(
    (sum, r) => sum + (r.credit_matiere || 0),
    0,
  );

  if (loadingRefs) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <div className="fade-in">
      <PageHeader
        title="Résultats"
        subtitle="Consultation des résultats - calcul backend LMD (admin/scolarité)"
        breadcrumbs={[
          { label: 'Évaluations', path: '/admin/evaluations' },
          { label: 'Résultats' },
        ]}
      />

      <Alert variant="info" className="mb-4">
        Les moyennes, crédits ECTS et mentions affichés proviennent des endpoints{' '}
        <code>/api/v1/resultats/calculer/*</code> - aucun recalcul LMD côté navigateur.
        Les seuils de validation (matière, semestre, annuel) suivent{' '}
        <code>ConfigurationDeliberation</code> (repli 10/20 si aucune config).
        Périmètre actuel : admin / scolarité uniquement.
      </Alert>

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

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col md={3}>
              <Form.Group>
                <Form.Label>Session d&apos;examen</Form.Label>
                <Form.Select
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                >
                  <option value="">- Sélectionner -</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.libelle || s.code} (S{s.semestre})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Filière</Form.Label>
                <Form.Select
                  value={selectedFiliereId}
                  onChange={(e) => {
                    setSelectedFiliereId(e.target.value);
                    setSelectedInscriptionId('');
                  }}
                >
                  <option value="">-</option>
                  {filieres.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.libelle || f.code}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Niveau</Form.Label>
                <Form.Select
                  value={selectedNiveauId}
                  onChange={(e) => {
                    setSelectedNiveauId(e.target.value);
                    setSelectedInscriptionId('');
                  }}
                >
                  <option value="">-</option>
                  {niveaux.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.libelle || n.code}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Étudiant (inscription)</Form.Label>
                <Form.Select
                  value={selectedInscriptionId}
                  onChange={(e) => setSelectedInscriptionId(e.target.value)}
                  disabled={!selectedFiliereId || !selectedNiveauId}
                >
                  <option value="">- Sélectionner -</option>
                  {filteredInscriptions.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2} className="d-flex gap-2">
              {canCalculate && (
                <Button
                  variant="primary"
                  className="flex-grow-1"
                  disabled={!filtersComplete || calculating}
                  onClick={handleCalculerEtCharger}
                >
                  {calculating ? (
                    <Spinner size="sm" animation="border" />
                  ) : (
                    <>
                      <i className="bi bi-calculator me-1" />
                      Calculer
                    </>
                  )}
                </Button>
              )}
              <Button
                variant="outline-secondary"
                disabled={!filtersComplete || loadingResultats}
                onClick={loadResultats}
                title="Recharger sans recalculer"
              >
                <i className="bi bi-arrow-clockwise" />
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {!filtersComplete ? (
        <Alert variant="secondary">Sélectionnez une session, une filière, un niveau et un étudiant.</Alert>
      ) : loadingResultats ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : (
        <Tabs activeKey={activeTab} onSelect={(k) => k && setActiveTab(k)} className="mb-3">
          <Tab eventKey="matieres" title="Par matière">
            <DataCard title={`Résultats matières - session ${selectedSession?.libelle || ''}`}>
              {resultatsMatieres.length === 0 ? (
                <Alert variant="warning" className="mb-0">
                  Aucun résultat matière. Saisir des notes puis lancer « Calculer ».
                </Alert>
              ) : (
                <>
                  <Row className="g-3 mb-3">
                    <Col sm={4}>
                      <Card className="border-0 bg-light">
                        <Card.Body className="py-2 text-center">
                          <small className="text-muted d-block">Crédits ECTS (session)</small>
                          <span className="fs-5 fw-bold">
                            {creditsObtenusMatieres} / {creditsInscritsMatieres}
                          </span>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col sm={4}>
                      <Card className="border-0 bg-light">
                        <Card.Body className="py-2 text-center">
                          <small className="text-muted d-block">Matières validées</small>
                          <span className="fs-5 fw-bold">
                            {resultatsMatieres.filter((r) => r.statut === 'valide').length} /{' '}
                            {resultatsMatieres.length}
                          </span>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col sm={4}>
                      <Card className="border-0 bg-light">
                        <Card.Body className="py-2 text-center">
                          <small className="text-muted d-block">Seuil validation matière</small>
                          <span className="fs-6">≥ {seuilValidation}/20 (ConfigurationDeliberation)</span>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                  <Table responsive hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Matière</th>
                        <th className="text-center">CC</th>
                        <th className="text-center">TP</th>
                        <th className="text-center">Examen</th>
                        <th className="text-center">Moyenne</th>
                        <th className="text-center">ECTS</th>
                        <th className="text-center">Obtenus</th>
                        <th className="text-center">Statut</th>
                        <th className="text-center">Décision</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultatsMatieres.map((r) => (
                        <tr key={r.id}>
                          <td>{matiereLabel(r.matiere_id)}</td>
                          <td className="text-center">{formatNote(r.note_cc)}</td>
                          <td className="text-center">{formatNote(r.note_tp)}</td>
                          <td className="text-center">{formatNote(r.note_examen)}</td>
                          <td className="text-center fw-bold">{formatNote(r.moyenne_matiere)}</td>
                          <td className="text-center">{r.credit_matiere ?? '-'}</td>
                          <td className="text-center">{r.credit_obtenu ?? 0}</td>
                          <td className="text-center">{statutMatiereBadge(r.statut)}</td>
                          <td className="text-center">{decisionBadge(r.decision)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </>
              )}
            </DataCard>
          </Tab>

          <Tab eventKey="semestre" title="Semestre">
            <DataCard title={`Résultat semestre ${selectedSession?.semestre || ''}`}>
              {!resultatSemestre ? (
                <Alert variant="warning" className="mb-0">
                  Aucun résultat semestriel - lancer « Calculer » après saisie des notes matières.
                  Décision semestrielle calculée côté backend selon{' '}
                  <code>ConfigurationDeliberation</code> (crédits min, passage conditionnel).
                </Alert>
              ) : (
                <Row className="g-3">
                  <Col md={3}>
                    <Card className="border-0 bg-light h-100">
                      <Card.Body>
                        <small className="text-muted">Moyenne générale</small>
                        <div className="fs-4 fw-bold">{formatNote(resultatSemestre.moyenne_generale)}/20</div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="border-0 bg-light h-100">
                      <Card.Body>
                        <small className="text-muted">Crédits ECTS</small>
                        <div className="fs-4 fw-bold">
                          {resultatSemestre.total_credits_obtenus} /{' '}
                          {resultatSemestre.total_credits_inscrits}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="border-0 bg-light h-100">
                      <Card.Body>
                        <small className="text-muted">Décision</small>
                        <div className="mt-1">{decisionBadge(resultatSemestre.decision)}</div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="border-0 bg-light h-100">
                      <Card.Body>
                        <small className="text-muted">Mention</small>
                        <div className="fs-5 fw-medium mt-1">
                          {resultatSemestre.mention
                            ? MENTION_LABELS[resultatSemestre.mention] || resultatSemestre.mention
                            : '-'}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col xs={12}>
                    <p className="text-muted small mb-0">
                      Matières validées : {resultatSemestre.nombre_matieres_validees} /{' '}
                      {resultatSemestre.nombre_matieres} - statut : {resultatSemestre.statut}
                    </p>
                  </Col>
                </Row>
              )}
            </DataCard>
          </Tab>

          <Tab eventKey="annuel" title="Annuel">
            <DataCard title="Résultat annuel">
              {!resultatAnnuel ? (
                <Alert variant="warning" className="mb-0">
                  {annuelIndisponible ||
                    'Résultat annuel en attente - nécessite les résultats des deux semestres calculés côté backend.'}
                  {' '}La compensation inter-semestres suit{' '}
                  <code>ConfigurationDeliberation</code>.
                </Alert>
              ) : (
                <Row className="g-3">
                  <Col md={3}>
                    <Card className="border-0 bg-light h-100">
                      <Card.Body>
                        <small className="text-muted">Moyenne annuelle</small>
                        <div className="fs-4 fw-bold">{formatNote(resultatAnnuel.moyenne_annuelle)}/20</div>
                        <small className="text-muted">
                          S1 : {formatNote(resultatAnnuel.moyenne_semestre1)} - S2 :{' '}
                          {formatNote(resultatAnnuel.moyenne_semestre2)}
                        </small>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="border-0 bg-light h-100">
                      <Card.Body>
                        <small className="text-muted">Crédits annuels</small>
                        <div className="fs-4 fw-bold">
                          {resultatAnnuel.total_credits_obtenus} /{' '}
                          {resultatAnnuel.total_credits_inscrits}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="border-0 bg-light h-100">
                      <Card.Body>
                        <small className="text-muted">Décision</small>
                        <div className="mt-1">{decisionBadge(resultatAnnuel.decision)}</div>
                        {resultatAnnuel.passage_niveau_superieur && (
                          <Badge bg="success" className="mt-2">Passage niveau supérieur</Badge>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="border-0 bg-light h-100">
                      <Card.Body>
                        <small className="text-muted">Mention</small>
                        <div className="fs-5 fw-medium mt-1">
                          {resultatAnnuel.mention
                            ? MENTION_LABELS[resultatAnnuel.mention] || resultatAnnuel.mention
                            : '-'}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              )}
            </DataCard>
          </Tab>
        </Tabs>
      )}
    </div>
  );
};

export default ResultatsPage;


