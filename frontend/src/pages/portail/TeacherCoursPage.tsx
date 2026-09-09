import React, { useEffect, useState } from 'react';
import { Alert, Badge, Col, Row, Spinner, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/layouts';
import { DataCard } from '../../components/ui';
import portalService, { type EnseignementScope } from '../../services/portalService';

const TeacherCoursPage: React.FC = () => {
  const [scope, setScope] = useState<EnseignementScope[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await portalService.getMesMatieresEnseignement();
        setScope(data);
      } catch (err: unknown) {
        const message =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
            : null;
        setError(typeof message === 'string' ? message : 'Impossible de charger vos cours.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="fade-in">
      <PageHeader
        title="Mes cours"
        subtitle="Matières et niveaux déduits de votre emploi du temps"
        breadcrumbs={[
          { label: 'Tableau de bord', path: '/enseignant/dashboard' },
          { label: 'Mes cours' },
        ]}
      />

      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      )}

      {error && <Alert variant="warning">{error}</Alert>}

      {!loading && !error && (
        <>
          <Row className="g-3 mb-4">
            <Col sm={6} xl={3}>
              <DataCard title="Matières enseignées">
                <div className="display-6 fw-bold text-primary">
                  {new Set(scope.map((s) => s.matiere_id)).size}
                </div>
              </DataCard>
            </Col>
            <Col sm={6} xl={3}>
              <DataCard title="Périmètres (matière × niveau)">
                <div className="display-6 fw-bold text-primary">{scope.length}</div>
              </DataCard>
            </Col>
          </Row>

          <DataCard title={`${scope.length} cours actif(s)`}>
            {scope.length === 0 ? (
              <p className="text-muted mb-0 text-center py-4">
                Aucune matière assignée - vérifiez votre emploi du temps.
              </p>
            ) : (
              <Table responsive hover className="data-table mb-0">
                <thead>
                  <tr>
                    <th>Matière</th>
                    <th>Niveau</th>
                    <th>Filière</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {scope.map((row) => {
                    const key = `${row.matiere_id}-${row.niveau_id}-${row.filiere_id ?? 'all'}`;
                    const matiereLabel =
                      row.matiere_libelle || row.matiere_code || `Matière #${row.matiere_id}`;
                    const niveauLabel =
                      row.niveau_libelle || row.niveau_code || `Niveau #${row.niveau_id}`;
                    const filiereLabel =
                      row.filiere_libelle || row.filiere_code || (row.filiere_id ? `#${row.filiere_id}` : '-');

                    return (
                      <tr key={key}>
                        <td>
                          <div className="fw-medium">{matiereLabel}</div>
                          {row.matiere_code && (
                            <Badge bg="light" text="dark" className="mt-1">
                              {row.matiere_code}
                            </Badge>
                          )}
                        </td>
                        <td>{niveauLabel}</td>
                        <td>{filiereLabel}</td>
                        <td className="text-end">
                          <Link
                            to="/enseignant/notes/saisie"
                            className="btn btn-sm btn-outline-primary me-1"
                          >
                            Saisir notes
                          </Link>
                          <Link
                            to={`/enseignant/etudiants?matiere=${row.matiere_id}&niveau=${row.niveau_id}`}
                            className="btn btn-sm btn-outline-secondary"
                          >
                            Étudiants
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </DataCard>
        </>
      )}
    </div>
  );
};

export default TeacherCoursPage;
