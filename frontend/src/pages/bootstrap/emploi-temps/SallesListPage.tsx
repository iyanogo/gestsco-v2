import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Button, Badge, Modal, Form, Alert } from 'react-bootstrap';
import { PageHeader } from '../../../components/layouts';
import { DataCard, DataTable, SearchFilter, ConfirmModal, Column } from '../../../components/ui';
import { salleService } from '../../../services/salleService';
import { batimentService } from '../../../services/batimentService';
import type { Salle, CreateSalle, UpdateSalle, Batiment } from '../../../types/emploiTemps';
import { TYPES_SALLE, EQUIPEMENTS_SALLE } from '../../../types/emploiTemps';

type SalleRow = Salle & { batiment_libelle?: string };

type SalleFormState = {
  code: string;
  libelle: string;
  batiment_id: string;
  type_salle: string;
  etage: string;
  capacite: string;
  superficie: string;
  description: string;
  is_accessible_pmr: boolean;
  is_active: boolean;
  equipements: string[];
};

const defaultForm: SalleFormState = {
  code: '',
  libelle: '',
  batiment_id: '',
  type_salle: 'cours',
  etage: '',
  capacite: '30',
  superficie: '',
  description: '',
  is_accessible_pmr: false,
  is_active: true,
  equipements: [],
};

function parseEquipements(raw?: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    /* fallback comma-separated */
  }
  return raw.split(',').map((e) => e.trim()).filter(Boolean);
}

function serializeEquipements(list: string[]): string {
  return list.join(', ');
}

const SallesListPage: React.FC = () => {
  const [salles, setSalles] = useState<SalleRow[]>([]);
  const [batiments, setBatiments] = useState<Batiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SalleRow | null>(null);
  const [formData, setFormData] = useState<SalleFormState>(defaultForm);
  const [saving, setSaving] = useState(false);

  const batimentMap = Object.fromEntries(batiments.map((b) => [b.id, b.libelle]));

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sallesData, batimentsData] = await Promise.all([
        salleService.getSalles(),
        batimentService.getBatiments(),
      ]);
      setBatiments(batimentsData);
      const bMap = Object.fromEntries(batimentsData.map((b) => [b.id, b.libelle]));
      setSalles(
        sallesData.map((s) => ({
          ...s,
          batiment_libelle: bMap[s.batiment_id],
        }))
      );
    } catch (err) {
      console.error('Erreur chargement salles:', err);
      setError('Impossible de charger les salles.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getTypeBadge = (type: string) => {
    const label = TYPES_SALLE.find((t) => t.value === type)?.label ?? type;
    const variant =
      type === 'amphi' ? 'info' : type === 'labo' || type === 'salle_info' ? 'success' : type === 'salle_reunion' ? 'warning' : 'primary';
    return <Badge bg={variant}>{label}</Badge>;
  };

  const getEquipementLabel = (value: string) =>
    EQUIPEMENTS_SALLE.find((e) => e.value === value)?.label ?? value;

  const columns: Column<SalleRow>[] = [
    {
      key: 'code',
      header: 'Code',
      width: '100px',
      render: (item) => <code className="text-primary fw-medium">{item.code}</code>,
    },
    { key: 'libelle', header: 'Libellé' },
    { key: 'type_salle', header: 'Type', render: (item) => getTypeBadge(item.type_salle) },
    {
      key: 'capacite',
      header: 'Capacité',
      render: (item) => (
        <span>
          <i className="bi bi-people me-1"></i>
          {item.capacite} places
        </span>
      ),
    },
    {
      key: 'batiment_id',
      header: 'Bâtiment',
      render: (item) => item.batiment_libelle ?? batimentMap[item.batiment_id] ?? `#${item.batiment_id}`,
    },
    {
      key: 'equipements',
      header: 'Équipements',
      render: (item) => {
        const eq = parseEquipements(item.equipements);
        return (
          <div className="d-flex flex-wrap gap-1">
            {eq.slice(0, 2).map((e) => (
              <Badge key={e} bg="light" text="dark" className="fw-normal">
                {getEquipementLabel(e)}
              </Badge>
            ))}
            {eq.length > 2 && <Badge bg="secondary">+{eq.length - 2}</Badge>}
          </div>
        );
      },
    },
    {
      key: 'is_active',
      header: 'Statut',
      render: (item) => (
        <Badge bg={item.is_active ? 'success' : 'secondary'}>
          {item.is_active ? 'Disponible' : 'Indisponible'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '120px',
      render: (item) => (
        <div className="d-flex gap-1">
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
        </div>
      ),
    },
  ];

  const filteredData = salles.filter((item) => {
    const q = searchValue.toLowerCase();
    const matchSearch =
      item.libelle.toLowerCase().includes(q) || item.code.toLowerCase().includes(q);
    const matchType = !filterValues.type_salle || item.type_salle === filterValues.type_salle;
    return matchSearch && matchType;
  });

  const handleAdd = () => {
    setSelectedItem(null);
    setFormData({
      ...defaultForm,
      batiment_id: batiments[0]?.id?.toString() ?? '',
    });
    setShowModal(true);
  };

  const handleEdit = (item: SalleRow) => {
    setSelectedItem(item);
    setFormData({
      code: item.code,
      libelle: item.libelle,
      batiment_id: String(item.batiment_id),
      type_salle: item.type_salle,
      etage: item.etage != null ? String(item.etage) : '',
      capacite: String(item.capacite),
      superficie: item.superficie != null ? String(item.superficie) : '',
      description: item.description ?? '',
      is_accessible_pmr: item.is_accessible_pmr,
      is_active: item.is_active,
      equipements: parseEquipements(item.equipements),
    });
    setShowModal(true);
  };

  const handleDeleteClick = (item: SalleRow) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const handleSave = async () => {
    if (!formData.code.trim() || !formData.libelle.trim() || !formData.batiment_id) {
      setError('Code, libellé et bâtiment sont obligatoires.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const base = {
        code: formData.code.trim(),
        libelle: formData.libelle.trim(),
        batiment_id: Number(formData.batiment_id),
        type_salle: formData.type_salle,
        etage: formData.etage ? Number(formData.etage) : undefined,
        capacite: Number(formData.capacite) || 30,
        superficie: formData.superficie ? Number(formData.superficie) : undefined,
        equipements: serializeEquipements(formData.equipements) || undefined,
        description: formData.description.trim() || undefined,
        is_accessible_pmr: formData.is_accessible_pmr,
      };
      if (selectedItem) {
        const update: UpdateSalle = { ...base, is_active: formData.is_active };
        await salleService.updateSalle(selectedItem.id, update);
      } else {
        await salleService.createSalle(base as CreateSalle);
      }
      setShowModal(false);
      await loadData();
    } catch (err: unknown) {
      console.error('Erreur enregistrement salle:', err);
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Erreur lors de l\'enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    setSaving(true);
    try {
      await salleService.deleteSalle(selectedItem.id);
      setShowDeleteModal(false);
      await loadData();
    } catch (err) {
      console.error('Erreur suppression salle:', err);
      setError('Impossible de supprimer cette salle.');
    } finally {
      setSaving(false);
    }
  };

  const toggleEquipement = (value: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      equipements: checked
        ? [...prev.equipements, value]
        : prev.equipements.filter((e) => e !== value),
    }));
  };

  const totalCapacite = salles.reduce((sum, s) => sum + s.capacite, 0);
  const nbLabos = salles.filter((s) => s.type_salle === 'labo' || s.type_salle === 'salle_info').length;

  return (
    <div className="fade-in">
      <PageHeader
        title="Salles"
        subtitle="Gestion des salles et locaux"
        breadcrumbs={[
          { label: 'Emploi du temps', path: '/admin/emploi-temps/planning' },
          { label: 'Salles' },
        ]}
        actions={
          <Button variant="primary" onClick={handleAdd} disabled={batiments.length === 0}>
            <i className="bi bi-plus-lg me-2"></i>
            Nouvelle salle
          </Button>
        }
      />

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-3">
          {error}
        </Alert>
      )}

      {batiments.length === 0 && !loading && (
        <Alert variant="warning" className="mb-3">
          Créez d&apos;abord un bâtiment avant d&apos;ajouter des salles.
        </Alert>
      )}

      <Row className="g-3 mb-4">
        <Col sm={6} md={3}>
          <div className="bg-white rounded p-3 border d-flex align-items-center gap-3">
            <div className="bg-primary bg-opacity-10 rounded p-2">
              <i className="bi bi-door-open fs-4 text-primary"></i>
            </div>
            <div>
              <div className="fs-4 fw-bold">{salles.length}</div>
              <small className="text-muted">Total salles</small>
            </div>
          </div>
        </Col>
        <Col sm={6} md={3}>
          <div className="bg-white rounded p-3 border d-flex align-items-center gap-3">
            <div className="bg-success bg-opacity-10 rounded p-2">
              <i className="bi bi-pc-display fs-4 text-success"></i>
            </div>
            <div>
              <div className="fs-4 fw-bold">{nbLabos}</div>
              <small className="text-muted">Labos / info</small>
            </div>
          </div>
        </Col>
        <Col sm={6} md={3}>
          <div className="bg-white rounded p-3 border d-flex align-items-center gap-3">
            <div className="bg-info bg-opacity-10 rounded p-2">
              <i className="bi bi-people fs-4 text-info"></i>
            </div>
            <div>
              <div className="fs-4 fw-bold">{totalCapacite}</div>
              <small className="text-muted">Capacité totale</small>
            </div>
          </div>
        </Col>
        <Col sm={6} md={3}>
          <div className="bg-white rounded p-3 border d-flex align-items-center gap-3">
            <div className="bg-warning bg-opacity-10 rounded p-2">
              <i className="bi bi-check-circle fs-4 text-warning"></i>
            </div>
            <div>
              <div className="fs-4 fw-bold">{salles.filter((s) => s.is_active).length}</div>
              <small className="text-muted">Disponibles</small>
            </div>
          </div>
        </Col>
      </Row>

      <DataCard
        title={`Liste des salles (${filteredData.length})`}
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
          searchPlaceholder="Rechercher une salle..."
          filters={[
            {
              key: 'type_salle',
              label: 'Tous les types',
              type: 'select',
              options: TYPES_SALLE.map((t) => ({ value: t.value, label: t.label })),
            },
          ]}
          filterValues={filterValues}
          onFilterChange={(key, value) => setFilterValues({ ...filterValues, [key]: value })}
          onReset={() => {
            setSearchValue('');
            setFilterValues({});
          }}
        />
        <DataTable columns={columns} data={filteredData} loading={loading} emptyMessage="Aucune salle trouvée" />
      </DataCard>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{selectedItem ? 'Modifier la salle' : 'Nouvelle salle'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Code *</Form.Label>
                <Form.Control
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Ex: S101"
                />
              </Form.Group>
            </Col>
            <Col md={8}>
              <Form.Group>
                <Form.Label>Libellé *</Form.Label>
                <Form.Control
                  value={formData.libelle}
                  onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Bâtiment *</Form.Label>
                <Form.Select
                  value={formData.batiment_id}
                  onChange={(e) => setFormData({ ...formData, batiment_id: e.target.value })}
                >
                  <option value="">Sélectionner…</option>
                  {batiments.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.libelle}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Type *</Form.Label>
                <Form.Select
                  value={formData.type_salle}
                  onChange={(e) => setFormData({ ...formData, type_salle: e.target.value })}
                >
                  {TYPES_SALLE.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Capacité *</Form.Label>
                <Form.Control
                  type="number"
                  min={1}
                  value={formData.capacite}
                  onChange={(e) => setFormData({ ...formData, capacite: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Étage</Form.Label>
                <Form.Control
                  type="number"
                  min={0}
                  value={formData.etage}
                  onChange={(e) => setFormData({ ...formData, etage: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Superficie (m²)</Form.Label>
                <Form.Control
                  type="number"
                  min={0}
                  step={0.1}
                  value={formData.superficie}
                  onChange={(e) => setFormData({ ...formData, superficie: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group>
                <Form.Label>Équipements</Form.Label>
                <div className="d-flex flex-wrap gap-2">
                  {EQUIPEMENTS_SALLE.map((eq) => (
                    <Form.Check
                      key={eq.value}
                      type="checkbox"
                      label={eq.label}
                      checked={formData.equipements.includes(eq.value)}
                      onChange={(e) => toggleEquipement(eq.value, e.target.checked)}
                    />
                  ))}
                </div>
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Check
                type="checkbox"
                label="Accessible PMR"
                checked={formData.is_accessible_pmr}
                onChange={(e) => setFormData({ ...formData, is_accessible_pmr: e.target.checked })}
              />
            </Col>
            {selectedItem && (
              <Col md={12}>
                <Form.Check
                  type="switch"
                  label="Salle active"
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
        title="Supprimer la salle"
        message={`Supprimer la salle « ${selectedItem?.libelle} » ?`}
        confirmLabel="Supprimer"
        variant="danger"
      />
    </div>
  );
};

export default SallesListPage;
