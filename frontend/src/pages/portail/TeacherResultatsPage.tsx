import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Card, Col, Form, Row, Spinner, Table } from 'react-bootstrap';
import { PageHeader } from '../../components/layouts';
import { DataCard } from '../../components/ui';
import portalService, { type EnseignementScope } from '../../services/portalService';
import { resultatService, type TeacherMatiereResultatsResponse } from '../../services/resultatService';
import { sessionExamenService } from '../../services/sessionExamenService';
import { DECISION_LABELS, type SessionExamen } from '../../types/evaluation';

const formatNote = (value?: number | null) =>
  value != null ? value.toFixed(2) : '-';

const statutBadge = (statut: string) => {
  if (statut === 'valide') return <Badge bg="success">Validé</Badge>;
  if (statut === 'non_valide') return <Badge bg="danger">Non validé</Badge>;
  return <Badge bg="secondary">{statut || 'En cours'}</Badge>;
};

const TeacherResultatsPage: React.FC = () => {
  const [sessions, setSessions] = useState<SessionExamen[]>([]);
  const [scope, setScope] = useState<EnseignementScope[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [selectedScopeKey, setSelectedScopeKey] = useState('');
  const [data, setData] = useState<TeacherMatiereResultatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingResultats, setLoadingResultats] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedScope = useMemo(() => {
    if (!selectedScopeKey) return null;
    const [matiereId, niveauId] = selectedScopeKey.split('-').map(Number);
    return scope.find((s) => s.matiere_id === matiereId && s.niveau_id === niveauId) ?? null;
  }, [scope, selectedScopeKey]);

  useEffect(() => {
    const loadRefs = async () => {
      try {
        setLoading(true);
        const [sessionData, scopeData] = await Promise.all([
          sessionExamenService.getSessions({ limit: 100 }),
          portalService.getMesMatieresEnseignement(),
        ]);
        setSessions(sessionData);
        setScope(scopeData);
        if (scopeData.length > 0) {
          setSelectedScopeKey(`${scopeData[0].matiere_id}-${scopeData[0].niveau_id}`);
        }
      } catch {
        setError('Impossible de charger les données de référence.');
      } finally {
        setLoading(false);
      }
    };
    loadRefs();
  }, []);

  const loadResultats = useCallback(async () => {
    if (!selectedSessionId || !selectedScope) return;
    setLoadingResultats(true);
    setError(null);
    try {
      const response = await resultatService.getMesResultatsMatieresEnseignement({
        session_id: Number(selectedSessionId),
        matiere_id: selectedScope.matiere_id,
        niveau_id: selectedScope.niveau_id,
      });
      setData(response);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : null;
      setError(typeof message === 'string' ? message : 'Impossible de charger les résultats.');
      setData(null);
    } finally {
      setLoadingResultats(false);
    }
  }, [selectedSessionId, selectedScope]);

  useEffect(() => {
    if (selectedSessionId && selectedScope) {
      loadResultats();
    }
  }, [loadResultats, selectedSessionId, selectedScope]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="fade-in">
      <PageHeader
        title="Résultats de mes matières"
        subtitle="Consultation en lecture seule - résultats déjà calculés par la scolarité"
        breadcrumbs={[
          { label: 'Tableau de bord', path: '/enseignant/dashboard' },
          { label: 'Résultats' },
        ]}
      />

      <Alert variant="info" className="mb-4">
        Les moyennes et décisions affichées proviennent du calcul backend (
        <code>/api/v1/resultats/calculer/*</code>). Aucune modification n&apos;est possible depuis ce portail.
      </Alert>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Session</Form.Label>
                <Form.Select
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                >
                  <option value="">Sélectionner...</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.libelle} (S{s.semestre}) - {s.statut}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={5}>
              <Form.Group>
                <Form.Label>Matière / Niveau</Form.Label>
                <Form.Select
                  value={selectedScopeKey}
                  onChange={(e) => setSelectedScopeKey(e.target.value)}
                >
                  <option value="">Sélectionner...</option>
                  {scope.map((row) => (
                    <option
                      key={`${row.matiere_id}-${row.niveau_id}`}
                      value={`${row.matiere_id}-${row.niveau_id}`}
                    >
                      {row.matiere_libelle || row.matiere_code} - {row.niveau_libelle || row.niveau_code}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {!selectedSessionId || !selectedScope ? (
        <Alert variant="secondary">Sélectionnez une session et une matière enseignée.</Alert>
      ) : loadingResultats ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : data ? (
        <>
          <Row className="g-3 mb-4">
            <Col md={3}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <div className="text-muted small">Effectif</div>
                  <div className="fs-4 fw-semibold">{data.effectif}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <div className="text-muted small">Validés</div>
                  <div className="fs-4 fw-semibold">{data.nb_valides}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <div className="text-muted small">Taux de réussite</div>
                  <div className="fs-4 fw-semibold">{data.taux_reussite}%</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <div className="text-muted small">Moyenne classe</div>
                  <div className="fs-4 fw-semibold">
                    {data.moyenne_classe != null ? formatNote(data.moyenne_classe) : '-'}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <DataCard title="Détail par étudiant">
            {data.resultats.length === 0 ? (
              <p className="text-muted mb-0 text-center py-4">
                Aucun résultat calculé pour cette matière et cette session.
              </p>
            ) : (
              <Table responsive hover className="data-table mb-0">
                <thead>
                  <tr>
                    <th>Matricule</th>
                    <th>Étudiant</th>
                    <th>CC</th>
                    <th>TP</th>
                    <th>Examen</th>
                    <th>Moyenne</th>
                    <th>Statut</th>
                    <th>Décision</th>
                  </tr>
                </thead>
                <tbody>
                  {data.resultats.map((r) => (
                    <tr key={r.id}>
                      <td>{r.matricule || '-'}</td>
                      <td>
                        {r.nom} {r.prenom}
                      </td>
                      <td>{formatNote(r.note_cc)}</td>
                      <td>{formatNote(r.note_tp)}</td>
                      <td>{formatNote(r.note_examen)}</td>
                      <td className="fw-medium">{formatNote(r.moyenne_matiere)}</td>
                      <td>{statutBadge(r.statut)}</td>
                      <td>
                        {r.decision
                          ? DECISION_LABELS[r.decision as keyof typeof DECISION_LABELS] || r.decision
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </DataCard>
        </>
      ) : null}
    </div>
  );
};

export default TeacherResultatsPage;
