import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, Badge, ListGroup, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { format, startOfWeek, endOfWeek, isToday, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PageHeader } from '../../components/layouts';
import { StatCard, DataCard } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import portalService, { type EnseignementScope } from '../../services/portalService';
import type { Seance } from '../../types/emploiTemps';
import type { Stage } from '../../types/anneeAcademique';

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [seances, setSeances] = useState<Seance[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [scope, setScope] = useState<EnseignementScope[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
        const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
        const [seancesData, stagesData, scopeData] = await Promise.all([
          portalService.getMesSeances({
            date_debut: format(weekStart, 'yyyy-MM-dd'),
            date_fin: format(weekEnd, 'yyyy-MM-dd'),
          }),
          portalService.getMesStagesEncadres().catch(() => []),
          portalService.getMesMatieresEnseignement().catch(() => []),
        ]);
        setSeances(seancesData);
        setStages(stagesData);
        setScope(scopeData);
      } catch (err: unknown) {
        const message =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
            : null;
        setError(typeof message === 'string' ? message : 'Impossible de charger votre espace enseignant.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const displayName = user?.full_name || user?.email || 'Enseignant';

  const todaySeances = useMemo(
    () =>
      seances
        .filter((s) => isToday(parseISO(s.date_seance)))
        .sort((a, b) => a.date_seance.localeCompare(b.date_seance)),
    [seances]
  );

  const upcomingSeances = useMemo(
    () =>
      seances
        .filter((s) => !isToday(parseISO(s.date_seance)))
        .sort((a, b) => a.date_seance.localeCompare(b.date_seance))
        .slice(0, 5),
    [seances]
  );

  const stagesEnCours = stages.filter((s) => s.statut === 'en_cours').length;

  const scopeByMatiereNiveau = useMemo(() => {
    const map = new Map<string, EnseignementScope>();
    scope.forEach((row) => {
      map.set(`${row.matiere_id}-${row.niveau_id}`, row);
    });
    return map;
  }, [scope]);

  const seanceMatiereLabel = (seance: Seance) => {
    if (seance.matiere_libelle) return seance.matiere_libelle;
    if (seance.matiere_code) return seance.matiere_code;
    const row = scopeByMatiereNiveau.get(`${seance.matiere_id}-${seance.niveau_id}`);
    return row?.matiere_libelle || row?.matiere_code || `Matière #${seance.matiere_id}`;
  };

  const seanceNiveauLabel = (seance: Seance) => {
    const row = scopeByMatiereNiveau.get(`${seance.matiere_id}-${seance.niveau_id}`);
    return seance.niveau_libelle || row?.niveau_libelle || row?.niveau_code || `Niveau ${seance.niveau_id}`;
  };

  const stageEtudiantLabel = (stage: Stage) => {
    const name = [stage.etudiant_prenom, stage.etudiant_nom].filter(Boolean).join(' ');
    if (name) return name;
    return stage.etudiant_matricule || `#${stage.etudiant_id}`;
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
        title="Tableau de bord Enseignant"
        subtitle={`Bienvenue, ${displayName}`}
        breadcrumbs={[{ label: 'Tableau de bord' }]}
      />

      {error && <Alert variant="warning" className="mb-4">{error}</Alert>}

      <Row className="g-3 mb-4">
        <Col sm={6} xl={3}>
          <StatCard title="Séances cette semaine" value={seances.length} icon="calendar3" variant="teacher" />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard title="Cours aujourd'hui" value={todaySeances.length} icon="clock" variant="primary" />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard title="Stages encadrés" value={stages.length} icon="briefcase" variant="info" />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard title="Stages en cours" value={stagesEnCours} icon="hourglass-split" variant="warning" />
        </Col>
      </Row>

      <Row className="g-4">
        <Col lg={8}>
          <DataCard
            title="Séances du jour"
            actions={
              <Link to="/enseignant/emploi-temps" className="btn btn-sm btn-outline-primary">
                <i className="bi bi-calendar3 me-1"></i>
                Voir planning
              </Link>
            }
          >
            {todaySeances.length > 0 ? (
              <div className="d-flex flex-column gap-3">
                {todaySeances.map((seance, index) => (
                  <Card
                    key={seance.id}
                    className={`border-start border-4 ${index === 0 ? 'border-success bg-success bg-opacity-10' : 'border-primary'}`}
                  >
                    <Card.Body className="py-3">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="mb-1">
                            {seance.type_seance.toUpperCase()} - {seanceMatiereLabel(seance)}
                          </h6>
                          <div className="text-muted small">
                            <i className="bi bi-mortarboard me-1"></i>
                            {seanceNiveauLabel(seance)}
                            {seance.filiere_id && (
                              <>
                                <span className="mx-2">•</span>
                                Filière {seance.filiere_id}
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-end">
                          <Badge bg={index === 0 ? 'success' : 'secondary'} className="mb-1">
                            {seance.statut}
                          </Badge>
                          <div className="fw-medium">{seance.duree_minutes} min</div>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted">
                <i className="bi bi-calendar-x fs-1 d-block mb-2"></i>
                Aucune séance prévue aujourd'hui
              </div>
            )}

            {upcomingSeances.length > 0 && (
              <>
                <h6 className="mt-4 mb-3 text-muted">Autres séances cette semaine</h6>
                <ListGroup variant="flush">
                  {upcomingSeances.map((seance) => (
                    <ListGroup.Item key={seance.id} className="d-flex justify-content-between align-items-center px-0">
                      <div>
                        <span className="fw-medium">{seance.type_seance.toUpperCase()}</span>
                        <span className="text-muted ms-2">({seanceMatiereLabel(seance)})</span>
                      </div>
                      <div className="text-end">
                        <small className="text-muted d-block">
                          {format(parseISO(seance.date_seance), 'EEEE d MMM', { locale: fr })}
                        </small>
                        <small>{seance.duree_minutes} min</small>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </>
            )}
          </DataCard>
        </Col>

        <Col lg={4}>
          <DataCard
            title="Stages encadrés"
            actions={
              <Link to="/enseignant/stages" className="btn btn-sm btn-outline-primary">
                Voir tout
              </Link>
            }
          >
            {stages.length > 0 ? (
              <ListGroup variant="flush">
                {stages.slice(0, 5).map((stage) => (
                  <ListGroup.Item key={stage.id} className="px-0">
                    <div className="fw-medium">{stage.code}</div>
                    <small className="text-muted d-block text-truncate">{stage.theme}</small>
                    <div className="d-flex justify-content-between mt-1">
                      <small>{stageEtudiantLabel(stage)} · {stage.entreprise_nom}</small>
                      <Badge bg="secondary">{stage.statut}</Badge>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            ) : (
              <p className="text-muted mb-0 text-center py-3">Aucun stage encadré.</p>
            )}
          </DataCard>
        </Col>
      </Row>

      <Row className="g-4 mt-2">
        <Col lg={12}>
          <DataCard title="Accès rapides">
            <Row className="g-3">
              <Col xs={6} md={3}>
                <Link to="/enseignant/cours" className="text-decoration-none">
                  <Card className="h-100 border-0 bg-light text-center p-3">
                    <i className="bi bi-book fs-2 text-primary d-block mb-2"></i>
                    <span className="fw-medium">Mes cours</span>
                  </Card>
                </Link>
              </Col>
              <Col xs={6} md={3}>
                <Link to="/enseignant/emploi-temps" className="text-decoration-none">
                  <Card className="h-100 border-0 bg-light text-center p-3">
                    <i className="bi bi-calendar3 fs-2 text-primary d-block mb-2"></i>
                    <span className="fw-medium">Mon EDT</span>
                  </Card>
                </Link>
              </Col>
              <Col xs={6} md={3}>
                <Link to="/enseignant/notes/saisie" className="text-decoration-none">
                  <Card className="h-100 border-0 bg-light text-center p-3">
                    <i className="bi bi-pencil-square fs-2 text-success d-block mb-2"></i>
                    <span className="fw-medium">Saisie notes</span>
                  </Card>
                </Link>
              </Col>
              <Col xs={6} md={3}>
                <Link to="/enseignant/stages" className="text-decoration-none">
                  <Card className="h-100 border-0 bg-light text-center p-3">
                    <i className="bi bi-briefcase fs-2 text-info d-block mb-2"></i>
                    <span className="fw-medium">Mes stages</span>
                  </Card>
                </Link>
              </Col>
            </Row>
          </DataCard>
        </Col>
      </Row>
    </div>
  );
};

export default TeacherDashboard;
