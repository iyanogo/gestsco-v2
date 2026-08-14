import React from 'react';
import { Row, Col, Card, Badge, Button, ListGroup, ProgressBar } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/layouts';
import { StatCard, DataCard, Avatar } from '../../components/ui';

interface UpcomingClass {
  id: number;
  subject: string;
  teacher: string;
  room: string;
  time: string;
  date: string;
}

interface Grade {
  id: number;
  subject: string;
  type: string;
  grade: number;
  maxGrade: number;
  date: string;
}

const StudentDashboard: React.FC = () => {
  const studentInfo = {
    name: 'Amadou Diallo',
    matricule: '2024-0125',
    filiere: 'Licence 3 Informatique',
    annee: '2024-2025'
  };

  const stats = {
    moyenne: 14.5,
    credits: 45,
    totalCredits: 60,
    absences: 3,
    rank: 12
  };

  const todayClasses: UpcomingClass[] = [
    { id: 1, subject: 'Algorithmique avancée', teacher: 'Dr. BOUDA', room: 'Salle 101', time: '08:00 - 10:00', date: "Aujourd'hui" },
    { id: 2, subject: 'Base de données', teacher: 'M. OUEDRAOGO', room: 'Salle 205', time: '10:15 - 12:15', date: "Aujourd'hui" },
    { id: 3, subject: 'Réseaux informatiques', teacher: 'Dr. SANOGO', room: 'Labo Réseau', time: '14:00 - 16:00', date: "Aujourd'hui" }
  ];

  const recentGrades: Grade[] = [
    { id: 1, subject: 'Algorithmique avancée', type: 'Examen', grade: 15, maxGrade: 20, date: '03/01/2026' },
    { id: 2, subject: 'Base de données', type: 'TP', grade: 16, maxGrade: 20, date: '02/01/2026' },
    { id: 3, subject: 'Programmation Web', type: 'Projet', grade: 14, maxGrade: 20, date: '28/12/2025' },
    { id: 4, subject: 'Réseaux', type: 'Contrôle', grade: 12, maxGrade: 20, date: '20/12/2025' }
  ];

  const financialStatus = {
    totalDue: 450000,
    totalPaid: 300000,
    remaining: 150000,
    nextDeadline: '15/01/2026'
  };

  const getGradeColor = (grade: number, max: number) => {
    const percentage = (grade / max) * 100;
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'info';
    if (percentage >= 50) return 'warning';
    return 'danger';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Mon espace étudiant"
        subtitle={`Bienvenue, ${studentInfo.name}`}
        breadcrumbs={[{ label: 'Tableau de bord' }]}
      />

      {/* Carte profil étudiant */}
      <Card className="student-profile-card mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col xs="auto">
              <Avatar name={studentInfo.name} size="xl" className="profile-avatar" />
            </Col>
            <Col>
              <h4 className="mb-1">{studentInfo.name}</h4>
              <div className="matricule mb-2">
                <i className="bi bi-person-badge me-2"></i>
                Matricule: {studentInfo.matricule}
              </div>
              <div className="d-flex flex-wrap gap-3">
                <Badge bg="light" text="dark" className="px-3 py-2">
                  <i className="bi bi-mortarboard me-1"></i>
                  {studentInfo.filiere}
                </Badge>
                <Badge bg="light" text="dark" className="px-3 py-2">
                  <i className="bi bi-calendar me-1"></i>
                  {studentInfo.annee}
                </Badge>
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

      {/* Statistiques */}
      <Row className="g-3 mb-4">
        <Col sm={6} xl={3}>
          <StatCard
            title="Moyenne générale"
            value={`${stats.moyenne}/20`}
            icon="graph-up"
            variant="student"
          />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard
            title="Crédits validés"
            value={`${stats.credits}/${stats.totalCredits}`}
            icon="award"
            variant="success"
          />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard
            title="Classement"
            value={`${stats.rank}ème`}
            icon="trophy"
            variant="info"
          />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard
            title="Absences"
            value={stats.absences}
            icon="calendar-x"
            variant={stats.absences > 5 ? 'danger' : 'warning'}
          />
        </Col>
      </Row>

      <Row className="g-4">
        {/* Emploi du temps du jour */}
        <Col lg={8}>
          <DataCard
            title="Cours du jour"
            actions={
              <Link to="/etudiant/emploi-temps" className="btn btn-sm btn-outline-primary">
                <i className="bi bi-calendar3 me-1"></i>
                Voir planning
              </Link>
            }
          >
            {todayClasses.length > 0 ? (
              <div className="schedule-widget">
                {todayClasses.map((course, index) => (
                  <div key={course.id} className={`schedule-item ${index === 0 ? 'current' : ''}`}>
                    <div>
                      <div className="schedule-subject">{course.subject}</div>
                      <div className="text-muted small">
                        <i className="bi bi-person me-1"></i>{course.teacher}
                        <span className="mx-2">•</span>
                        <i className="bi bi-geo-alt me-1"></i>{course.room}
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="schedule-time">{course.time}</div>
                      {index === 0 && (
                        <Badge bg="success" className="mt-1">En cours</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted">
                <i className="bi bi-calendar-x fs-1 d-block mb-2"></i>
                Aucun cours prévu aujourd'hui
              </div>
            )}
          </DataCard>
        </Col>

        {/* Situation financière */}
        <Col lg={4}>
          <DataCard
            title="Ma situation financière"
            actions={
              <Link to="/etudiant/finances/compte" className="btn btn-sm btn-outline-primary">
                Détails
              </Link>
            }
          >
            <div className="mb-4">
              <div className="d-flex justify-content-between mb-2">
                <span>Progression des paiements</span>
                <span className="fw-bold">
                  {Math.round((financialStatus.totalPaid / financialStatus.totalDue) * 100)}%
                </span>
              </div>
              <ProgressBar
                now={(financialStatus.totalPaid / financialStatus.totalDue) * 100}
                variant="success"
                style={{ height: '10px' }}
              />
            </div>

            <ListGroup variant="flush">
              <ListGroup.Item className="d-flex justify-content-between px-0">
                <span className="text-muted">Total dû</span>
                <span className="fw-medium">{formatCurrency(financialStatus.totalDue)}</span>
              </ListGroup.Item>
              <ListGroup.Item className="d-flex justify-content-between px-0">
                <span className="text-muted">Payé</span>
                <span className="fw-medium text-success">{formatCurrency(financialStatus.totalPaid)}</span>
              </ListGroup.Item>
              <ListGroup.Item className="d-flex justify-content-between px-0">
                <span className="text-muted">Reste à payer</span>
                <span className="fw-bold text-danger">{formatCurrency(financialStatus.remaining)}</span>
              </ListGroup.Item>
            </ListGroup>

            <div className="mt-3 p-3 bg-warning bg-opacity-10 rounded">
              <small className="text-warning">
                <i className="bi bi-exclamation-triangle me-1"></i>
                Prochaine échéance: {financialStatus.nextDeadline}
              </small>
            </div>

            <Button variant="primary" className="w-100 mt-3">
              <i className="bi bi-credit-card me-2"></i>
              Effectuer un paiement
            </Button>
          </DataCard>
        </Col>
      </Row>

      <Row className="g-4 mt-2">
        {/* Notes récentes */}
        <Col lg={6}>
          <DataCard
            title="Mes dernières notes"
            actions={
              <Link to="/etudiant/notes" className="btn btn-sm btn-outline-primary">
                Voir tout
              </Link>
            }
          >
            <div className="d-flex flex-column gap-3">
              {recentGrades.map(grade => (
                <div key={grade.id} className="grade-card">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="grade-subject">{grade.subject}</div>
                      <small className="text-muted">{grade.type} • {grade.date}</small>
                    </div>
                    <div className="text-end">
                      <span className={`grade-value grade-${getGradeColor(grade.grade, grade.maxGrade) === 'success' ? 'excellent' : getGradeColor(grade.grade, grade.maxGrade) === 'info' ? 'good' : getGradeColor(grade.grade, grade.maxGrade) === 'warning' ? 'average' : 'poor'}`}>
                        {grade.grade}
                      </span>
                      <span className="grade-max">/{grade.maxGrade}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </DataCard>
        </Col>

        {/* Actions rapides */}
        <Col lg={6}>
          <DataCard title="Accès rapides">
            <Row className="g-3">
              <Col xs={6}>
                <Link to="/etudiant/bulletins" className="text-decoration-none">
                  <Card className="h-100 border-0 bg-light text-center p-3">
                    <div className="mb-2">
                      <i className="bi bi-file-earmark-text fs-2 text-primary"></i>
                    </div>
                    <span className="fw-medium">Mes bulletins</span>
                  </Card>
                </Link>
              </Col>
              <Col xs={6}>
                <Link to="/etudiant/presences" className="text-decoration-none">
                  <Card className="h-100 border-0 bg-light text-center p-3">
                    <div className="mb-2">
                      <i className="bi bi-calendar-check fs-2 text-success"></i>
                    </div>
                    <span className="fw-medium">Mes présences</span>
                  </Card>
                </Link>
              </Col>
              <Col xs={6}>
                <Link to="/etudiant/documents/attestations" className="text-decoration-none">
                  <Card className="h-100 border-0 bg-light text-center p-3">
                    <div className="mb-2">
                      <i className="bi bi-file-earmark-check fs-2 text-info"></i>
                    </div>
                    <span className="fw-medium">Attestations</span>
                  </Card>
                </Link>
              </Col>
              <Col xs={6}>
                <Link to="/etudiant/finances/factures" className="text-decoration-none">
                  <Card className="h-100 border-0 bg-light text-center p-3">
                    <div className="mb-2">
                      <i className="bi bi-receipt fs-2 text-warning"></i>
                    </div>
                    <span className="fw-medium">Mes factures</span>
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

export default StudentDashboard;
