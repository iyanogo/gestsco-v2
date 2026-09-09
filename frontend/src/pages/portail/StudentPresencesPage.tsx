import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Card, Col, Form, ProgressBar, Row, Spinner, Table } from 'react-bootstrap';
import { PageHeader } from '../../components/layouts';
import portalService from '../../services/portalService';
import type { Presence, StatistiquesPresence } from '../../types/emploiTemps';
import { STATUTS_PRESENCE } from '../../types/emploiTemps';
import { formatDate } from '../../utils/formatters';

type Periode = 'semaine' | 'mois' | 'semestre';

function getDateRange(periode: Periode): { date_debut: string; date_fin: string } {
  const now = new Date();
  const date_fin = now.toISOString().split('T')[0];
  const start = new Date(now);

  if (periode === 'semaine') {
    start.setDate(start.getDate() - 7);
  } else if (periode === 'mois') {
    start.setMonth(start.getMonth() - 1);
  } else {
    start.setMonth(start.getMonth() - 6);
  }

  return { date_debut: start.toISOString().split('T')[0], date_fin };
}

function statutLabel(statut: string): string {
  return STATUTS_PRESENCE.find((s) => s.value === statut)?.label ?? statut;
}

function statutVariant(statut: string): string {
  switch (statut) {
    case 'present':
      return 'success';
    case 'retard':
      return 'warning';
    case 'absent_justifie':
      return 'info';
    case 'absent':
      return 'danger';
    default:
      return 'secondary';
  }
}

const StudentPresencesPage: React.FC = () => {
  const [periode, setPeriode] = useState<Periode>('mois');
  const [stats, setStats] = useState<StatistiquesPresence | null>(null);
  const [presences, setPresences] = useState<Presence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dateRange = useMemo(() => getDateRange(periode), [periode]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [taux, historique] = await Promise.all([
          portalService.getMesPresencesTaux(dateRange),
          portalService.getMesPresences(dateRange),
        ]);
        setStats(taux);
        setPresences(historique);
      } catch (err: unknown) {
        const message =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
            : null;
        setError(typeof message === 'string' ? message : 'Impossible de charger vos présences.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [dateRange]);

  const tauxVariant =
    stats && stats.taux_presence >= 90
      ? 'success'
      : stats && stats.taux_presence >= 70
        ? 'warning'
        : 'danger';

  return (
    <div className="fade-in">
      <PageHeader
        title="Mes présences"
        subtitle="Taux de présence et historique (lecture seule)"
        breadcrumbs={[
          { label: 'Tableau de bord', path: '/etudiant/dashboard' },
          { label: 'Mes présences' },
        ]}
      />

      <Row className="mb-3">
        <Col md={4}>
          <Form.Select
            value={periode}
            onChange={(e) => setPeriode(e.target.value as Periode)}
            aria-label="Période"
          >
            <option value="semaine">7 derniers jours</option>
            <option value="mois">30 derniers jours</option>
            <option value="semestre">6 derniers mois</option>
          </Form.Select>
        </Col>
      </Row>

      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {!loading && !error && stats && (
        <>
          <Row className="g-3 mb-4">
            <Col md={4}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <Card.Title className="text-muted small">Taux de présence</Card.Title>
                  <div className="fs-2 fw-bold mb-2">{stats.taux_presence.toFixed(1)} %</div>
                  <ProgressBar
                    now={Math.min(stats.taux_presence, 100)}
                    variant={tauxVariant}
                    style={{ height: '10px' }}
                  />
                  {stats.taux_presence < 70 && (
                    <Alert variant="warning" className="mt-3 mb-0 py-2 small">
                      Taux de présence insuffisant
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            </Col>
            <Col md={8}>
              <Row className="g-3">
                {[
                  { label: 'Séances', value: stats.total_seances, variant: 'secondary' },
                  { label: 'Présences', value: stats.presences, variant: 'success' },
                  { label: 'Absences', value: stats.absences, variant: 'danger' },
                  { label: 'Retards', value: stats.retards, variant: 'warning' },
                ].map((item) => (
                  <Col xs={6} md={3} key={item.label}>
                    <Card className="border-0 shadow-sm text-center h-100">
                      <Card.Body>
                        <div className={`fs-4 fw-bold text-${item.variant}`}>{item.value}</div>
                        <div className="text-muted small">{item.label}</div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Col>
          </Row>

          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white">
              <strong>Historique par séance</strong>
            </Card.Header>
            <Card.Body className="p-0">
              {presences.length === 0 ? (
                <p className="text-muted p-4 mb-0">Aucune présence enregistrée sur cette période.</p>
              ) : (
                <Table responsive hover className="mb-0">
                  <thead>
                    <tr>
                      <th>Date saisie</th>
                      <th>Séance</th>
                      <th>Statut</th>
                      <th>Observation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {presences.map((p) => (
                      <tr key={p.id}>
                        <td>{formatDate(p.date_saisie ?? null)}</td>
                        <td>#{p.seance_id}</td>
                        <td>
                          <Badge bg={statutVariant(p.statut)}>{statutLabel(p.statut)}</Badge>
                        </td>
                        <td>{p.observation || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </>
      )}
    </div>
  );
};

export default StudentPresencesPage;
