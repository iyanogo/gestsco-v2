import React, { useEffect, useState } from 'react';
import { Alert, Button, Col, Form, Row, Spinner } from 'react-bootstrap';
import { PageHeader } from '../../../components/layouts';
import { DataCard } from '../../../components/ui';
import { useAuth } from '../../../hooks/useAuth';
import { getPortalHomePath } from '../../../utils/portalPaths';
import { getRoleLabel, resolveAppRole } from '../../../utils/rbac';
import { useLocation } from 'react-router-dom';

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const AccountProfilePage: React.FC = () => {
  const location = useLocation();
  const { user, updateProfile, isLoading, error, clearError } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setFullName(user?.full_name ?? '');
  }, [user?.full_name]);

  const homePath = getPortalHomePath(location.pathname);
  const role = resolveAppRole(user);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSuccess(false);
    clearError();
    try {
      await updateProfile({ full_name: fullName.trim() });
      setSuccess(true);
    } catch {
      // erreur gérée par le store
    }
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Mon compte"
        subtitle="Informations de connexion et préférences du compte utilisateur"
        breadcrumbs={[
          { label: 'Tableau de bord', path: homePath },
          { label: 'Mon compte' },
        ]}
      />

      <Row className="g-4">
        <Col lg={8}>
          <DataCard title="Modifier le profil">
            {success && (
              <Alert variant="success" dismissible onClose={() => setSuccess(false)}>
                Profil mis à jour avec succès.
              </Alert>
            )}
            {error && (
              <Alert variant="danger" dismissible onClose={clearError}>
                {error}
              </Alert>
            )}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control type="email" value={user?.email ?? ''} disabled readOnly />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Nom complet</Form.Label>
                <Form.Control
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </Form.Group>

              <Button type="submit" variant="primary" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Enregistrement…
                  </>
                ) : (
                  'Enregistrer'
                )}
              </Button>
            </Form>
          </DataCard>
        </Col>

        <Col lg={4}>
          <DataCard title="Informations du compte">
            <div className="mb-3">
              <div className="text-muted small">Rôle</div>
              <div className="fw-medium">{getRoleLabel(role)}</div>
            </div>
            <div className="mb-3">
              <div className="text-muted small">Statut</div>
              <div className="fw-medium">{user?.is_active ? 'Actif' : 'Inactif'}</div>
            </div>
            <div className="mb-3">
              <div className="text-muted small">Administrateur</div>
              <div className="fw-medium">{user?.is_superuser ? 'Oui' : 'Non'}</div>
            </div>
            <div className="mb-3">
              <div className="text-muted small">Date de création</div>
              <div className="fw-medium">{formatDate(user?.created_at)}</div>
            </div>
            <div>
              <div className="text-muted small">Dernière mise à jour</div>
              <div className="fw-medium">{formatDate(user?.updated_at)}</div>
            </div>
          </DataCard>
        </Col>
      </Row>
    </div>
  );
};

export default AccountProfilePage;
