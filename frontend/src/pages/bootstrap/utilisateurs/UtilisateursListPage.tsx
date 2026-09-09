import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Row, Col, Button, Badge, Modal, Form } from 'react-bootstrap';
import { AxiosError } from 'axios';
import { PageHeader } from '../../../components/layouts';
import { DataCard, DataTable, SearchFilter, ConfirmModal, Avatar, Column } from '../../../components/ui';
import { usePermissions } from '../../../hooks/usePermissions';
import userService from '../../../services/userService';
import type { User } from '../../../types/auth';

/** Comptes créés par init_db.py - mot de passe par défaut documenté dans README. */
const SEED_ACCOUNTS = [
  { email: 'admin@gestsco.com', defaultPassword: 'Admin@123' },
  { email: 'scolarite@gestsco.com', defaultPassword: 'Scolarite@123' },
  { email: 'comptable@gestsco.com', defaultPassword: 'Comptable@123' },
];

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Administrateur' },
  { value: 'scolarite', label: 'Scolarité' },
  { value: 'enseignant', label: 'Enseignant' },
  { value: 'comptable', label: 'Comptable' },
  { value: 'etudiant', label: 'Étudiant' },
];

function splitFullName(fullName: string | null): { prenom: string; nom: string } {
  if (!fullName?.trim()) return { prenom: '', nom: '' };
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { prenom: parts[0], nom: '' };
  return { prenom: parts[0], nom: parts.slice(1).join(' ') };
}

function joinFullName(prenom: string, nom: string): string {
  return [prenom.trim(), nom.trim()].filter(Boolean).join(' ');
}

function getRoleBadge(user: User) {
  if (user.is_superuser) {
    return <Badge bg="dark">Super Admin</Badge>;
  }
  switch (user.role) {
    case 'admin':
    case 'administrateur':
      return <Badge bg="danger">Administrateur</Badge>;
    case 'scolarite':
      return <Badge bg="primary">Scolarité</Badge>;
    case 'enseignant':
      return <Badge bg="success">Enseignant</Badge>;
    case 'etudiant':
      return <Badge bg="info">Étudiant</Badge>;
    case 'comptable':
      return <Badge bg="warning" text="dark">Comptable</Badge>;
    default:
      return <Badge bg="secondary">{user.role}</Badge>;
  }
}

const UtilisateursListPage: React.FC = () => {
  const { moduleActions } = usePermissions();
  const { canCreate, canUpdate, canDelete } = moduleActions('utilisateurs');
  const [utilisateurs, setUtilisateurs] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    nom: '',
    prenom: '',
    role: 'enseignant',
    is_active: true,
    is_superuser: false,
    password: '',
    confirmPassword: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    password: '',
    confirmPassword: '',
  });

  const seedAccountsPresent = useMemo(
    () => SEED_ACCOUNTS.filter((s) => utilisateurs.some((u) => u.email === s.email)),
    [utilisateurs],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await userService.getUsers();
      setUtilisateurs(data);
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail?: string }>;
      setError(axiosErr.response?.data?.detail || 'Impossible de charger les utilisateurs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredData = utilisateurs.filter((item) => {
    const { prenom, nom } = splitFullName(item.full_name);
    const matchSearch =
      nom.toLowerCase().includes(searchValue.toLowerCase()) ||
      prenom.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.email.toLowerCase().includes(searchValue.toLowerCase());
    const effectiveRole = item.is_superuser ? 'superadmin' : item.role;
    const matchRole = !filterValues.role || effectiveRole === filterValues.role || item.role === filterValues.role;
    const matchStatut =
      !filterValues.statut ||
      (filterValues.statut === 'actif' && item.is_active) ||
      (filterValues.statut === 'inactif' && !item.is_active);
    return matchSearch && matchRole && matchStatut;
  });

  const handleAdd = () => {
    setSelectedItem(null);
    setFormData({
      email: '',
      nom: '',
      prenom: '',
      role: 'enseignant',
      is_active: true,
      is_superuser: false,
      password: '',
      confirmPassword: '',
    });
    setShowModal(true);
  };

  const handleEdit = (item: User) => {
    const { prenom, nom } = splitFullName(item.full_name);
    setSelectedItem(item);
    setFormData({
      email: item.email,
      nom,
      prenom,
      role: item.role,
      is_active: item.is_active,
      is_superuser: item.is_superuser,
      password: '',
      confirmPassword: '',
    });
    setShowModal(true);
  };

  const handlePasswordClick = (item: User) => {
    setSelectedItem(item);
    setPasswordForm({ password: '', confirmPassword: '' });
    setShowPasswordModal(true);
  };

  const handleDeleteClick = (item: User) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const handleSave = async () => {
    if (!selectedItem && formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (!selectedItem && formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const full_name = joinFullName(formData.prenom, formData.nom);
      if (selectedItem) {
        await userService.updateUser(selectedItem.id, {
          email: formData.email,
          full_name,
          role: formData.role,
          is_active: formData.is_active,
          is_superuser: formData.is_superuser,
        });
        setSuccess('Utilisateur mis à jour.');
      } else {
        await userService.createUser({
          email: formData.email,
          full_name,
          role: formData.role,
          is_active: formData.is_active,
          is_superuser: formData.is_superuser,
          password: formData.password,
        });
        setSuccess('Utilisateur créé.');
      }
      setShowModal(false);
      await loadData();
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail?: string }>;
      setError(axiosErr.response?.data?.detail || 'Erreur lors de l\'enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async () => {
    if (!selectedItem) return;
    if (passwordForm.password !== passwordForm.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (passwordForm.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await userService.updateUser(selectedItem.id, { password: passwordForm.password });
      setSuccess(`Mot de passe de ${selectedItem.email} mis à jour.`);
      setShowPasswordModal(false);
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail?: string }>;
      setError(axiosErr.response?.data?.detail || 'Erreur lors du changement de mot de passe.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    setError(null);
    try {
      await userService.deleteUser(selectedItem.id);
      setSuccess('Utilisateur supprimé.');
      setShowDeleteModal(false);
      await loadData();
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail?: string }>;
      setError(axiosErr.response?.data?.detail || 'Suppression impossible.');
    }
  };

  const columns: Column<User>[] = useMemo(() => {
    const base: Column<User>[] = [
      {
        key: 'nom',
        header: 'Utilisateur',
        render: (item) => {
          const { prenom, nom } = splitFullName(item.full_name);
          return (
            <div className="d-flex align-items-center gap-2">
              <Avatar name={item.full_name || item.email} size="sm" />
              <div>
                <div className="fw-medium">{prenom} {nom}</div>
                <small className="text-muted">{item.email}</small>
              </div>
            </div>
          );
        },
      },
      { key: 'role', header: 'Rôle', render: (item) => getRoleBadge(item) },
      {
        key: 'created_at',
        header: 'Créé le',
        render: (item) => new Date(item.created_at).toLocaleDateString('fr-FR'),
      },
      {
        key: 'updated_at',
        header: 'Modifié le',
        render: (item) => (
          <small className="text-muted">
            {new Date(item.updated_at).toLocaleString('fr-FR')}
          </small>
        ),
      },
      {
        key: 'is_active',
        header: 'Statut',
        render: (item) => (
          <Badge bg={item.is_active ? 'success' : 'secondary'}>
            {item.is_active ? 'Actif' : 'Inactif'}
          </Badge>
        ),
      },
    ];

    if (canUpdate || canDelete) {
      base.push({
        key: 'actions',
        header: 'Actions',
        width: '180px',
        render: (item) => (
          <div className="d-flex gap-1">
            {canUpdate && (
              <>
                <Button
                  size="sm"
                  variant="outline-primary"
                  title="Modifier"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(item);
                  }}
                >
                  <i className="bi bi-pencil" />
                </Button>
                <Button
                  size="sm"
                  variant="outline-warning"
                  title="Changer le mot de passe"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePasswordClick(item);
                  }}
                >
                  <i className="bi bi-key" />
                </Button>
              </>
            )}
            {canDelete && (
              <Button
                size="sm"
                variant="outline-danger"
                title="Supprimer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick(item);
                }}
              >
                <i className="bi bi-trash" />
              </Button>
            )}
          </div>
        ),
      });
    }

    return base;
  }, [canUpdate, canDelete]);

  const stats = {
    total: utilisateurs.length,
    admins: utilisateurs.filter((u) => u.is_superuser || u.role === 'admin').length,
    enseignants: utilisateurs.filter((u) => u.role === 'enseignant').length,
    actifs: utilisateurs.filter((u) => u.is_active).length,
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Utilisateurs"
        subtitle="Gestion des comptes et des rôles (super-admin uniquement)"
        breadcrumbs={[
          { label: 'Administration', path: '/admin/utilisateurs' },
          { label: 'Utilisateurs' },
        ]}
        actions={
          canCreate ? (
            <Button variant="primary" onClick={handleAdd}>
              <i className="bi bi-plus-lg me-2" />
              Nouvel utilisateur
            </Button>
          ) : undefined
        }
      />

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {seedAccountsPresent.length > 0 && (
        <Alert variant="warning" className="mb-3">
          <Alert.Heading className="h6 mb-2">
            <i className="bi bi-exclamation-triangle me-2" />
            P0 Sécurité - mots de passe par défaut détectés
          </Alert.Heading>
          <p className="mb-2 small mb-0">
            Les comptes seed suivants utilisent encore probablement le mot de passe documenté dans{' '}
            <code>backend/README.md</code>. Changez-les immédiatement via le bouton{' '}
            <i className="bi bi-key" /> :
          </p>
          <ul className="small mb-2">
            {seedAccountsPresent.map((s) => (
              <li key={s.email}>
                <strong>{s.email}</strong> - défaut documenté : <code>{s.defaultPassword}</code>
              </li>
            ))}
          </ul>
          {canUpdate &&
            seedAccountsPresent.some((s) => s.email === 'admin@gestsco.com') && (
            <Button
              size="sm"
              variant="warning"
              onClick={() => {
                const admin = utilisateurs.find((u) => u.email === 'admin@gestsco.com');
                if (admin) handlePasswordClick(admin);
              }}
            >
              <i className="bi bi-key me-1" />
              Changer le mot de passe admin maintenant
            </Button>
          )}
        </Alert>
      )}

      <Row className="g-3 mb-4">
        <Col sm={6} md={3}>
          <div className="bg-white rounded p-3 border d-flex align-items-center gap-3">
            <div className="bg-primary bg-opacity-10 rounded p-2">
              <i className="bi bi-people fs-4 text-primary" />
            </div>
            <div>
              <div className="fs-4 fw-bold">{stats.total}</div>
              <small className="text-muted">Total utilisateurs</small>
            </div>
          </div>
        </Col>
        <Col sm={6} md={3}>
          <div className="bg-white rounded p-3 border d-flex align-items-center gap-3">
            <div className="bg-danger bg-opacity-10 rounded p-2">
              <i className="bi bi-shield-check fs-4 text-danger" />
            </div>
            <div>
              <div className="fs-4 fw-bold">{stats.admins}</div>
              <small className="text-muted">Administrateurs</small>
            </div>
          </div>
        </Col>
        <Col sm={6} md={3}>
          <div className="bg-white rounded p-3 border d-flex align-items-center gap-3">
            <div className="bg-success bg-opacity-10 rounded p-2">
              <i className="bi bi-person-workspace fs-4 text-success" />
            </div>
            <div>
              <div className="fs-4 fw-bold">{stats.enseignants}</div>
              <small className="text-muted">Enseignants</small>
            </div>
          </div>
        </Col>
        <Col sm={6} md={3}>
          <div className="bg-white rounded p-3 border d-flex align-items-center gap-3">
            <div className="bg-info bg-opacity-10 rounded p-2">
              <i className="bi bi-check-circle fs-4 text-info" />
            </div>
            <div>
              <div className="fs-4 fw-bold">{stats.actifs}</div>
              <small className="text-muted">Actifs</small>
            </div>
          </div>
        </Col>
      </Row>

      <DataCard
        title={`Liste des utilisateurs (${filteredData.length})`}
        actions={
          <Button variant="outline-secondary" size="sm" onClick={loadData}>
            <i className="bi bi-arrow-clockwise me-1" />
            Actualiser
          </Button>
        }
      >
        <SearchFilter
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder="Rechercher par nom, email..."
          filters={[
            {
              key: 'role',
              label: 'Tous les rôles',
              type: 'select',
              options: [
                { value: 'superadmin', label: 'Super Admin' },
                ...ROLE_OPTIONS,
              ],
            },
            {
              key: 'statut',
              label: 'Tous les statuts',
              type: 'select',
              options: [
                { value: 'actif', label: 'Actif' },
                { value: 'inactif', label: 'Inactif' },
              ],
            },
          ]}
          filterValues={filterValues}
          onFilterChange={(key, value) => setFilterValues({ ...filterValues, [key]: value })}
          onReset={() => {
            setSearchValue('');
            setFilterValues({});
          }}
        />

        <DataTable
          columns={columns}
          data={filteredData}
          loading={loading}
          emptyMessage="Aucun utilisateur trouvé"
        />
      </DataCard>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedItem ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Prénom</Form.Label>
                <Form.Control
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Nom</Form.Label>
                <Form.Control
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Email *</Form.Label>
                <Form.Control
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Rôle *</Form.Label>
                <Form.Select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Check
                type="switch"
                id="isActive"
                label="Compte actif"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
            </Col>
            <Col md={6}>
              <Form.Check
                type="switch"
                id="isSuperuser"
                label="Super administrateur (accès total API)"
                checked={formData.is_superuser}
                onChange={(e) => setFormData({ ...formData, is_superuser: e.target.checked })}
              />
            </Col>
            {!selectedItem && (
              <>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Mot de passe *</Form.Label>
                    <Form.Control
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      minLength={8}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Confirmer le mot de passe *</Form.Label>
                    <Form.Control
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      minLength={8}
                    />
                  </Form.Group>
                </Col>
              </>
            )}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)} disabled={saving}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Enregistrement…' : selectedItem ? 'Modifier' : 'Créer'}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Changer le mot de passe</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedItem && (
            <p className="text-muted small">
              Compte : <strong>{selectedItem.email}</strong>
            </p>
          )}
          <Row className="g-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label>Nouveau mot de passe *</Form.Label>
                <Form.Control
                  type="password"
                  value={passwordForm.password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                  minLength={8}
                  autoFocus
                />
                <Form.Text>Minimum 8 caractères.</Form.Text>
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group>
                <Form.Label>Confirmer *</Form.Label>
                <Form.Control
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                  }
                  minLength={8}
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPasswordModal(false)} disabled={saving}>
            Annuler
          </Button>
          <Button variant="warning" onClick={handlePasswordSave} disabled={saving}>
            <i className="bi bi-key me-1" />
            {saving ? 'Enregistrement…' : 'Mettre à jour le mot de passe'}
          </Button>
        </Modal.Footer>
      </Modal>

      <ConfirmModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Supprimer l'utilisateur"
        message={`Supprimer le compte "${selectedItem?.email}" ?`}
        confirmLabel="Supprimer"
        variant="danger"
      />
    </div>
  );
};

export default UtilisateursListPage;
