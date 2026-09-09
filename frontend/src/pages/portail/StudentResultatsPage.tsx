import React, { useEffect, useState } from 'react';
import { Card, Table, Badge, Spinner, Alert } from 'react-bootstrap';
import { PageHeader } from '../../components/layouts';
import portalService, { MesResultatsResponse } from '../../services/portalService';

const StudentResultatsPage: React.FC = () => {
  const [data, setData] = useState<MesResultatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await portalService.getMesResultats();
        setData(result);
      } catch (err: unknown) {
        const message =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
            : null;
        setError(typeof message === 'string' ? message : 'Impossible de charger vos résultats.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const latestSemestre = data?.semestres?.[0];
  const latestAnnuel = data?.annuels?.[0];

  return (
    <div className="fade-in">
      <PageHeader
        title="Mes résultats"
        subtitle="Consultez vos résultats semestriels et par matière"
        breadcrumbs={[
          { label: 'Tableau de bord', path: '/etudiant/dashboard' },
          { label: 'Mes résultats' },
        ]}
      />

      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {!loading && !error && data && (
        <>
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <Card.Title className="text-muted small">Moyenne semestre récent</Card.Title>
                  <div className="fs-3 fw-bold text-primary">
                    {latestSemestre?.moyenne_generale != null
                      ? `${Number(latestSemestre.moyenne_generale).toFixed(2)}/20`
                      : '-'}
                  </div>
                  {latestSemestre?.mention && (
                    <Badge bg="light" text="dark" className="mt-2">
                      {latestSemestre.mention}
                    </Badge>
                  )}
                </Card.Body>
              </Card>
            </div>
            <div className="col-md-4">
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <Card.Title className="text-muted small">Crédits obtenus</Card.Title>
                  <div className="fs-3 fw-bold text-success">
                    {latestSemestre
                      ? `${latestSemestre.total_credits_obtenus ?? 0}/${latestSemestre.total_credits_inscrits ?? 0}`
                      : '-'}
                  </div>
                </Card.Body>
              </Card>
            </div>
            <div className="col-md-4">
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <Card.Title className="text-muted small">Moyenne annuelle</Card.Title>
                  <div className="fs-3 fw-bold text-info">
                    {latestAnnuel?.moyenne_annuelle != null
                      ? `${Number(latestAnnuel.moyenne_annuelle).toFixed(2)}/20`
                      : '-'}
                  </div>
                  {latestAnnuel?.decision && (
                    <Badge bg="secondary" className="mt-2">
                      {latestAnnuel.decision}
                    </Badge>
                  )}
                </Card.Body>
              </Card>
            </div>
          </div>

          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white">
              <strong>Résultats semestriels</strong>
            </Card.Header>
            <Card.Body className="p-0">
              {data.semestres.length === 0 ? (
                <p className="text-muted p-4 mb-0">Aucun résultat semestriel disponible.</p>
              ) : (
                <Table responsive hover className="mb-0">
                  <thead>
                    <tr>
                      <th>Semestre</th>
                      <th>Moyenne</th>
                      <th>Crédits</th>
                      <th>Mention</th>
                      <th>Décision</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.semestres.map((r) => (
                      <tr key={r.id}>
                        <td>S{r.semestre}</td>
                        <td>{r.moyenne_generale != null ? Number(r.moyenne_generale).toFixed(2) : '-'}</td>
                        <td>
                          {r.total_credits_obtenus ?? 0}/{r.total_credits_inscrits ?? 0}
                        </td>
                        <td>{r.mention ?? '-'}</td>
                        <td>{r.decision ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white">
              <strong>Résultats par matière</strong>
            </Card.Header>
            <Card.Body className="p-0">
              {data.matieres.length === 0 ? (
                <p className="text-muted p-4 mb-0">Aucun résultat par matière disponible.</p>
              ) : (
                <Table responsive hover className="mb-0">
                  <thead>
                    <tr>
                      <th>Matière</th>
                      <th>Moyenne</th>
                      <th>Crédit</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.matieres.map((r) => (
                      <tr key={r.id}>
                        <td>{r.matiere_id}</td>
                        <td>{r.moyenne_matiere != null ? Number(r.moyenne_matiere).toFixed(2) : '-'}</td>
                        <td>{r.credit_obtenu ?? '-'}</td>
                        <td>{r.statut ?? '-'}</td>
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

export default StudentResultatsPage;
