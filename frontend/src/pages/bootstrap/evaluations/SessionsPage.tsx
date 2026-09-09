import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert, Badge, Button, Col, Form, Modal, Row, Spinner, Table,
} from 'react-bootstrap';
import { AxiosError } from 'axios';
import { PageHeader } from '../../../components/layouts';
import { DataCard, StatCard } from '../../../components/ui';
import { usePermissions } from '../../../hooks/usePermissions';
import { useAuth } from '../../../hooks/useAuth';
import { sessionExamenService } from '../../../services/sessionExamenService';
import anneeAcademiqueService from '../../../services/anneeAcademiqueService';
import examenService from '../../../services/examenService';
import { handleApiError } from '../../../utils/errorHandler';
import {
  STATUT_SESSION_LABELS,
  type CreateSessionExamen,
  type SessionExamen,
  type UpdateSessionExamen,
} from '../../../types/evaluation';
import type { AnneeAcademique } from '../../../types/inscription';

const extractError = (err: unknown): string => {
  if (err instanceof AxiosError) {
    const detail = err.response?.data?.detail;
    if (typeof detail === 'string') return detail;
  }
  return handleApiError(err);
};

const statutBadge = (statut: string) => {
  const label = STATUT_SESSION_LABELS[statut] || statut;
  const variant =
    statut === 'validee' ? 'success'
      : statut === 'en_cours' ? 'warning'
        : statut === 'cloturee' ? 'secondary'
          : 'info';
  return <Badge bg={variant}>{label}</Badge>;
};

const emptyForm: CreateSessionExamen = {
  code: '',
  libelle: '',
  annee_academique_id: 0,
  type_session: 'normale',
  semestre: 1,
  date_debut: '',
  date_fin: '',
  date_limite_saisie_notes: '',
  date_deliberation: '',
};

const SessionsPage: React.FC = () => {
  const { user } = useAuth();
  const { moduleActions } = usePermissions();
  const { canCreate, canUpdate, canDelete } = moduleActions('evaluations_notes');
  const canValidateSession = Boolean(user?.is_superuser);

  const [sessions, setSessions] = useState<SessionExamen[]>([]);
  const [annees, setAnnees] = useState<AnneeAcademique[]>([]);
  const [examCounts, setExamCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterAnnee, setFilterAnnee] = useState('');
  const [filterSemestre, setFilterSemestre] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SessionExamen | null>(null);
  const [formData, setFormData] = useState<CreateSessionExamen>(emptyForm);

  const anneeMap = useMemo(() => new Map(annees.map((a) => [a.id, a])), [annees]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { annee_id?: number; semestre?: number; statut?: string; limit: number } = {
        limit: 200,
      };
      if (filterAnnee) params.annee_id = Number(filterAnnee);
      if (filterSemestre) params.semestre = Number(filterSemestre);
      if (filterStatut) params.statut = filterStatut;

      const [sessionData, anneeData, examenData] = await Promise.all([
        sessionExamenService.getSessions(params),
        anneeAcademiqueService.getAnnees({ limit: 100 }),
        examenService.getExamens({ limit: 500 }),
      ]);
      setSessions(sessionData);
      setAnnees(anneeData);

      const counts: Record<number, number> = {};
      examenData.forEach((ex) => {
        counts[ex.session_id] = (counts[ex.session_id] ?? 0) + 1;
      });
      setExamCounts(counts);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }, [filterAnnee, filterSemestre, filterStatut]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredSessions = useMemo(() => {
    if (!searchTerm.trim()) return sessions;
    const q = searchTerm.toLowerCase();
    return sessions.filter(
      (s) =>
        s.code.toLowerCase().includes(q) ||
        s.libelle.toLowerCase().includes(q),
    );
  }, [sessions, searchTerm]);

  const stats = useMemo(
    () => ({
      total: sessions.length,
      enCours: sessions.filter((s) => s.statut === 'en_cours').length,
      planifiees: sessions.filter((s) => s.statut === 'planifiee').length,
      totalExamens: Object.values(examCounts).reduce((a, b) => a + b, 0),
    }),
    [sessions, examCounts],
  );

  const openCreate = () => {
    const active = annees.find((a) => a.is_current) ?? annees[0];
    setEditing(null);
    setFormData({
      ...emptyForm,
      annee_academique_id: active?.id ?? 0,
    });
    setShowModal(true);
  };

  const openEdit = (session: SessionExamen) => {
    setEditing(session);
    setFormData({
      code: session.code,
      libelle: session.libelle,
      annee_academique_id: session.annee_academique_id,
      type_session: session.type_session,
      semestre: session.semestre,
      date_debut: session.date_debut,
      date_fin: session.date_fin,
      date_limite_saisie_notes: session.date_limite_saisie_notes ?? '',
      date_deliberation: session.date_deliberation ?? '',
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
        date_limite_saisie_notes: formData.date_limite_saisie_notes || undefined,
        date_deliberation: formData.date_deliberation || undefined,
      };
      if (editing) {
        await sessionExamenService.updateSession(editing.id, payload as UpdateSessionExamen);
        setSuccess('Session modifiée.');
      } else {
        await sessionExamenService.createSession(payload);
        setSuccess('Session créée.');
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
        title="Sessions d'évaluation"
        subtitle="Configuration des sessions d'examens par semestre"
        breadcrumbs={[
          { label: 'Évaluations' },
          { label: 'Sessions' },
        ]}
        actions={
          canCreate ? (
            <Button variant="primary" onClick={openCreate}>
              <i className="bi bi-plus-lg me-2"></i>
              Nouvelle session
            </Button>
          ) : undefined
        }
      />

      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}

      <Row className="g-3 mb-4">
        <Col sm={6} xl={3}><StatCard title="Sessions" value={stats.total} icon="calendar3" variant="primary" /></Col>
        <Col sm={6} xl={3}><StatCard title="En cours" value={stats.enCours} icon="play-circle" variant="warning" /></Col>
        <Col sm={6} xl={3}><StatCard title="Planifiées" value={stats.planifiees} icon="clock" variant="info" /></Col>
        <Col sm={6} xl={3}><StatCard title="Examens" value={stats.totalExamens} icon="file-earmark-text" variant="success" /></Col>
      </Row>

      <DataCard title={`${filteredSessions.length} session(s)`}>
        <Row className="g-3 mb-4">
          <Col md={4}>
            <Form.Control
              placeholder="Rechercher code ou libellé…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Col>
          <Col md={2}>
            <Form.Select value={filterAnnee} onChange={(e) => setFilterAnnee(e.target.value)}>
              <option value="">Toutes années</option>
              {annees.map((a) => (
                <option key={a.id} value={a.id}>{a.libelle || a.code}</option>
              ))}
            </Form.Select>
          </Col>
          <Col md={2}>
            <Form.Select value={filterSemestre} onChange={(e) => setFilterSemestre(e.target.value)}>
              <option value="">Tous semestres</option>
              <option value="1">Semestre 1</option>
              <option value="2">Semestre 2</option>
            </Form.Select>
          </Col>
          <Col md={2}>
            <Form.Select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}>
              <option value="">Tous statuts</option>
              <option value="planifiee">Planifiée</option>
              <option value="en_cours">En cours</option>
              <option value="cloturee">Clôturée</option>
              <option value="validee">Validée</option>
            </Form.Select>
          </Col>
          <Col md={2} className="text-end">
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
                <th>Code</th>
                <th>Session</th>
                <th>Type</th>
                <th>Année / S</th>
                <th>Période</th>
                <th className="text-center">Examens</th>
                <th className="text-center">Statut</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.length === 0 ? (
                <tr><td colSpan={8} className="text-center text-muted py-4">Aucune session.</td></tr>
              ) : (
                filteredSessions.map((session) => (
                  <tr key={session.id}>
                    <td className="fw-medium text-primary">{session.code}</td>
                    <td>{session.libelle}</td>
                    <td>
                      <Badge bg={session.type_session === 'normale' ? 'primary' : 'warning'}>
                        {session.type_session === 'normale' ? 'Normale' : 'Rattrapage'}
                      </Badge>
                    </td>
                    <td>
                      <div>{anneeMap.get(session.annee_academique_id)?.libelle ?? `#${session.annee_academique_id}`}</div>
                      <Badge bg="secondary">S{session.semestre}</Badge>
                    </td>
                    <td>
                      <small>{session.date_debut} → {session.date_fin}</small>
                    </td>
                    <td className="text-center">{examCounts[session.id] ?? 0}</td>
                    <td className="text-center">{statutBadge(session.statut)}</td>
                    <td className="text-end">
                      {canUpdate && session.statut === 'planifiee' && (
                        <Button
                          variant="outline-success"
                          size="sm"
                          className="me-1"
                          title="Ouvrir"
                          onClick={() => runAction('Session ouverte.', () => sessionExamenService.ouvrirSession(session.id))}
                        >
                          <i className="bi bi-play-fill"></i>
                        </Button>
                      )}
                      {canUpdate && session.statut === 'en_cours' && (
                        <Button
                          variant="outline-warning"
                          size="sm"
                          className="me-1"
                          title="Clôturer"
                          onClick={() => runAction('Session clôturée.', () => sessionExamenService.cloturerSession(session.id))}
                        >
                          <i className="bi bi-stop-fill"></i>
                        </Button>
                      )}
                      {canValidateSession && session.statut === 'cloturee' && (
                        <Button
                          variant="outline-success"
                          size="sm"
                          className="me-1"
                          title="Valider"
                          onClick={() => runAction('Session validée.', () => sessionExamenService.validerSession(session.id))}
                        >
                          <i className="bi bi-check-lg"></i>
                        </Button>
                      )}
                      {canUpdate && session.statut !== 'validee' && (
                        <Button variant="outline-primary" size="sm" className="me-1" onClick={() => openEdit(session)}>
                          <i className="bi bi-pencil"></i>
                        </Button>
                      )}
                      {canDelete && user?.is_superuser && session.statut === 'planifiee' && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => {
                            if (window.confirm('Supprimer cette session ?')) {
                              runAction('Session supprimée.', () => sessionExamenService.deleteSession(session.id));
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
          <Modal.Title>{editing ? 'Modifier la session' : 'Nouvelle session'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row className="g-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Code</Form.Label>
                  <Form.Control
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={8}>
                <Form.Group>
                  <Form.Label>Libellé</Form.Label>
                  <Form.Control
                    value={formData.libelle}
                    onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Année académique</Form.Label>
                  <Form.Select
                    value={formData.annee_academique_id || ''}
                    onChange={(e) => setFormData({ ...formData, annee_academique_id: Number(e.target.value) })}
                    required
                  >
                    <option value="">Sélectionner…</option>
                    {annees.map((a) => (
                      <option key={a.id} value={a.id}>{a.libelle || a.code}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Type</Form.Label>
                  <Form.Select
                    value={formData.type_session}
                    onChange={(e) => setFormData({ ...formData, type_session: e.target.value as 'normale' | 'rattrapage' })}
                  >
                    <option value="normale">Normale</option>
                    <option value="rattrapage">Rattrapage</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Semestre</Form.Label>
                  <Form.Select
                    value={formData.semestre}
                    onChange={(e) => setFormData({ ...formData, semestre: Number(e.target.value) as 1 | 2 })}
                  >
                    <option value={1}>Semestre 1</option>
                    <option value={2}>Semestre 2</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Date début</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.date_debut}
                    onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Date fin</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.date_fin}
                    onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Limite saisie notes</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.date_limite_saisie_notes ?? ''}
                    onChange={(e) => setFormData({ ...formData, date_limite_saisie_notes: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Date délibération</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.date_deliberation ?? ''}
                    onChange={(e) => setFormData({ ...formData, date_deliberation: e.target.value })}
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

export default SessionsPage;
