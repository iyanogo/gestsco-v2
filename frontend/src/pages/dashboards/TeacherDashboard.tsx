import React from 'react';
import { Row, Col, Card, Table, Badge, Button, ListGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/layouts';
import { StatCard, DataCard } from '../../components/ui';

interface UpcomingClass {
  id: number;
  subject: string;
  class: string;
  room: string;
  time: string;
  date: string;
}

interface PendingGrade {
  id: number;
  subject: string;
  class: string;
  type: string;
  deadline: string;
  progress: number;
}

const TeacherDashboard: React.FC = () => {
  const stats = {
    totalClasses: 6,
    totalStudents: 245,
    pendingGrades: 3,
    hoursThisWeek: 18
  };

  const todayClasses: UpcomingClass[] = [
    { id: 1, subject: 'Algorithmique', class: 'L2 Info A', room: 'Salle 101', time: '08:00 - 10:00', date: "Aujourd'hui" },
    { id: 2, subject: 'Base de données', class: 'L3 Info', room: 'Salle 205', time: '10:15 - 12:15', date: "Aujourd'hui" },
    { id: 3, subject: 'Programmation Web', class: 'L2 Info B', room: 'Labo Info 2', time: '14:00 - 16:00', date: "Aujourd'hui" }
  ];

  const upcomingClasses: UpcomingClass[] = [
    { id: 4, subject: 'Algorithmique', class: 'L2 Info B', room: 'Salle 102', time: '08:00 - 10:00', date: 'Demain' },
    { id: 5, subject: 'Réseaux', class: 'L3 Info', room: 'Salle 301', time: '14:00 - 16:00', date: 'Demain' }
  ];

  const pendingGrades: PendingGrade[] = [
    { id: 1, subject: 'Algorithmique', class: 'L2 Info A', type: 'Examen', deadline: '10/01/2026', progress: 75 },
    { id: 2, subject: 'Base de données', class: 'L3 Info', type: 'TP', deadline: '12/01/2026', progress: 30 },
    { id: 3, subject: 'Programmation Web', class: 'L2 Info B', type: 'Projet', deadline: '15/01/2026', progress: 0 }
  ];

  const recentAbsences = [
    { id: 1, student: 'Moussa Traoré', class: 'L2 Info A', date: '06/01/2026', subject: 'Algorithmique' },
    { id: 2, student: 'Aminata Diallo', class: 'L3 Info', date: '05/01/2026', subject: 'Base de données' },
    { id: 3, student: 'Ibrahima Koné', class: 'L2 Info B', date: '05/01/2026', subject: 'Programmation Web' }
  ];

  return (
    <div className="fade-in">
      <PageHeader
        title="Tableau de bord Enseignant"
        subtitle="Bienvenue, Dr. Jean-François BOUDA"
        breadcrumbs={[{ label: 'Tableau de bord' }]}
      />

      {/* Statistiques */}
      <Row className="g-3 mb-4">
        <Col sm={6} xl={3}>
          <StatCard
            title="Mes classes"
            value={stats.totalClasses}
            icon="people"
            variant="teacher"
          />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard
            title="Total étudiants"
            value={stats.totalStudents}
            icon="mortarboard"
            variant="primary"
          />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard
            title="Notes à saisir"
            value={stats.pendingGrades}
            icon="pencil-square"
            variant="warning"
          />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard
            title="Heures cette semaine"
            value={`${stats.hoursThisWeek}h`}
            icon="clock"
            variant="info"
          />
        </Col>
      </Row>

      <Row className="g-4">
        {/* Cours du jour */}
        <Col lg={8}>
          <DataCard
            title="Cours du jour"
            actions={
              <Link to="/enseignant/emploi-temps" className="btn btn-sm btn-outline-primary">
                <i className="bi bi-calendar3 me-1"></i>
                Voir planning
              </Link>
            }
          >
            {todayClasses.length > 0 ? (
              <div className="d-flex flex-column gap-3">
                {todayClasses.map((course, index) => (
                  <Card key={course.id} className={`border-start border-4 ${index === 0 ? 'border-success bg-success bg-opacity-10' : 'border-primary'}`}>
                    <Card.Body className="py-3">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="mb-1">{course.subject}</h6>
                          <div className="text-muted small">
                            <i className="bi bi-people me-1"></i>{course.class}
                            <span className="mx-2">•</span>
                            <i className="bi bi-geo-alt me-1"></i>{course.room}
                          </div>
                        </div>
                        <div className="text-end">
                          <Badge bg={index === 0 ? 'success' : 'secondary'} className="mb-1">
                            {index === 0 ? 'En cours' : 'À venir'}
                          </Badge>
                          <div className="fw-medium">{course.time}</div>
                        </div>
                      </div>
                      {index === 0 && (
                        <div className="mt-3 d-flex gap-2">
                          <Button size="sm" variant="success">
                            <i className="bi bi-person-check me-1"></i>
                            Faire l'appel
                          </Button>
                          <Button size="sm" variant="outline-secondary">
                            <i className="bi bi-journal-text me-1"></i>
                            Notes de cours
                          </Button>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted">
                <i className="bi bi-calendar-x fs-1 d-block mb-2"></i>
                Aucun cours prévu aujourd'hui
              </div>
            )}

            {upcomingClasses.length > 0 && (
              <>
                <h6 className="mt-4 mb-3 text-muted">Prochains cours</h6>
                <ListGroup variant="flush">
                  {upcomingClasses.map(course => (
                    <ListGroup.Item key={course.id} className="d-flex justify-content-between align-items-center px-0">
                      <div>
                        <span className="fw-medium">{course.subject}</span>
                        <span className="text-muted ms-2">({course.class})</span>
                      </div>
                      <div className="text-end">
                        <small className="text-muted d-block">{course.date}</small>
                        <small>{course.time}</small>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </>
            )}
          </DataCard>
        </Col>

        {/* Notes en attente */}
        <Col lg={4}>
          <DataCard
            title="Notes à saisir"
            actions={
              <Link to="/enseignant/notes/saisie" className="btn btn-sm btn-outline-primary">
                Saisir
              </Link>
            }
          >
            {pendingGrades.length > 0 ? (
              <div className="d-flex flex-column gap-3">
                {pendingGrades.map(grade => (
                  <div key={grade.id} className="p-3 bg-light rounded">
                    <div className="d-flex justify-content-between mb-2">
                      <div>
                        <div className="fw-medium">{grade.subject}</div>
                        <small className="text-muted">{grade.class} • {grade.type}</small>
                      </div>
                      <Badge bg={grade.progress === 0 ? 'danger' : grade.progress < 50 ? 'warning' : 'info'}>
                        {grade.progress}%
                      </Badge>
                    </div>
                    <div className="progress" style={{ height: '6px' }}>
                      <div
                        className={`progress-bar ${grade.progress === 0 ? 'bg-danger' : grade.progress < 50 ? 'bg-warning' : 'bg-info'}`}
                        style={{ width: `${grade.progress}%` }}
                      />
                    </div>
                    <small className="text-muted mt-1 d-block">
                      <i className="bi bi-clock me-1"></i>
                      Échéance: {grade.deadline}
                    </small>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted">
                <i className="bi bi-check-circle fs-1 d-block mb-2 text-success"></i>
                Toutes les notes sont à jour
              </div>
            )}
          </DataCard>
        </Col>
      </Row>

      <Row className="g-4 mt-2">
        {/* Absences récentes */}
        <Col lg={6}>
          <DataCard
            title="Absences récentes"
            actions={
              <Link to="/enseignant/presences/historique" className="btn btn-sm btn-outline-primary">
                Voir tout
              </Link>
            }
          >
            <Table responsive hover className="data-table mb-0">
              <thead>
                <tr>
                  <th>Étudiant</th>
                  <th>Classe</th>
                  <th>Matière</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentAbsences.map(absence => (
                  <tr key={absence.id}>
                    <td className="fw-medium">{absence.student}</td>
                    <td>{absence.class}</td>
                    <td>{absence.subject}</td>
                    <td>{absence.date}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </DataCard>
        </Col>

        {/* Actions rapides */}
        <Col lg={6}>
          <DataCard title="Actions rapides">
            <Row className="g-3">
              <Col xs={6}>
                <Link to="/enseignant/presences/appel" className="text-decoration-none">
                  <Card className="h-100 border-0 bg-light text-center p-3">
                    <div className="mb-2">
                      <i className="bi bi-person-check fs-2 text-success"></i>
                    </div>
                    <span className="fw-medium">Faire l'appel</span>
                  </Card>
                </Link>
              </Col>
              <Col xs={6}>
                <Link to="/enseignant/notes/saisie" className="text-decoration-none">
                  <Card className="h-100 border-0 bg-light text-center p-3">
                    <div className="mb-2">
                      <i className="bi bi-pencil-square fs-2 text-primary"></i>
                    </div>
                    <span className="fw-medium">Saisir des notes</span>
                  </Card>
                </Link>
              </Col>
              <Col xs={6}>
                <Link to="/enseignant/etudiants" className="text-decoration-none">
                  <Card className="h-100 border-0 bg-light text-center p-3">
                    <div className="mb-2">
                      <i className="bi bi-people fs-2 text-info"></i>
                    </div>
                    <span className="fw-medium">Mes étudiants</span>
                  </Card>
                </Link>
              </Col>
              <Col xs={6}>
                <Link to="/enseignant/documents" className="text-decoration-none">
                  <Card className="h-100 border-0 bg-light text-center p-3">
                    <div className="mb-2">
                      <i className="bi bi-file-earmark-text fs-2 text-warning"></i>
                    </div>
                    <span className="fw-medium">Documents</span>
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
