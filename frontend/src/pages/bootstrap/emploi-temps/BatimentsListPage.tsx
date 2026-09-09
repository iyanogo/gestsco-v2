import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Button, Badge, Modal, Form, Alert } from 'react-bootstrap';
import { PageHeader } from '../../../components/layouts';
import { DataCard, DataTable, SearchFilter, ConfirmModal, Column } from '../../../components/ui';
import { batimentService } from '../../../services/batimentService';
import { getEtablissements } from '../../../services/etablissementService';
import type { Batiment, CreateBatiment, UpdateBatiment } from '../../../types/emploiTemps';
import type { Etablissement } from '../../../types/reference';

type BatimentFormState = {
  code: string;
  libelle: string;
  etablissement_id: string;
  adresse: string;
  nombre_etages: string;
  description: string;
  is_active: boolean;
};

const defaultForm: BatimentFormState = {
  code: '',
  libelle: '',
  etablissement_id: '',
  adresse: '',
  nombre_etages: '',
  description: '',
  is_active: true,
};

const BatimentsListPage: React.FC = () => {
  const [batiments, setBatiments] = useState<Batiment[]>([]);
  const [etablissements, setEtablissements] = useState<Etablissement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Batiment | null>(null);
  const [formData, setFormData] = useState<BatimentFormState>(defaultForm);
  const [saving, setSaving] = useState(false);

  const etablissementMap = Object.fromEntries(
    etablissements.map((e) => [e.id, e.nom])
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [batimentsData, etabsData] = await Promise.all([
        batimentService.getBatiments(),
        getEtablissements(),
      ]);
      setBatiments(batimentsData);
      setEtablissements(etabsData);
    } catch (err) {
      console.error('Erreur chargement bâtiments:', err);
      setError('Impossible de charger les bâtiments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const columns: Column<Batiment>[] = [
    {
      key: 'code',
      header: 'Code',
      width: '100px',
      render: (item) => <code className="text-primary fw-medium">{item.code}</code>,
    },
    { key: 'libelle', header: 'Libellé' },
    {
      key: 'etablissement_id',
      header: 'Établissement',
      render: (item) => etablissementMap[item.etablissement_id] ?? `#${item.etablissement_id}`,
    },
    {
      key: 'nombre_etages',
      header: 'Étages',
      render: (item) => item.nombre_etages ?? '-',
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

  const filteredData = batiments.filter((item) => {
    const q = searchValue.toLowerCase();
    return (
      item.libelle.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q) ||
      (item.adresse?.toLowerCase().includes(q) ?? false)
    );
  });

  const handleAdd = () => {
    setSelectedItem(null);
    setFormData({
      ...defaultForm,
      etablissement_id: etablissements[0]?.id?.toString() ?? '',
    });
    setShowModal(true);
  };

  const handleEdit = (item: Batiment) => {
    setSelectedItem(item);
    setFormData({
      code: item.code,
      libelle: item.libelle,
      etablissement_id: String(item.etablissement_id),
      adresse: item.adresse ?? '',
      nombre_etages: item.nombre_etages != null ? String(item.nombre_etages) : '',
      description: item.description ?? '',
      is_active: item.is_active,
    });
    setShowModal(true);
  };

  const handleDeleteClick = (item: Batiment) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const handleSave = async () => {
    if (!formData.code.trim() || !formData.libelle.trim() || !formData.etablissement_id) {
      setError('Code, libellé et établissement sont obligatoires.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        code: formData.code.trim(),
        libelle: formData.libelle.trim(),
        etablissement_id: Number(formData.etablissement_id),
        adresse: formData.adresse.trim() || undefined,
        nombre_etages: formData.nombre_etages ? Number(formData.nombre_etages) : undefined,
        description: formData.description.trim() || undefined,
      };
      if (selectedItem) {
        const update: UpdateBatiment = { ...payload, is_active: formData.is_active };
        await batimentService.updateBatiment(selectedItem.id, update);
      } else {
        await batimentService.createBatiment(payload as CreateBatiment);
      }
      setShowModal(false);
      await loadData();
    } catch (err: unknown) {
      console.error('Erreur enregistrement bâtiment:', err);
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Erreur lors de l\'enregistrement.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    setSaving(true);
    setError(null);
    try {
      await batimentService.deleteBatiment(selectedItem.id);
      setShowDeleteModal(false);
      await loadData();
    } catch (err) {
      console.error('Erreur suppression bâtiment:', err);
      setError('Impossible de supprimer ce bâtiment.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Bâtiments"
        subtitle="Référentiel des bâtiments"
        breadcrumbs={[
          { label: 'Emploi du temps', path: '/admin/emploi-temps/planning' },
          { label: 'Bâtiments' },
        ]}
        actions={
          <Button variant="primary" onClick={handleAdd} disabled={etablissements.length === 0}>
            <i className="bi bi-plus-lg me-2"></i>
            Nouveau bâtiment
          </Button>
        }
      />

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-3">
          {error}
        </Alert>
      )}

      {etablissements.length === 0 && !loading && (
        <Alert variant="warning" className="mb-3">
          Créez d&apos;abord un établissement dans le référentiel avant d&apos;ajouter des bâtiments.
        </Alert>
      )}

      <DataCard
        title={`Liste des bâtiments (${filteredData.length})`}
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
          searchPlaceholder="Rechercher un bâtiment..."
          filters={[]}
          filterValues={{}}
          onFilterChange={() => undefined}
          onReset={() => setSearchValue('')}
        />
        <DataTable
          columns={columns}
          data={filteredData}
          loading={loading}
          emptyMessage="Aucun bâtiment trouvé"
        />
      </DataCard>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{selectedItem ? 'Modifier le bâtiment' : 'Nouveau bâtiment'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Code *</Form.Label>
                <Form.Control
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Ex: BAT-A"
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
            <Col md={12}>
              <Form.Group>
                <Form.Label>Établissement *</Form.Label>
                <Form.Select
                  value={formData.etablissement_id}
                  onChange={(e) => setFormData({ ...formData, etablissement_id: e.target.value })}
                >
                  <option value="">Sélectionner…</option>
                  {etablissements.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nom}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={8}>
              <Form.Group>
                <Form.Label>Adresse</Form.Label>
                <Form.Control
                  value={formData.adresse}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Nombre d&apos;étages</Form.Label>
                <Form.Control
                  type="number"
                  min={0}
                  value={formData.nombre_etages}
                  onChange={(e) => setFormData({ ...formData, nombre_etages: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group>
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Form.Group>
            </Col>
            {selectedItem && (
              <Col md={12}>
                <Form.Check
                  type="switch"
                  label="Bâtiment actif"
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
        title="Supprimer le bâtiment"
        message={`Supprimer le bâtiment « ${selectedItem?.libelle} » ?`}
        confirmLabel="Supprimer"
        variant="danger"
      />
    </div>
  );
};

export default BatimentsListPage;
