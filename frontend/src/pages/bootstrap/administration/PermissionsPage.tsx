import React, { useEffect, useState } from 'react';
import { Alert, Card, Col, Row } from 'react-bootstrap';
import { PageHeader } from '../../../components/layouts';
import { AdminSectionNav, RbacMatrixViewer } from '../../../components/administration';
import { StatCard } from '../../../components/ui';
import administrationService, { PermissionsSummary } from '../../../services/administrationService';

const PermissionsPage: React.FC = () => {
  const [summary, setSummary] = useState<PermissionsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    administrationService
      .getPermissionsSummary()
      .then(setSummary)
      .catch(() => setError('Impossible de charger le résumé des permissions.'));
  }, []);

  return (
    <div className="fade-in">
      <PageHeader
        title="Permissions"
        subtitle="Matrice RBAC active et répartition des comptes"
        breadcrumbs={[
          { label: 'Administration', path: '/admin/administration/permissions' },
          { label: 'Permissions' },
        ]}
      />

      <AdminSectionNav />

      {error && <Alert variant="danger">{error}</Alert>}

      {summary && (
        <Row className="g-3 mb-4">
          <Col sm={6} xl={3}>
            <StatCard title="Comptes total" value={summary.total_users} icon="people" variant="primary" />
          </Col>
          <Col sm={6} xl={3}>
            <StatCard title="Actifs" value={summary.active_count} icon="person-check" variant="success" />
          </Col>
          <Col sm={6} xl={3}>
            <StatCard title="Inactifs" value={summary.inactive_count} icon="person-x" variant="warning" />
          </Col>
          <Col sm={6} xl={3}>
            <StatCard title="Super admins" value={summary.superuser_count} icon="shield-lock" variant="admin" />
          </Col>
        </Row>
      )}

      {summary && Object.keys(summary.by_role).length > 0 && (
        <Card className="border-0 shadow-sm mb-4">
          <Card.Body>
            <h6 className="fw-bold mb-3">Répartition par rôle</h6>
            <div className="d-flex flex-wrap gap-2">
              {Object.entries(summary.by_role).map(([role, count]) => (
                <span key={role} className="badge bg-light text-dark border px-3 py-2">
                  {role} : <strong>{count}</strong>
                </span>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-4">
          <RbacMatrixViewer />
        </Card.Body>
      </Card>
    </div>
  );
};

export default PermissionsPage;
