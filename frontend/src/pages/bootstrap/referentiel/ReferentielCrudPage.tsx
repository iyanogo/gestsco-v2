import { useState, useEffect, useCallback } from 'react';
import { Row, Col, Button, Modal, Form, Alert } from 'react-bootstrap';
import { PageHeader } from '../../../components/layouts';
import { DataCard, DataTable, SearchFilter, ConfirmModal, Column } from '../../../components/ui';
import { usePermissions } from '../../../hooks/usePermissions';
import type { ReferentielCrudConfig } from './referentielConfigs';

type FormValues = Record<string, string | number | undefined>;

interface ReferentielCrudPageProps<T extends { id: number }> {
  config: ReferentielCrudConfig<T>;
}

function ReferentielCrudPage<T extends { id: number }>({
  config,
}: ReferentielCrudPageProps<T>) {
  const { moduleActions } = usePermissions();
  const { canCreate, canUpdate, canDelete } = moduleActions('referentiel');
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [formData, setFormData] = useState<FormValues>(config.defaultForm);
  const [selectOptions, setSelectOptions] = useState<
    Record<string, { value: string; label: string }[]>
  >({});

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await config.load();
      setItems(data);
    } catch (err) {
      console.error(`Erreur lors du chargement (${config.title}):`, err);
      setError(`Impossible de charger ${config.entityNamePlural}.`);
    } finally {
      setLoading(false);
    }
  }, [config]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadSelectOptions = async () => {
    if (!config.selectFields?.length) return;
    const entries = await Promise.all(
      config.selectFields.map(async (field) => {
        const options = await field.loadOptions();
        return [field.name, options] as const;
      })
    );
    setSelectOptions(Object.fromEntries(entries));
  };

  const handleAdd = async () => {
    setSelectedItem(null);
    setFormData(config.defaultForm);
    await loadSelectOptions();
    setShowModal(true);
  };

  const handleEdit = async (item: T) => {
    setSelectedItem(item);
    setFormData(config.toForm(item));
    await loadSelectOptions();
    setShowModal(true);
  };

  const handleDeleteClick = (item: T) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const handleSave = async () => {
    try {
      const payload = config.toPayload(formData);
      if (selectedItem) {
        await config.update(selectedItem.id, payload);
      } else {
        await config.create(payload);
      }
      setShowModal(false);
      await loadData();
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      setError(`Impossible de sauvegarder ${config.entityName}.`);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      await config.remove(selectedItem.id);
      setShowDeleteModal(false);
      await loadData();
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setError(`Impossible de supprimer ${config.entityName}.`);
    }
  };

  const filteredData = items.filter((item) => {
    const term = searchValue.toLowerCase();
    if (!term) return true;
    return config.searchKeys.some((key) =>
      String((item as Record<string, unknown>)[key] ?? '')
        .toLowerCase()
        .includes(term)
    );
  });

  const columns: Column<T>[] = [
    ...config.fields
      .filter((field) => field.showInTable !== false)
      .map((field) => ({
        key: field.name,
        header: field.tableHeader || field.label,
        width: field.width,
        render: (item: T) => {
          const value = (item as Record<string, unknown>)[field.name];
          if (field.name === 'code') {
            return <code className="text-primary">{String(value ?? '-')}</code>;
          }
          if (field.type === 'select' && field.selectLabelKey) {
            const label = (item as Record<string, unknown>)[field.selectLabelKey];
            return <span>{String(label ?? value ?? '-')}</span>;
          }
          return <span>{String(value ?? '-')}</span>;
        },
      })),
    ...(canUpdate || canDelete
      ? [
          {
            key: 'actions',
            header: 'Actions',
            width: '120px',
            render: (item: T) => (
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
          },
        ]
      : []),
  ];

  return (
    <div className="fade-in">
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <PageHeader
        title={config.title}
        subtitle={config.subtitle}
        breadcrumbs={[
          { label: 'Référentiel', path: '/admin/referentiel' },
          { label: config.breadcrumbLabel },
        ]}
        actions={
          canCreate ? (
            <Button variant="primary" onClick={handleAdd}>
              <i className="bi bi-plus-lg me-2"></i>
              {config.createLabel}
            </Button>
          ) : undefined
        }
      />

      <DataCard
        title={`Liste (${filteredData.length})`}
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
          searchPlaceholder={config.searchPlaceholder}
          filters={[]}
          filterValues={filterValues}
          onFilterChange={(key, value) =>
            setFilterValues({ ...filterValues, [key]: value })
          }
          onReset={() => {
            setSearchValue('');
            setFilterValues({});
          }}
        />

        <DataTable
          columns={columns}
          data={filteredData}
          loading={loading}
          emptyMessage={`Aucun ${config.entityName} trouvé`}
        />
      </DataCard>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedItem ? `Modifier ${config.entityName}` : config.createLabel}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            {config.fields.map((field) => (
              <Col md={field.colMd ?? 6} key={field.name}>
                <Form.Group>
                  <Form.Label>
                    {field.label}
                    {field.required ? ' *' : ''}
                  </Form.Label>
                  {field.type === 'select' ? (
                    <Form.Select
                      value={String(formData[field.name] ?? '')}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [field.name]: e.target.value ? e.target.value : undefined,
                        })
                      }
                    >
                      <option value="">- Sélectionner -</option>
                      {(selectOptions[field.name] || field.staticOptions || []).map(
                        (opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        )
                      )}
                    </Form.Select>
                  ) : (
                    <Form.Control
                      type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
                      value={String(formData[field.name] ?? '')}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [field.name]:
                            field.type === 'number'
                              ? e.target.value
                                ? Number(e.target.value)
                                : undefined
                              : e.target.value,
                        })
                      }
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  )}
                </Form.Group>
              </Col>
            ))}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleSave}>
            <i className="bi bi-check-lg me-2"></i>
            {selectedItem ? 'Modifier' : 'Créer'}
          </Button>
        </Modal.Footer>
      </Modal>

      <ConfirmModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title={`Supprimer ${config.entityName}`}
        message={`Confirmer la suppression de « ${selectedItem ? config.getDisplayLabel(selectedItem) : ''} » ?`}
        confirmLabel="Supprimer"
        variant="danger"
      />
    </div>
  );
}

export default ReferentielCrudPage;
