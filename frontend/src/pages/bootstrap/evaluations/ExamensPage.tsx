import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert, Badge, Button, Col, Form, Modal, Row, Spinner, Table,
} from 'react-bootstrap';
import { AxiosError } from 'axios';
import { PageHeader } from '../../../components/layouts';
import { DataCard, StatCard } from '../../../components/ui';
import { usePermissions } from '../../../hooks/usePermissions';
import examenService from '../../../services/examenService';
import { sessionExamenService } from '../../../services/sessionExamenService';
import { getMatieres } from '../../../services/matiereService';
import { getNiveaux } from '../../../services/niveauService';
import { getUsersForSelect } from '../../../services/userService';
import { handleApiError } from '../../../utils/errorHandler';
import {
  STATUT_EXAMEN_LABELS,
  TYPE_EVALUATION_LABELS,
  type CreateExamen,
  type Examen,
  type SessionExamen,
  type StatutExamen,
  type TypeEvaluation,
  type UpdateExamen,
} from '../../../types/evaluation';
import type { Matiere } from '../../../types/reference';
import type { Niveau } from '../../../types/reference';
import type { User } from '../../../types/auth';

const extractError = (err: unknown): string => {
  if (err instanceof AxiosError) {
    const detail = err.response?.data?.detail;
    if (typeof detail === 'string') return detail;
  }
  return handleApiError(err);
};

const statutBadge = (statut: StatutExamen) => {
  const label = STATUT_EXAMEN_LABELS[statut] || statut;
  const variant =
    statut === 'valide' ? 'success'
      : statut === 'termine' || statut === 'notes_saisies' ? 'info'
        : statut === 'en_cours' ? 'warning'
          : 'secondary';
  return <Badge bg={variant}>{label}</Badge>;
};

const TYPE_OPTIONS = Object.entries(TYPE_EVALUATION_LABELS) as [TypeEvaluation, string][];

const emptyForm: CreateExamen = {
  session_id: 0,
  matiere_id: 0,
  niveau_id: 0,
  type_evaluation: 'controle_continu',
  date_examen: '',
  duree_minutes: 120,
  salle: '',
  coefficient: 1,
  note_sur: 20,
  anonymat: false,
  enseignant_id: undefined,
  description: '',
};

const ExamensPage: React.FC = () => {
  const { moduleActions } = usePermissions();
  const { canCreate, canUpdate, canDelete } = moduleActions('evaluations_notes');

  const [examens, setExamens] = useState<Examen[]>([]);
  const [sessions, setSessions] = useState<SessionExamen[]>([]);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [enseignants, setEnseignants] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterSession, setFilterSession] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Examen | null>(null);
  const [formData, setFormData] = useState<CreateExamen>(emptyForm);

  const matiereMap = useMemo(() => new Map(matieres.map((m) => [m.id, m])), [matieres]);
  const niveauMap = useMemo(() => new Map(niveaux.map((n) => [n.id, n])), [niveaux]);
  const sessionMap = useMemo(() => new Map(sessions.map((s) => [s.id, s])), [sessions]);
  const enseignantMap = useMemo(() => new Map(enseignants.map((u) => [u.id, u])), [enseignants]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const examParams: { session_id?: number; statut?: string; limit: number } = { limit: 500 };
      if (filterSession) examParams.session_id = Number(filterSession);
      if (filterStatut) examParams.statut = filterStatut;

      const [examenData, sessionData, matiereData, niveauData, userData] = await Promise.all([
        examenService.getExamens(examParams),
        sessionExamenService.getSessions({ limit: 100 }),
        getMatieres(),
        getNiveaux(),
        getUsersForSelect({
          roles: ['enseignant', 'teacher', 'admin', 'administrateur', 'scolarite'],
          limit: 200,
        }),
      ]);
      setExamens(examenData);
      setSessions(sessionData);
      setMatieres(matiereData);
      setNiveaux(niveauData);
      setEnseignants(userData);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }, [filterSession, filterStatut]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredExamens = useMemo(() => {
    if (!searchTerm.trim()) return examens;
    const q = searchTerm.toLowerCase();
    return examens.filter((ex) => {
      const mat = matiereMap.get(ex.matiere_id);
      const label = mat?.libelle || mat?.code || '';
      return label.toLowerCase().includes(q) || String(ex.id).includes(q);
    });
  }, [examens, searchTerm, matiereMap]);

  const stats = useMemo(
    () => ({
      total: examens.length,
      planifies: examens.filter((e) => e.statut === 'planifie').length,
      termines: examens.filter((e) => e.statut === 'termine' || e.statut === 'valide').length,
    }),
    [examens],
  );

  const matiereLabel = (ex: Examen) => {
    const m = ex.matiere ?? matiereMap.get(ex.matiere_id);
    return m?.libelle || m?.code || `#${ex.matiere_id}`;
  };

  const niveauLabel = (ex: Examen) => {
    const n = ex.niveau ?? niveauMap.get(ex.niveau_id);
    return n?.libelle || n?.code || `#${ex.niveau_id}`;
  };

  const openCreate = () => {
    setEditing(null);
    setFormData({
      ...emptyForm,
      session_id: sessions[0]?.id ?? 0,
      matiere_id: matieres[0]?.id ?? 0,
      niveau_id: niveaux[0]?.id ?? 0,
    });
    setShowModal(true);
  };

  const openEdit = (examen: Examen) => {
    setEditing(examen);
    setFormData({
      session_id: examen.session_id,
      matiere_id: examen.matiere_id,
      niveau_id: examen.niveau_id,
      type_evaluation: examen.type_evaluation,
      date_examen: examen.date_examen ?? '',
      duree_minutes: examen.duree_minutes ?? 120,
      salle: examen.salle ?? '',
      coefficient: examen.coefficient,
      note_sur: examen.note_sur,
      anonymat: examen.anonymat,
      enseignant_id: examen.enseignant_id,
      description: examen.description ?? '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        ...formData,
        date_examen: formData.date_examen || undefined,
        salle: formData.salle || undefined,
        description: formData.description || undefined,
        enseignant_id: formData.enseignant_id || undefined,
      };
      if (editing) {
        const { session_id: _s, ...updatePayload } = payload;
        await examenService.updateExamen(editing.id, updatePayload as UpdateExamen);
        setSuccess('Examen modifié.');
      } else {
        await examenService.createExamen(payload);
        setSuccess('Examen créé.');
      }
      setShowModal(false);
      await loadData();
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (label: string, action: () => Promise<unknown>) => {
    setError(null);
    setSuccess(null);
    try {
      await action();
      setSuccess(label);
      await loadData();
    } catch (err) {
      setError(extractError(err));
    }
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Examens"
        subtitle="Planification et gestion des évaluations"
        breadcrumbs={[
          { label: 'Évaluations' },
          { label: 'Examens' },
        ]}
        actions={
          canCreate ? (
            <Button variant="primary" onClick={openCreate} disabled={sessions.length === 0}>
              <i className="bi bi-plus-lg me-2"></i>
              Nouvel examen
            </Button>
          ) : undefined
        }
      />

      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}

      <Row className="g-3 mb-4">
        <Col sm={6} xl={4}><StatCard title="Total examens" value={stats.total} icon="calendar-event" variant="primary" /></Col>
        <Col sm={6} xl={4}><StatCard title="Planifiés" value={stats.planifies} icon="clock" variant="info" /></Col>
        <Col sm={6} xl={4}><StatCard title="Terminés / validés" value={stats.termines} icon="check-circle" variant="success" /></Col>
      </Row>

      <DataCard title={`${filteredExamens.length} examen(s)`}>
        <Row className="g-3 mb-4">
          <Col md={4}>
            <Form.Control
              placeholder="Rechercher matière…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Col>
          <Col md={4}>
            <Form.Select value={filterSession} onChange={(e) => setFilterSession(e.target.value)}>
              <option value="">Toutes sessions</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>{s.code} - {s.libelle}</option>
              ))}
            </Form.Select>
          </Col>
          <Col md={3}>
            <Form.Select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}>
              <option value="">Tous statuts</option>
              {Object.entries(STATUT_EXAMEN_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Form.Select>
          </Col>
          <Col md={1} className="text-end">
            <Button variant="outline-secondary" onClick={loadData} disabled={loading}>
              <i className="bi bi-arrow-clockwise"></i>
            </Button>
          </Col>
        </Row>

        {loading ? (
          <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
        ) : (
          <Table responsive hover className="data-table mb-0">
            <thead>
              <tr>
                <th>ID</th>
                <th>Matière</th>
                <th>Session</th>
                <th>Niveau</th>
                <th>Type</th>
                <th>Date</th>
                <th>Salle</th>
                <th className="text-center">Statut</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExamens.length === 0 ? (
                <tr><td colSpan={9} className="text-center text-muted py-4">Aucun examen.</td></tr>
              ) : (
                filteredExamens.map((ex) => (
                  <tr key={ex.id}>
                    <td className="fw-medium">#{ex.id}</td>
                    <td>
                      <div className="fw-medium">{matiereLabel(ex)}</div>
                      {ex.enseignant_id && (
                        <small className="text-muted">
                          {enseignantMap.get(ex.enseignant_id)?.full_name || enseignantMap.get(ex.enseignant_id)?.email || `#${ex.enseignant_id}`}
                        </small>
                      )}
                    </td>
                    <td>{sessionMap.get(ex.session_id)?.code ?? `#${ex.session_id}`}</td>
                    <td>{niveauLabel(ex)}</td>
                    <td>{TYPE_EVALUATION_LABELS[ex.type_evaluation] || ex.type_evaluation}</td>
                    <td>
                      {ex.date_examen ? (
                        <>
                          <div>{ex.date_examen}</div>
                          {ex.duree_minutes && <small className="text-muted">{ex.duree_minutes} min</small>}
                        </>
                      ) : '-'}
                    </td>
                    <td>{ex.salle || '-'}</td>
                    <td className="text-center">{statutBadge(ex.statut)}</td>
                    <td className="text-end">
                      {canUpdate && ex.statut === 'planifie' && (
                        <Button
                          variant="outline-warning"
                          size="sm"
                          className="me-1"
                          title="Terminer"
                          onClick={() => runAction('Examen terminé.', () => examenService.terminerExamen(ex.id))}
                        >
                          <i className="bi bi-flag"></i>
                        </Button>
                      )}
                      {canUpdate && (ex.statut === 'termine' || ex.statut === 'notes_saisies') && (
                        <Button
                          variant="outline-success"
                          size="sm"
                          className="me-1"
                          title="Valider"
                          onClick={() => runAction('Examen validé.', () => examenService.validerExamen(ex.id))}
                        >
                          <i className="bi bi-check-lg"></i>
                        </Button>
                      )}
                      {canUpdate && ex.statut !== 'valide' && (
                        <Button variant="outline-primary" size="sm" className="me-1" onClick={() => openEdit(ex)}>
                          <i className="bi bi-pencil"></i>
                        </Button>
                      )}
                      {canDelete && ex.statut === 'planifie' && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => {
                            if (window.confirm('Supprimer cet examen ?')) {
                              runAction('Examen supprimé.', () => examenService.deleteExamen(ex.id));
                            }
                          }}
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        )}
      </DataCard>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editing ? 'Modifier l\'examen' : 'Nouvel examen'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Session</Form.Label>
                  <Form.Select
                    value={formData.session_id || ''}
                    onChange={(e) => setFormData({ ...formData, session_id: Number(e.target.value) })}
                    required
                    disabled={Boolean(editing)}
                  >
                    <option value="">Sélectionner…</option>
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>{s.code} - S{s.semestre}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Type d'évaluation</Form.Label>
                  <Form.Select
                    value={formData.type_evaluation}
                    onChange={(e) => setFormData({ ...formData, type_evaluation: e.target.value as TypeEvaluation })}
                  >
                    {TYPE_OPTIONS.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Matière</Form.Label>
                  <Form.Select
                    value={formData.matiere_id || ''}
                    onChange={(e) => setFormData({ ...formData, matiere_id: Number(e.target.value) })}
                    required
                  >
                    <option value="">Sélectionner…</option>
                    {matieres.map((m) => (
                      <option key={m.id} value={m.id}>{m.code} - {m.libelle}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Niveau</Form.Label>
                  <Form.Select
                    value={formData.niveau_id || ''}
                    onChange={(e) => setFormData({ ...formData, niveau_id: Number(e.target.value) })}
                    required
                  >
                    <option value="">Sélectionner…</option>
                    {niveaux.map((n) => (
                      <option key={n.id} value={n.id}>{n.code} - {n.libelle}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.date_examen ?? ''}
                    onChange={(e) => setFormData({ ...formData, date_examen: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Durée (min)</Form.Label>
                  <Form.Control
                    type="number"
                    min={30}
                    value={formData.duree_minutes ?? 120}
                    onChange={(e) => setFormData({ ...formData, duree_minutes: Number(e.target.value) })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Salle</Form.Label>
                  <Form.Control
                    value={formData.salle ?? ''}
                    onChange={(e) => setFormData({ ...formData, salle: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Coefficient</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    min={0}
                    value={formData.coefficient ?? 1}
                    onChange={(e) => setFormData({ ...formData, coefficient: Number(e.target.value) })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Note sur</Form.Label>
                  <Form.Control
                    type="number"
                    min={1}
                    value={formData.note_sur ?? 20}
                    onChange={(e) => setFormData({ ...formData, note_sur: Number(e.target.value) })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Enseignant</Form.Label>
                  <Form.Select
                    value={formData.enseignant_id ?? ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      enseignant_id: e.target.value ? Number(e.target.value) : undefined,
                    })}
                  >
                    <option value="">-</option>
                    {enseignants.map((u) => (
                      <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={formData.description ?? ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? <Spinner animation="border" size="sm" className="me-2" /> : null}
              {editing ? 'Enregistrer' : 'Créer'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default ExamensPage;
