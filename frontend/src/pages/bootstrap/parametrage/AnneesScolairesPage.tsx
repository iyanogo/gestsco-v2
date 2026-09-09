import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Row, Col, Button, Badge, Modal, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { AxiosError } from 'axios';
import { PageHeader } from '../../../components/layouts';
import { DataCard, DataTable, ConfirmModal, Column } from '../../../components/ui';
import { usePermissions } from '../../../hooks/usePermissions';
import {
  getAnneesScolaires,
  createAnneeScolaire,
  updateAnneeScolaire,
  activateAnneeScolaire,
  deleteAnneeScolaire,
} from '../../../services/anneeScolaireService';
import type { Annee, CreateAnnee } from '../../../types/reference';

const ETATS_ANNEE = [
  { value: 'preparation', label: 'En préparation' },
  { value: 'ouverte', label: 'Ouverte' },
  { value: 'cloturee', label: 'Clôturée' },
];

function getStatutBadges(annee: Annee) {
  const badges: React.ReactNode[] = [];
  if (annee.statut) {
    badges.push(
      <Badge key="active" bg="success">
        Active
      </Badge>,
    );
  }
  if (annee.etat === 'cloturee') {
    badges.push(
      <Badge key="cloturee" bg="secondary">
        Clôturée
      </Badge>,
    );
  } else if (!annee.statut) {
    badges.push(
      <Badge key="prep" bg="warning" text="dark">
        {ETATS_ANNEE.find((e) => e.value === annee.etat)?.label || 'En préparation'}
      </Badge>,
    );
  }
  return badges;
}

const AnneesScolairesPage: React.FC = () => {
  const { moduleActions } = usePermissions();
  const { canCreate, canUpdate, canDelete, canValidate } = moduleActions('parametrage');
  const [annees, setAnnees] = useState<Annee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Annee | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CreateAnnee>({
    code: '',
    libelle: '',
    etat: 'preparation',
    statut: false,
    lier_enseignement: false,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAnneesScolaires();
      setAnnees(data);
    } catch (err) {
      console.error(err);
      setError('Impossible de charger les années scolaires.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAdd = () => {
    setSelectedItem(null);
    const year = new Date().getFullYear();
    setFormData({
      code: `${year}-${year + 1}`,
      libelle: `Année scolaire ${year}-${year + 1}`,
      etat: 'preparation',
      statut: false,
      lier_enseignement: false,
    });
    setShowModal(true);
  };

  const handleEdit = (item: Annee) => {
    setSelectedItem(item);
    setFormData({
      code: item.code || '',
      libelle: item.libelle || '',
      etat: item.etat || 'preparation',
      statut: item.statut ?? false,
      lier_enseignement: item.lier_enseignement ?? false,
    });
    setShowModal(true);
  };

  const handleDeleteClick = (item: Annee) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const handleActivate = async (item: Annee) => {
    setError(null);
    try {
      await activateAnneeScolaire(item.id);
      await loadData();
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail?: string }>;
      setError(axiosErr.response?.data?.detail || 'Activation réservée aux super-utilisateurs.');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      if (selectedItem) {
        await updateAnneeScolaire(selectedItem.id, formData);
      } else {
        await createAnneeScolaire(formData);
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

  const handleDelete = async () => {
    if (!selectedItem) return;
    setError(null);
    try {
      await deleteAnneeScolaire(selectedItem.id);
      setShowDeleteModal(false);
      await loadData();
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail?: string }>;
      setError(axiosErr.response?.data?.detail || 'Suppression impossible.');
    }
  };

  const columns: Column<Annee>[] = [
    {
      key: 'code',
      header: 'Code',
      width: '120px',
      render: (item) => <span className="fw-bold">{item.code || '-'}</span>,
    },
    { key: 'libelle', header: 'Libellé', render: (item) => item.libelle || '-' },
    {
      key: 'etat',
      header: 'État',
      render: (item) => ETATS_ANNEE.find((e) => e.value === item.etat)?.label || item.etat || '-',
    },
    {
      key: 'statut',
      header: 'Statut',
      render: (item) => <div className="d-flex gap-1 flex-wrap">{getStatutBadges(item)}</div>,
    },
    {
      key: 'lier_enseignement',
      header: 'Enseignement',
      render: (item) =>
        item.lier_enseignement ? (
          <Badge bg="info">Liée</Badge>
        ) : (
          <span className="text-muted">-</span>
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '200px',
      render: (item) => (
        <div className="d-flex gap-1">
          {canValidate && !item.statut && item.etat !== 'cloturee' && (
            <Button
              size="sm"
              variant="outline-success"
              title="Activer"
              onClick={(e) => {
                e.stopPropagation();
                handleActivate(item);
              }}
            >
              <i className="bi bi-check-circle" />
            </Button>
          )}
          {canUpdate && (
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
          )}
          {canDelete && !item.statut && (
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
    },
  ];

  return (
    <div className="fade-in">
      <PageHeader
        title="Années scolaires"
        subtitle="Référentiel des années scolaires (distinct des années académiques LMD)"
        breadcrumbs={[
          { label: 'Paramétrage', path: '/admin/parametrage/parametres' },
          { label: 'Années scolaires' },
        ]}
        actions={
          canCreate ? (
            <Button variant="primary" onClick={handleAdd}>
              <i className="bi bi-plus-lg me-2" />
              Nouvelle année
            </Button>
          ) : undefined
        }
      />

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Alert variant="info" className="mb-3">
        <i className="bi bi-info-circle me-2" />
        Pour la gestion LMD (semestres, campagnes, modules par année), utilisez{' '}
        <Link to="/admin/gestion-annees">Gestion des années académiques LMD</Link>.
      </Alert>

      <DataCard
        title={`Années scolaires (${annees.length})`}
        actions={
          <Button variant="outline-secondary" size="sm" onClick={loadData}>
            <i className="bi bi-arrow-clockwise me-1" />
            Actualiser
          </Button>
        }
      >
        <DataTable
          columns={columns}
          data={annees}
          loading={loading}
          emptyMessage="Aucune année scolaire trouvée"
        />
      </DataCard>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedItem ? "Modifier l'année scolaire" : 'Nouvelle année scolaire'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Code *</Form.Label>
                <Form.Control
                  value={formData.code || ''}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Ex: 2025-2026"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Libellé *</Form.Label>
                <Form.Control
                  value={formData.libelle || ''}
                  onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>État</Form.Label>
                <Form.Select
                  value={formData.etat || 'preparation'}
                  onChange={(e) => setFormData({ ...formData, etat: e.target.value })}
                >
                  {ETATS_ANNEE.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mt-4">
                <Form.Check
                  type="switch"
                  id="lierEnseignement"
                  label="Lier à l'enseignement"
                  checked={formData.lier_enseignement ?? false}
                  onChange={(e) =>
                    setFormData({ ...formData, lier_enseignement: e.target.checked })
                  }
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)} disabled={saving}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            <i className="bi bi-check-lg me-2" />
            {saving ? 'Enregistrement…' : selectedItem ? 'Modifier' : 'Créer'}
          </Button>
        </Modal.Footer>
      </Modal>

      <ConfirmModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Supprimer l'année scolaire"
        message={`Êtes-vous sûr de vouloir supprimer l'année "${selectedItem?.libelle}" ?`}
        confirmLabel="Supprimer"
        variant="danger"
      />
    </div>
  );
};

export default AnneesScolairesPage;
