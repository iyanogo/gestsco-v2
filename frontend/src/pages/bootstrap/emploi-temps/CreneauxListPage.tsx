import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Button, Badge, Modal, Form, Alert } from 'react-bootstrap';
import { PageHeader } from '../../../components/layouts';
import { DataCard, DataTable, SearchFilter, ConfirmModal, Column } from '../../../components/ui';
import { usePermissions } from '../../../hooks/usePermissions';
import { creneauHoraireService } from '../../../services/creneauHoraireService';
import type { CreneauHoraire, CreateCreneauHoraire, UpdateCreneauHoraire } from '../../../types/emploiTemps';
import { PERIODES_CRENEAU } from '../../../types/emploiTemps';

type CreneauFormState = {
  code: string;
  libelle: string;
  heure_debut: string;
  heure_fin: string;
  periode: string;
  ordre: string;
  is_active: boolean;
};

const defaultForm: CreneauFormState = {
  code: '',
  libelle: '',
  heure_debut: '08:00',
  heure_fin: '10:00',
  periode: 'matin',
  ordre: '1',
  is_active: true,
};

const formatTime = (value: string) => (value?.length >= 5 ? value.slice(0, 5) : value);

const toApiTime = (value: string) => (value.length === 5 ? `${value}:00` : value);

const CreneauxListPage: React.FC = () => {
  const { moduleActions } = usePermissions();
  const { canCreate, canUpdate, canDelete } = moduleActions('edt_creneaux');
  const [creneaux, setCreneaux] = useState<CreneauHoraire[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [filterPeriode, setFilterPeriode] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CreneauHoraire | null>(null);
  const [formData, setFormData] = useState<CreneauFormState>(defaultForm);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await creneauHoraireService.getCreneaux();
      setCreneaux(data);
    } catch (err) {
      console.error('Erreur chargement créneaux:', err);
      setError('Impossible de charger les créneaux horaires.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const periodeLabel = (value: string) =>
    PERIODES_CRENEAU.find((p) => p.value === value)?.label ?? value;

  const columns: Column<CreneauHoraire>[] = [
    {
      key: 'code',
      header: 'Code',
      width: '90px',
      render: (item) => <code className="text-primary fw-medium">{item.code}</code>,
    },
    { key: 'libelle', header: 'Libellé' },
    {
      key: 'horaire',
      header: 'Horaire',
      render: (item) => (
        <span>
          {formatTime(item.heure_debut)} - {formatTime(item.heure_fin)}
        </span>
      ),
    },
    {
      key: 'periode',
      header: 'Période',
      render: (item) => <Badge bg="light" text="dark">{periodeLabel(item.periode)}</Badge>,
    },
    { key: 'ordre', header: 'Ordre', width: '80px' },
    {
      key: 'duree_minutes',
      header: 'Durée',
      render: (item) => `${item.duree_minutes} min`,
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
    ...(canUpdate || canDelete
      ? [
          {
            key: 'actions',
            header: 'Actions',
            width: '120px',
            render: (item: CreneauHoraire) => (
              <div className="d-flex gap-1">
                {canUpdate && (
                  <Button
                    size="sm"
                    variant="outline-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(item);
                    }}
                  >
                    <i className="bi bi-pencil"></i>
                  </Button>
                )}
                {canDelete && (
                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(item);
                    }}
                  >
                    <i className="bi bi-trash"></i>
                  </Button>
                )}
              </div>
            ),
          } as Column<CreneauHoraire>,
        ]
      : []),
  ];

  const filteredData = creneaux.filter((item) => {
    const q = searchValue.toLowerCase();
    const matchSearch =
      item.libelle.toLowerCase().includes(q) || item.code.toLowerCase().includes(q);
    const matchPeriode = !filterPeriode || item.periode === filterPeriode;
    return matchSearch && matchPeriode;
  });

  const handleAdd = () => {
    setSelectedItem(null);
    setFormData(defaultForm);
    setShowModal(true);
  };

  const handleEdit = (item: CreneauHoraire) => {
    setSelectedItem(item);
    setFormData({
      code: item.code,
      libelle: item.libelle,
      heure_debut: formatTime(item.heure_debut),
      heure_fin: formatTime(item.heure_fin),
      periode: item.periode,
      ordre: String(item.ordre),
      is_active: item.is_active,
    });
    setShowModal(true);
  };

  const handleDeleteClick = (item: CreneauHoraire) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const handleSave = async () => {
    if (!formData.code.trim() || !formData.libelle.trim()) {
      setError('Code et libellé sont obligatoires.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (selectedItem) {
        const update: UpdateCreneauHoraire = {
          code: formData.code.trim(),
          libelle: formData.libelle.trim(),
          heure_debut: toApiTime(formData.heure_debut),
          heure_fin: toApiTime(formData.heure_fin),
          periode: formData.periode,
          ordre: Number(formData.ordre),
          is_active: formData.is_active,
        };
        await creneauHoraireService.updateCreneau(selectedItem.id, update);
      } else {
        const create: CreateCreneauHoraire = {
          code: formData.code.trim(),
          libelle: formData.libelle.trim(),
          heure_debut: toApiTime(formData.heure_debut),
          heure_fin: toApiTime(formData.heure_fin),
          periode: formData.periode,
          ordre: Number(formData.ordre) || 1,
        };
        await creneauHoraireService.createCreneau(create);
      }
      setShowModal(false);
      await loadData();
    } catch (err: unknown) {
      console.error('Erreur enregistrement créneau:', err);
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Erreur lors de l\'enregistrement (superuser requis).');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    setSaving(true);
    try {
      await creneauHoraireService.deleteCreneau(selectedItem.id);
      setShowDeleteModal(false);
      await loadData();
    } catch (err) {
      console.error('Erreur suppression créneau:', err);
      setError('Impossible de supprimer ce créneau.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Créneaux horaires"
        subtitle="Grille horaire institutionnelle"
        breadcrumbs={[
          { label: 'Emploi du temps', path: '/admin/emploi-temps/planning' },
          { label: 'Créneaux' },
        ]}
        actions={
          canCreate ? (
            <Button variant="primary" onClick={handleAdd}>
              <i className="bi bi-plus-lg me-2"></i>
              Nouveau créneau
            </Button>
          ) : undefined
        }
      />

      {!canCreate && (
        <Alert variant="info" className="mb-3">
          Consultation seule - la modification des créneaux est réservée au super-administrateur.
        </Alert>
      )}

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-3">
          {error}
        </Alert>
      )}

      <DataCard
        title={`Créneaux (${filteredData.length})`}
        actions={
          <Button variant="outline-secondary" size="sm" onClick={loadData}>
            <i className="bi bi-arrow-clockwise me-1"></i>
            Actualiser
          </Button>
        }
      >
        <SearchFilter
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder="Rechercher un créneau..."
          filters={[
            {
              key: 'periode',
              label: 'Toutes les périodes',
              type: 'select',
              options: PERIODES_CRENEAU.map((p) => ({ value: p.value, label: p.label })),
            },
          ]}
          filterValues={{ periode: filterPeriode }}
          onFilterChange={(_key, value) => setFilterPeriode(value)}
          onReset={() => {
            setSearchValue('');
            setFilterPeriode('');
          }}
        />
        <DataTable
          columns={columns}
          data={filteredData}
          loading={loading}
          emptyMessage="Aucun créneau configuré"
        />
      </DataCard>

      {(canCreate || canUpdate) && (
        <>
          <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>{selectedItem ? 'Modifier le créneau' : 'Nouveau créneau'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Row className="g-3">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Code *</Form.Label>
                    <Form.Control
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="Ex: M1"
                    />
                  </Form.Group>
                </Col>
                <Col md={8}>
                  <Form.Group>
                    <Form.Label>Libellé *</Form.Label>
                    <Form.Control
                      value={formData.libelle}
                      onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                      placeholder="Matin 1 : 08h-10h"
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Début *</Form.Label>
                    <Form.Control
                      type="time"
                      value={formData.heure_debut}
                      onChange={(e) => setFormData({ ...formData, heure_debut: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Fin *</Form.Label>
                    <Form.Control
                      type="time"
                      value={formData.heure_fin}
                      onChange={(e) => setFormData({ ...formData, heure_fin: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Période *</Form.Label>
                    <Form.Select
                      value={formData.periode}
                      onChange={(e) => setFormData({ ...formData, periode: e.target.value })}
                    >
                      {PERIODES_CRENEAU.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Ordre</Form.Label>
                    <Form.Control
                      type="number"
                      min={1}
                      value={formData.ordre}
                      onChange={(e) => setFormData({ ...formData, ordre: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                {selectedItem && (
                  <Col md={12}>
                    <Form.Check
                      type="switch"
                      label="Créneau actif"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                  </Col>
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

          <ConfirmModal
            show={showDeleteModal}
            onHide={() => setShowDeleteModal(false)}
            onConfirm={handleDelete}
            title="Supprimer le créneau"
            message={`Supprimer le créneau « ${selectedItem?.libelle} » ?`}
            confirmLabel="Supprimer"
            variant="danger"
          />
        </>
      )}
    </div>
  );
};

export default CreneauxListPage;
