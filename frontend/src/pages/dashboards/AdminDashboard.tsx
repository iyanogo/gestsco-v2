import React from 'react';
import { Row, Col, Card, Table, Badge, Button, ProgressBar } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/layouts';
import { StatCard, DataCard, Avatar } from '../../components/ui';

interface RecentStudent {
  id: number;
  name: string;
  matricule: string;
  filiere: string;
  date: string;
  status: 'active' | 'pending';
}

interface RecentPayment {
  id: number;
  student: string;
  amount: number;
  date: string;
  type: string;
}

const AdminDashboard: React.FC = () => {
  // Données simulées - à remplacer par des appels API
  const stats = {
    totalStudents: 1250,
    totalTeachers: 85,
    totalClasses: 42,
    pendingPayments: 156,
    studentsChange: 12,
    teachersChange: 3,
    paymentsChange: -8
  };

  const recentStudents: RecentStudent[] = [
    { id: 1, name: 'Amadou Diallo', matricule: '2024-0125', filiere: 'Informatique L3', date: '06/01/2026', status: 'active' },
    { id: 2, name: 'Fatou Traoré', matricule: '2024-0126', filiere: 'Gestion L2', date: '06/01/2026', status: 'pending' },
    { id: 3, name: 'Ibrahim Koné', matricule: '2024-0127', filiere: 'Droit L1', date: '05/01/2026', status: 'active' },
    { id: 4, name: 'Aïcha Ouédraogo', matricule: '2024-0128', filiere: 'Économie M1', date: '05/01/2026', status: 'active' },
    { id: 5, name: 'Moussa Sanogo', matricule: '2024-0129', filiere: 'Informatique L2', date: '04/01/2026', status: 'pending' }
  ];

  const recentPayments: RecentPayment[] = [
    { id: 1, student: 'Amadou Diallo', amount: 150000, date: '06/01/2026', type: 'Inscription' },
    { id: 2, student: 'Fatou Traoré', amount: 75000, date: '06/01/2026', type: 'Scolarité' },
    { id: 3, student: 'Ibrahim Koné', amount: 150000, date: '05/01/2026', type: 'Inscription' },
    { id: 4, student: 'Aïcha Ouédraogo', amount: 200000, date: '05/01/2026', type: 'Scolarité' }
  ];

  const enrollmentByLevel = [
    { level: 'Licence 1', count: 450, percentage: 36 },
    { level: 'Licence 2', count: 380, percentage: 30 },
    { level: 'Licence 3', count: 280, percentage: 22 },
    { level: 'Master 1', count: 100, percentage: 8 },
    { level: 'Master 2', count: 40, percentage: 4 }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Tableau de bord"
        subtitle="Vue d'ensemble de l'établissement"
        breadcrumbs={[{ label: 'Tableau de bord' }]}
        actions={
          <Button variant="primary">
            <i className="bi bi-download me-2"></i>
            Exporter le rapport
          </Button>
        }
      />

      {/* Statistiques principales */}
      <Row className="g-3 mb-4">
        <Col sm={6} xl={3}>
          <StatCard
            title="Total Étudiants"
            value={stats.totalStudents.toLocaleString()}
            icon="mortarboard"
            variant="student"
            change={{ value: stats.studentsChange, positive: true, label: 'ce mois' }}
          />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard
            title="Enseignants"
            value={stats.totalTeachers}
            icon="person-workspace"
            variant="teacher"
            change={{ value: stats.teachersChange, positive: true, label: 'ce mois' }}
          />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard
            title="Classes actives"
            value={stats.totalClasses}
            icon="people"
            variant="info"
          />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard
            title="Paiements en attente"
            value={stats.pendingPayments}
            icon="cash-stack"
            variant="warning"
            change={{ value: Math.abs(stats.paymentsChange), positive: false, label: 'vs semaine dernière' }}
          />
        </Col>
      </Row>

      <Row className="g-4">
        {/* Inscriptions récentes */}
        <Col lg={8}>
          <DataCard
            title="Inscriptions récentes"
            actions={
              <Link to="/etudiants/inscriptions" className="btn btn-sm btn-outline-primary">
                Voir tout
              </Link>
            }
          >
            <Table responsive hover className="data-table mb-0">
              <thead>
                <tr>
                  <th>Étudiant</th>
                  <th>Matricule</th>
                  <th>Filière</th>
                  <th>Date</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {recentStudents.map(student => (
                  <tr key={student.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <Avatar name={student.name} size="sm" />
                        <span className="fw-medium">{student.name}</span>
                      </div>
                    </td>
                    <td><code>{student.matricule}</code></td>
                    <td>{student.filiere}</td>
                    <td>{student.date}</td>
                    <td>
                      <Badge bg={student.status === 'active' ? 'success' : 'warning'} pill>
                        {student.status === 'active' ? 'Validé' : 'En attente'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </DataCard>
        </Col>

        {/* Répartition par niveau */}
        <Col lg={4}>
          <DataCard title="Répartition par niveau">
            <div className="d-flex flex-column gap-3">
              {enrollmentByLevel.map((item, index) => (
                <div key={index}>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="fw-medium">{item.level}</span>
                    <span className="text-muted">{item.count} ({item.percentage}%)</span>
                  </div>
                  <ProgressBar
                    now={item.percentage}
                    variant={index === 0 ? 'primary' : index === 1 ? 'info' : index === 2 ? 'success' : 'warning'}
                    style={{ height: '8px' }}
                  />
                </div>
              ))}
            </div>
          </DataCard>
        </Col>
      </Row>

      <Row className="g-4 mt-2">
        {/* Paiements récents */}
        <Col lg={6}>
          <DataCard
            title="Derniers paiements"
            actions={
              <Link to="/finances/paiements" className="btn btn-sm btn-outline-primary">
                Voir tout
              </Link>
            }
          >
            <div className="d-flex flex-column gap-3">
              {recentPayments.map(payment => (
                <div key={payment.id} className="d-flex justify-content-between align-items-center p-2 bg-light rounded">
                  <div>
                    <div className="fw-medium">{payment.student}</div>
                    <small className="text-muted">{payment.type} • {payment.date}</small>
                  </div>
                  <span className="fw-bold text-success">{formatCurrency(payment.amount)}</span>
                </div>
              ))}
            </div>
          </DataCard>
        </Col>

        {/* Actions rapides */}
        <Col lg={6}>
          <DataCard title="Actions rapides">
            <Row className="g-3">
              <Col xs={6}>
                <Link to="/etudiants/inscriptions/nouveau" className="text-decoration-none">
                  <Card className="h-100 border-0 bg-light text-center p-3 hover-shadow">
                    <div className="mb-2">
                      <i className="bi bi-person-plus fs-2 text-primary"></i>
                    </div>
                    <span className="fw-medium">Nouvelle inscription</span>
                  </Card>
                </Link>
              </Col>
              <Col xs={6}>
                <Link to="/evaluations/notes" className="text-decoration-none">
                  <Card className="h-100 border-0 bg-light text-center p-3 hover-shadow">
                    <div className="mb-2">
                      <i className="bi bi-pencil-square fs-2 text-success"></i>
                    </div>
                    <span className="fw-medium">Saisir des notes</span>
                  </Card>
                </Link>
              </Col>
              <Col xs={6}>
                <Link to="/finances/factures/nouveau" className="text-decoration-none">
                  <Card className="h-100 border-0 bg-light text-center p-3 hover-shadow">
                    <div className="mb-2">
                      <i className="bi bi-receipt fs-2 text-warning"></i>
                    </div>
                    <span className="fw-medium">Créer une facture</span>
                  </Card>
                </Link>
              </Col>
              <Col xs={6}>
                <Link to="/emploi-temps/planning" className="text-decoration-none">
                  <Card className="h-100 border-0 bg-light text-center p-3 hover-shadow">
                    <div className="mb-2">
                      <i className="bi bi-calendar-week fs-2 text-info"></i>
                    </div>
                    <span className="fw-medium">Emploi du temps</span>
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

export default AdminDashboard;
