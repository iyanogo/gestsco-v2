import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Row, Col, Button, Badge, Form, Card, Table, Alert, Spinner, Modal,
} from 'react-bootstrap';
import { AxiosError } from 'axios';
import { PageHeader } from '../../../components/layouts';
import { DataCard } from '../../../components/ui';
import { usePermissions } from '../../../hooks/usePermissions';
import { deliberationService } from '../../../services/deliberationService';
import { sessionExamenService } from '../../../services/sessionExamenService';
import { getFilieres } from '../../../services/filiereService';
import { getNiveaux } from '../../../services/niveauService';
import { handleApiError } from '../../../utils/errorHandler';
import { STATUT_DELIBERATION_LABELS, type Deliberation, type SessionExamen } from '../../../types/evaluation';
import type { Filiere, Niveau } from '../../../types/reference';

const extractErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string') return detail;
  }
  return handleApiError(error);
};

const statutBadge = (statut: string) => {
  const label = STATUT_DELIBERATION_LABELS[statut as keyof typeof STATUT_DELIBERATION_LABELS] || statut;
  const variant =
    statut === 'validee' || statut === 'publiee'
      ? 'success'
      : statut === 'terminee'
        ? 'info'
        : statut === 'en_cours'
          ? 'warning'
          : 'secondary';
  return <Badge bg={variant}>{label}</Badge>;
};

const DeliberationsPage: React.FC = () => {
  const { moduleActions } = usePermissions();
  const { canCreate, canUpdate, canValidate } = moduleActions('evaluations_deliberations');
  const [deliberations, setDeliberations] = useState<Deliberation[]>([]);
  const [sessions, setSessions] = useState<SessionExamen[]>([]);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filterStatut, setFilterStatut] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showValidate, setShowValidate] = useState(false);
  const [selected, setSelected] = useState<Deliberation | null>(null);

  const [formSessionId, setFormSessionId] = useState('');
  const [formFiliereId, setFormFiliereId] = useState('');
  const [formNiveauId, setFormNiveauId] = useState('');
  const [formType, setFormType] = useState<'semestrielle' | 'annuelle'>('semestrielle');
  const [formSemestre, setFormSemestre] = useState<'1' | '2'>('1');

  const filiereMap = useMemo(() => new Map(filieres.map((f) => [f.id, f])), [filieres]);
  const niveauMap = useMemo(() => new Map(niveaux.map((n) => [n.id, n])), [niveaux]);
  const sessionMap = useMemo(() => new Map(sessions.map((s) => [s.id, s])), [sessions]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [delibData, sessionData, filiereData, niveauData] = await Promise.all([
        deliberationService.getDeliberations({ limit: 200 }),
        sessionExamenService.getSessions({ limit: 100 }),
        getFilieres(),
        getNiveaux(),
      ]);
      setDeliberations(delibData);
      setSessions(sessionData);
      setFilieres(filiereData);
      setNiveaux(niveauData);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(
    () => deliberations.filter((d) => !filterStatut || d.statut === filterStatut),
    [deliberations, filterStatut],
  );

  const handleCreate = async () => {
    if (!formSessionId || !formFiliereId || !formNiveauId) return;
    setSaving(true);
    setError(null);
    try {
      const result = await deliberationService.creerDeliberationAuto({
        session_id: parseInt(formSessionId, 10),
        niveau_id: parseInt(formNiveauId, 10),
        filiere_id: parseInt(formFiliereId, 10),
        type_deliberation: formType,
        semestre: formType === 'semestrielle' ? parseInt(formSemestre, 10) as 1 | 2 : undefined,
      });
      setSuccess(result.message);
      setShowCreate(false);
      await loadData();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleTerminer = async (id: number) => {
    try {
      await deliberationService.terminerDeliberation(id);
      await loadData();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const handleValider = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await deliberationService.validerDeliberation(selected.id);
      setSuccess('Délibération validée - résultats officiellement verrouillés (is_valide).');
      setShowValidate(false);
      setSelected(null);
      await loadData();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const labelFiliereNiveau = (d: Deliberation) => {
    const f = filiereMap.get(d.filiere_id);
    const n = niveauMap.get(d.niveau_id);
    return `${f?.libelle || f?.code || '-'} / ${n?.libelle || n?.code || '-'}`;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <div className="fade-in">
      <PageHeader
        title="Délibérations"
        subtitle="Décisions officielles - ConfigurationDeliberation (admin/scolarité)"
        breadcrumbs={[
          { label: 'Évaluations', path: '/admin/evaluations' },
          { label: 'Délibérations' },
        ]}
        actions={
          canCreate ? (
            <Button variant="primary" onClick={() => setShowCreate(true)}>
              <i className="bi bi-plus-lg me-1" />
              Lancer une délibération
            </Button>
          ) : undefined
        }
      />

      <Alert variant="info" className="mb-4">
        Les résultats « calculés » (page Résultats) restent indicatifs tant qu&apos;une délibération
        n&apos;est pas <strong>validée</strong>. La création applique{' '}
        <code>ConfigurationDeliberation</code> (seuils, compensation, passage conditionnel).
        Validation officielle : réservée superuser (API).
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

      <Card className="border-0 shadow-sm mb-3">
        <Card.Body className="py-2">
          <Row className="align-items-center">
            <Col md={4}>
              <Form.Select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}>
                <option value="">Tous les statuts</option>
                <option value="en_cours">En cours</option>
                <option value="terminee">Terminée</option>
                <option value="validee">Validée</option>
                <option value="publiee">Publiée</option>
              </Form.Select>
            </Col>
            <Col className="text-muted small">{filtered.length} délibération(s)</Col>
          </Row>
        </Card.Body>
      </Card>

      <DataCard title="Sessions de délibération">
        {filtered.length === 0 ? (
          <Alert variant="secondary" className="mb-0">
            Aucune délibération. Prérequis : notes saisies + résultats calculés (/resultats/calculer/*).
          </Alert>
        ) : (
          <Table responsive hover className="mb-0">
            <thead className="table-light">
              <tr>
                <th>Filière / Niveau</th>
                <th>Session</th>
                <th>Type</th>
                <th className="text-center">Effectif</th>
                <th className="text-center">Admis</th>
                <th className="text-center">Ajournés</th>
                <th className="text-center">Statut</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => {
                const session = sessionMap.get(d.session_id);
                const isOfficial = d.statut === 'validee' || d.statut === 'publiee';
                return (
                  <tr key={d.id} className={isOfficial ? 'table-success' : undefined}>
                    <td>{labelFiliereNiveau(d)}</td>
                    <td>
                      <div>{session?.libelle || session?.code || `#${d.session_id}`}</div>
                      {!isOfficial && (
                        <small className="text-warning">Décision jury non validée</small>
                      )}
                      {isOfficial && (
                        <small className="text-success">Décision officielle</small>
                      )}
                    </td>
                    <td>
                      {d.type_deliberation}
                      {d.semestre ? ` - S${d.semestre}` : ''}
                    </td>
                    <td className="text-center">{d.nombre_etudiants}</td>
                    <td className="text-center text-success">{d.nombre_admis}</td>
                    <td className="text-center text-warning">{d.nombre_ajournes}</td>
                    <td className="text-center">{statutBadge(d.statut)}</td>
                    <td className="text-end">
                      {canUpdate && d.statut === 'en_cours' && (
                        <Button size="sm" variant="outline-primary" className="me-1" onClick={() => handleTerminer(d.id)}>
                          Terminer
                        </Button>
                      )}
                      {canValidate && (d.statut === 'terminee' || d.statut === 'en_cours') && !d.publiee && (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => {
                            setSelected(d);
                            setShowValidate(true);
                          }}
                        >
                          Valider
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </DataCard>

      <Modal show={showCreate} onHide={() => setShowCreate(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Lancer une délibération</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Session d&apos;examen</Form.Label>
                <Form.Select value={formSessionId} onChange={(e) => setFormSessionId(e.target.value)}>
                  <option value="">-</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.libelle || s.code} (S{s.semestre})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Type</Form.Label>
                <Form.Select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as 'semestrielle' | 'annuelle')}
                >
                  <option value="semestrielle">Semestrielle</option>
                  <option value="annuelle">Annuelle</option>
                </Form.Select>
              </Form.Group>
            </Col>
            {formType === 'semestrielle' && (
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Semestre</Form.Label>
                  <Form.Select value={formSemestre} onChange={(e) => setFormSemestre(e.target.value as '1' | '2')}>
                    <option value="1">1</option>
                    <option value="2">2</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            )}
            <Col md={4}>
              <Form.Group>
                <Form.Label>Filière</Form.Label>
                <Form.Select value={formFiliereId} onChange={(e) => setFormFiliereId(e.target.value)}>
                  <option value="">-</option>
                  {filieres.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.libelle || f.code}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Niveau</Form.Label>
                <Form.Select value={formNiveauId} onChange={(e) => setFormNiveauId(e.target.value)}>
                  <option value="">-</option>
                  {niveaux.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.libelle || n.code}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreate(false)}>
            Annuler
          </Button>
          <Button variant="primary" disabled={saving || !formSessionId || !formFiliereId || !formNiveauId} onClick={handleCreate}>
            {saving ? <Spinner size="sm" animation="border" /> : 'Créer et délibérer'}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showValidate} onHide={() => setShowValidate(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Valider la délibération</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selected && (
            <>
              <p>Confirmer la validation officielle pour {labelFiliereNiveau(selected)} ?</p>
              <Alert variant="warning" className="mb-0">
                Action lourde de conséquences : les résultats seront marqués{' '}
                <code>is_valide=true</code>. Nécessite un compte superuser côté API.
              </Alert>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowValidate(false)}>
            Annuler
          </Button>
          <Button variant="success" disabled={saving} onClick={handleValider}>
            Valider définitivement
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DeliberationsPage;
