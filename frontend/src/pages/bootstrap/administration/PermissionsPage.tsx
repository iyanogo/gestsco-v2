import React, { useState } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, Badge, Modal } from 'react-bootstrap';

interface Role {
  id: number;
  nom: string;
  code: string;
  description: string;
  nombreUtilisateurs: number;
  permissions: string[];
  statut: 'actif' | 'inactif';
}

const allPermissions = [
  { groupe: 'Étudiants', permissions: ['etudiants.voir', 'etudiants.creer', 'etudiants.modifier', 'etudiants.supprimer'] },
  { groupe: 'Enseignants', permissions: ['enseignants.voir', 'enseignants.creer', 'enseignants.modifier', 'enseignants.supprimer'] },
  { groupe: 'Notes', permissions: ['notes.voir', 'notes.saisir', 'notes.modifier', 'notes.valider'] },
  { groupe: 'Finances', permissions: ['finances.voir', 'finances.creer', 'finances.modifier', 'finances.supprimer'] },
  { groupe: 'Paramètres', permissions: ['parametres.voir', 'parametres.modifier'] },
  { groupe: 'Administration', permissions: ['admin.logs', 'admin.backup', 'admin.permissions', 'admin.audit'] },
];

const mockRoles: Role[] = [
  { id: 1, nom: 'Super Administrateur', code: 'superadmin', description: 'Accès complet à toutes les fonctionnalités', nombreUtilisateurs: 2, permissions: allPermissions.flatMap(g => g.permissions), statut: 'actif' },
  { id: 2, nom: 'Administrateur', code: 'admin', description: 'Gestion administrative de l\'établissement', nombreUtilisateurs: 5, permissions: ['etudiants.voir', 'etudiants.creer', 'etudiants.modifier', 'enseignants.voir', 'finances.voir', 'finances.creer', 'parametres.voir'], statut: 'actif' },
  { id: 3, nom: 'Enseignant', code: 'teacher', description: 'Accès aux fonctionnalités pédagogiques', nombreUtilisateurs: 85, permissions: ['etudiants.voir', 'notes.voir', 'notes.saisir'], statut: 'actif' },
  { id: 4, nom: 'Comptable', code: 'accountant', description: 'Gestion financière', nombreUtilisateurs: 3, permissions: ['etudiants.voir', 'finances.voir', 'finances.creer', 'finances.modifier'], statut: 'actif' },
  { id: 5, nom: 'Étudiant', code: 'student', description: 'Accès limité aux informations personnelles', nombreUtilisateurs: 1250, permissions: [], statut: 'actif' },
];

const PermissionsPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>(mockRoles);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    nom: '', code: '', description: '', permissions: [] as string[], statut: 'actif' as 'actif' | 'inactif'
  });

  const handleShowModal = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setFormData({ nom: role.nom, code: role.code, description: role.description, permissions: role.permissions, statut: role.statut });
    } else {
      setEditingRole(null);
      setFormData({ nom: '', code: '', description: '', permissions: [], statut: 'actif' });
    }
    setShowModal(true);
  };

  const handlePermissionChange = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRole) {
      setRoles(roles.map(r => r.id === editingRole.id ? { ...r, ...formData } : r));
    } else {
      setRoles([...roles, { id: Math.max(...roles.map(r => r.id)) + 1, ...formData, nombreUtilisateurs: 0 }]);
    }
    setShowModal(false);
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1 fw-bold">Permissions</h2>
              <p className="text-muted mb-0">Gestion des rôles et permissions utilisateurs</p>
            </div>
            <Button variant="primary" onClick={() => handleShowModal()}>
              <i className="bi bi-plus-lg me-2"></i>Nouveau rôle
            </Button>
          </div>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-primary text-white">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3"><i className="bi bi-shield-check fs-4"></i></div>
              <div><h3 className="mb-0 fw-bold">{roles.length}</h3><small>Rôles</small></div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-success text-white">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3"><i className="bi bi-people fs-4"></i></div>
              <div><h3 className="mb-0 fw-bold">{roles.reduce((acc, r) => acc + r.nombreUtilisateurs, 0)}</h3><small>Utilisateurs</small></div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-info text-white">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3"><i className="bi bi-key fs-4"></i></div>
              <div><h3 className="mb-0 fw-bold">{allPermissions.flatMap(g => g.permissions).length}</h3><small>Permissions</small></div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-warning text-dark">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3"><i className="bi bi-grid fs-4"></i></div>
              <div><h3 className="mb-0 fw-bold">{allPermissions.length}</h3><small>Groupes</small></div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="bg-light">
              <tr>
                <th className="border-0 px-4 py-3">Rôle</th>
                <th className="border-0 py-3">Description</th>
                <th className="border-0 py-3 text-center">Utilisateurs</th>
                <th className="border-0 py-3 text-center">Permissions</th>
                <th className="border-0 py-3 text-center">Statut</th>
                <th className="border-0 py-3 text-end px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id}>
                  <td className="px-4 py-3">
                    <div className="fw-semibold">{role.nom}</div>
                    <code className="small text-muted">{role.code}</code>
                  </td>
                  <td className="py-3"><small className="text-muted">{role.description}</small></td>
                  <td className="py-3 text-center"><Badge bg="info" className="px-3 py-2">{role.nombreUtilisateurs}</Badge></td>
                  <td className="py-3 text-center"><Badge bg="secondary" className="px-3 py-2">{role.permissions.length}</Badge></td>
                  <td className="py-3 text-center">
                    <Badge bg={role.statut === 'actif' ? 'success' : 'secondary'}>{role.statut === 'actif' ? 'Actif' : 'Inactif'}</Badge>
                  </td>
                  <td className="py-3 text-end px-4">
                    <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleShowModal(role)}>
                      <i className="bi bi-pencil"></i>
                    </Button>
                    <Button variant="outline-danger" size="sm" disabled={role.code === 'superadmin'}>
                      <i className="bi bi-trash"></i>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton><Modal.Title>{editingRole ? 'Modifier le rôle' : 'Nouveau rôle'}</Modal.Title></Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Nom du rôle</Form.Label><Form.Control type="text" value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} required /></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Code</Form.Label><Form.Control type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required /></Form.Group></Col>
            </Row>
            <Form.Group className="mb-3"><Form.Label>Description</Form.Label><Form.Control as="textarea" rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></Form.Group>
            
            <h6 className="fw-bold mb-3">Permissions</h6>
            {allPermissions.map((groupe) => (
              <Card key={groupe.groupe} className="mb-3 border">
                <Card.Header className="bg-light py-2"><small className="fw-bold">{groupe.groupe}</small></Card.Header>
                <Card.Body className="py-2">
                  <Row>
                    {groupe.permissions.map((perm) => (
                      <Col md={6} key={perm}>
                        <Form.Check
                          type="checkbox"
                          label={<small>{perm.split('.')[1]}</small>}
                          checked={formData.permissions.includes(perm)}
                          onChange={() => handlePermissionChange(perm)}
                        />
                      </Col>
                    ))}
                  </Row>
                </Card.Body>
              </Card>
            ))}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button variant="primary" type="submit">{editingRole ? 'Modifier' : 'Créer'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default PermissionsPage;
