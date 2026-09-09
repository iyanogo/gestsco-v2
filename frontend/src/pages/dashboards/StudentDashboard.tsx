import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Badge, ListGroup, ProgressBar, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/layouts';
import { StatCard, DataCard, Avatar } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import portalService, { MesProfilResponse, MesResultatsResponse } from '../../services/portalService';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [profil, setProfil] = useState<MesProfilResponse | null>(null);
  const [resultats, setResultats] = useState<MesResultatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [absences, setAbsences] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [profilData, resultatsData, presencesTaux] = await Promise.all([
          portalService.getMesProfil(),
          portalService.getMesResultats().catch(() => null),
          portalService.getMesPresencesTaux().catch(() => null),
        ]);
        setProfil(profilData);
        setResultats(resultatsData);
        if (presencesTaux) {
          setAbsences(presencesTaux.absences);
        }
      } catch (err: unknown) {
        const message =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
            : null;
        setError(typeof message === 'string' ? message : 'Impossible de charger votre espace étudiant.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const etudiant = profil?.etudiant;
  const inscription = profil?.inscription_active;
  const latestSemestre = resultats?.semestres?.[0];
  const displayName = etudiant?.full_name || user?.full_name || user?.email || 'Étudiant';

  const stats = {
    moyenne: latestSemestre?.moyenne_generale != null ? Number(latestSemestre.moyenne_generale).toFixed(1) : '-',
    credits: latestSemestre?.total_credits_obtenus ?? 0,
    totalCredits: latestSemestre?.total_credits_inscrits ?? 0,
    rank: latestSemestre?.rang ?? '-',
    absences,
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="text-muted mt-3">Chargement de votre espace…</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <PageHeader
        title="Mon espace étudiant"
        subtitle={`Bienvenue, ${displayName}`}
        breadcrumbs={[{ label: 'Tableau de bord' }]}
      />

      {error && <Alert variant="warning" className="mb-4">{error}</Alert>}

      <Card className="student-profile-card mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col xs="auto">
              <Avatar name={displayName} size="xl" className="profile-avatar" />
            </Col>
            <Col>
              <h4 className="mb-1">{displayName}</h4>
              <div className="matricule mb-2">
                <i className="bi bi-person-badge me-2"></i>
                Matricule: {etudiant?.matricule ?? '-'}
              </div>
              <div className="d-flex flex-wrap gap-3">
                {inscription && (
                  <>
                    <Badge bg="light" text="dark" className="px-3 py-2">
                      <i className="bi bi-mortarboard me-1"></i>
                      Niveau {inscription.niveau_id} - Filière {inscription.filiere_id}
                    </Badge>
                    <Badge bg="light" text="dark" className="px-3 py-2">
                      <i className="bi bi-calendar me-1"></i>
                      {inscription.annee_academique}
                    </Badge>
                    <Badge bg="success" className="px-3 py-2">
                      {inscription.statut_inscription}
                    </Badge>
                  </>
                )}
              </div>
            </Col>
            <Col xs="auto" className="d-none d-md-block">
              <Link to="/etudiant/profil" className="btn btn-light">
                <i className="bi bi-pencil me-2"></i>
                Mon profil
              </Link>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row className="g-3 mb-4">
        <Col sm={6} xl={3}>
          <StatCard title="Moyenne générale" value={`${stats.moyenne}/20`} icon="graph-up" variant="student" />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard
            title="Crédits validés"
            value={stats.totalCredits ? `${stats.credits}/${stats.totalCredits}` : '-'}
            icon="award"
            variant="success"
          />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard title="Classement" value={stats.rank !== '-' ? `${stats.rank}ème` : '-'} icon="trophy" variant="info" />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard title="Absences" value={stats.absences} icon="calendar-x" variant="warning" />
        </Col>
      </Row>

      <Row className="g-4">
        <Col lg={8}>
          <DataCard
            title="Accès rapides"
            actions={
              <Link to="/etudiant/emploi-temps" className="btn btn-sm btn-outline-primary">
                <i className="bi bi-calendar3 me-1"></i>
                Mon emploi du temps
              </Link>
            }
          >
            <Row className="g-3">
              <Col xs={6} md={4}>
                <Link to="/etudiant/notes" className="text-decoration-none">
                  <Card className="h-100 border-0 bg-light text-center p-3">
                    <i className="bi bi-bar-chart fs-2 text-primary d-block mb-2"></i>
                    <span className="fw-medium">Mes résultats</span>
                  </Card>
                </Link>
              </Col>
              <Col xs={6} md={4}>
                <Link to="/etudiant/emploi-temps" className="text-decoration-none">
                  <Card className="h-100 border-0 bg-light text-center p-3">
                    <i className="bi bi-calendar3 fs-2 text-info d-block mb-2"></i>
                    <span className="fw-medium">Mon EDT</span>
                  </Card>
                </Link>
              </Col>
              <Col xs={6} md={4}>
                <Link to="/etudiant/bulletins" className="text-decoration-none">
                  <Card className="h-100 border-0 bg-light text-center p-3">
                    <i className="bi bi-file-earmark-text fs-2 text-secondary d-block mb-2"></i>
                    <span className="fw-medium">Mes bulletins</span>
                  </Card>
                </Link>
              </Col>
              <Col xs={6} md={4}>
                <Link to="/etudiant/presences" className="text-decoration-none">
                  <Card className="h-100 border-0 bg-light text-center p-3">
                    <i className="bi bi-check2-square fs-2 text-warning d-block mb-2"></i>
                    <span className="fw-medium">Mes présences</span>
                  </Card>
                </Link>
              </Col>
              <Col xs={6} md={4}>
                <Link to="/etudiant/finances/compte" className="text-decoration-none">
                  <Card className="h-100 border-0 bg-light text-center p-3">
                    <i className="bi bi-wallet2 fs-2 text-success d-block mb-2"></i>
                    <span className="fw-medium">Mes finances</span>
                  </Card>
                </Link>
              </Col>
            </Row>
          </DataCard>
        </Col>

        <Col lg={4}>
          <DataCard title="Inscription active">
            {inscription ? (
              <ListGroup variant="flush">
                <ListGroup.Item className="d-flex justify-content-between px-0">
                  <span className="text-muted">Année</span>
                  <span className="fw-medium">{inscription.annee_academique}</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between px-0">
                  <span className="text-muted">Type</span>
                  <span className="fw-medium">{inscription.type_inscription}</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between px-0">
                  <span className="text-muted">Statut</span>
                  <Badge bg="success">{inscription.statut_inscription}</Badge>
                </ListGroup.Item>
                <ListGroup.Item className="px-0">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Frais payés</span>
                    <span>{Math.round((inscription.frais_payes ?? 0) / (inscription.frais_inscription || 1) * 100)}%</span>
                  </div>
                  <ProgressBar
                    now={((inscription.frais_payes ?? 0) / (inscription.frais_inscription || 1)) * 100}
                    variant="success"
                    style={{ height: '8px' }}
                  />
                </ListGroup.Item>
              </ListGroup>
            ) : (
              <p className="text-muted mb-0">Aucune inscription active.</p>
            )}
          </DataCard>
        </Col>
      </Row>
    </div>
  );
};

export default StudentDashboard;
