import React, { useState, useEffect } from 'react';
import { Row, Col, Button, Badge, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../../components/layouts';
import { DataCard, DataTable, SearchFilter, ConfirmModal, Avatar, Column } from '../../../components/ui';
import { usePermissions } from '../../../hooks/usePermissions';
import { getEtudiants, deleteEtudiant } from '../../../services/etudiantService';
import type { Etudiant } from '../../../types/etudiant';

const EtudiantsListPage: React.FC = () => {
  const { moduleActions } = usePermissions();
  const { canCreate, canUpdate, canDelete, canValidate, canExport } = moduleActions('etudiants');
  const [etudiants, setEtudiants] = useState<Etudiant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Etudiant | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEtudiants({
        search: searchValue || undefined,
        statut: filterValues.statut || undefined,
      });
      setEtudiants(data);
    } catch (err) {
      console.error('Erreur lors du chargement des étudiants:', err);
      setError('Impossible de charger les étudiants. Vérifiez que le serveur backend est démarré.');
    } finally {
      setLoading(false);
    }
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'actif':
        return <Badge bg="success">Actif</Badge>;
      case 'suspendu':
        return <Badge bg="warning">Suspendu</Badge>;
      case 'diplômé':
      case 'diplome':
        return <Badge bg="info">Diplômé</Badge>;
      case 'exclu':
        return <Badge bg="danger">Exclu</Badge>;
      default:
        return <Badge bg="secondary">{statut || 'Actif'}</Badge>;
    }
  };

  const columns: Column<Etudiant>[] = [
    { key: 'matricule', header: 'Matricule', width: '140px', render: (item) => (
      <code className="text-primary">{item.matricule || '-'}</code>
    )},
    { key: 'nom', header: 'Étudiant', render: (item) => (
      <div className="d-flex align-items-center gap-2">
        <Avatar name={`${item.prenom} ${item.nom}`} size="sm" />
        <div>
          <div className="fw-medium">{item.nom} {item.prenom}</div>
          <small className="text-muted">{item.sexe === 'M' ? 'Masculin' : item.sexe === 'F' ? 'Féminin' : '-'}</small>
        </div>
      </div>
    )},
    { key: 'email', header: 'Email', render: (item) => (
      <span className="text-muted">{item.email || '-'}</span>
    )},
    { key: 'telephone', header: 'Téléphone', render: (item) => (
      <span>{item.telephone || '-'}</span>
    )},
    { key: 'statut', header: 'Statut', render: (item) => getStatutBadge(item.statut || 'actif') },
    { key: 'actions', header: 'Actions', width: '150px', render: (item) => (
      <div className="d-flex gap-1">
        <Link to={`/admin/etudiants/${item.id}`} className="btn btn-sm btn-outline-info" onClick={(e) => e.stopPropagation()}>
          <i className="bi bi-eye"></i>
        </Link>
        {canUpdate && (
          <Link to={`/admin/etudiants/${item.id}/edit`} className="btn btn-sm btn-outline-primary" onClick={(e) => e.stopPropagation()}>
            <i className="bi bi-pencil"></i>
          </Link>
        )}
        {canDelete && (
          <Button size="sm" variant="outline-danger" onClick={(e) => { e.stopPropagation(); handleDeleteClick(item); }}>
            <i className="bi bi-trash"></i>
          </Button>
        )}
      </div>
    )}
  ];

  const filteredData = etudiants.filter(item => {
    const matchSearch = !searchValue || 
      item.nom.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.prenom.toLowerCase().includes(searchValue.toLowerCase()) ||
      (item.matricule || '').toLowerCase().includes(searchValue.toLowerCase()) ||
      (item.email || '').toLowerCase().includes(searchValue.toLowerCase());
    const matchStatut = !filterValues.statut || item.statut === filterValues.statut;
    return matchSearch && matchStatut;
  });

  const handleDeleteClick = (item: Etudiant) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      await deleteEtudiant(selectedItem.id);
      setShowDeleteModal(false);
      loadData();
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setError('Impossible de supprimer l\'étudiant.');
    }
  };

  const handleBulkAction = (action: string) => {
    console.log('Bulk action:', action, 'on IDs:', selectedIds);
    setSelectedIds([]);
  };

  return (
    <div className="fade-in">
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <PageHeader
        title="Étudiants"
        subtitle="Gestion des étudiants inscrits"
        breadcrumbs={[
          { label: 'Étudiants', path: '/admin/etudiants' },
          { label: 'Liste' }
        ]}
        actions={
          <div className="d-flex gap-2">
            {canExport && (
              <Button variant="outline-primary">
                <i className="bi bi-download me-2"></i>
                Exporter
              </Button>
            )}
            {canCreate && (
              <Link to="/admin/etudiants/nouveau" className="btn btn-primary">
                <i className="bi bi-plus-lg me-2"></i>
                Nouvel étudiant
              </Link>
            )}
          </div>
        }
      />

      {/* Statistiques rapides */}
      <Row className="g-3 mb-4">
        <Col sm={6} md={3}>
          <div className="bg-white rounded p-3 border d-flex align-items-center gap-3">
            <div className="bg-primary bg-opacity-10 rounded p-2">
              <i className="bi bi-people fs-4 text-primary"></i>
            </div>
            <div>
              <div className="fs-4 fw-bold">{etudiants.length}</div>
              <small className="text-muted">Total étudiants</small>
            </div>
          </div>
        </Col>
        <Col sm={6} md={3}>
          <div className="bg-white rounded p-3 border d-flex align-items-center gap-3">
            <div className="bg-success bg-opacity-10 rounded p-2">
              <i className="bi bi-check-circle fs-4 text-success"></i>
            </div>
            <div>
              <div className="fs-4 fw-bold">{etudiants.filter(e => e.statut === 'inscrit').length}</div>
              <small className="text-muted">Inscrits</small>
            </div>
          </div>
        </Col>
        <Col sm={6} md={3}>
          <div className="bg-white rounded p-3 border d-flex align-items-center gap-3">
            <div className="bg-warning bg-opacity-10 rounded p-2">
              <i className="bi bi-clock fs-4 text-warning"></i>
            </div>
            <div>
              <div className="fs-4 fw-bold">{etudiants.filter(e => e.statut === 'en_attente').length}</div>
              <small className="text-muted">En attente</small>
            </div>
          </div>
        </Col>
        <Col sm={6} md={3}>
          <div className="bg-white rounded p-3 border d-flex align-items-center gap-3">
            <div className="bg-danger bg-opacity-10 rounded p-2">
              <i className="bi bi-x-circle fs-4 text-danger"></i>
            </div>
            <div>
              <div className="fs-4 fw-bold">{etudiants.filter(e => e.statut === 'suspendu').length}</div>
              <small className="text-muted">Suspendus</small>
            </div>
          </div>
        </Col>
      </Row>

      <DataCard
        title={`Liste des étudiants (${filteredData.length})`}
        actions={
          <div className="d-flex gap-2">
            {selectedIds.length > 0 && (canValidate || canDelete) && (
              <div className="d-flex gap-2 me-3">
                <Badge bg="primary" className="d-flex align-items-center px-3">
                  {selectedIds.length} sélectionné(s)
                </Badge>
                {canValidate && (
                  <Button size="sm" variant="outline-success" onClick={() => handleBulkAction('validate')}>
                    <i className="bi bi-check-lg me-1"></i>Valider
                  </Button>
                )}
                {canDelete && (
                  <Button size="sm" variant="outline-danger" onClick={() => handleBulkAction('delete')}>
                    <i className="bi bi-trash me-1"></i>Supprimer
                  </Button>
                )}
              </div>
            )}
            <Button variant="outline-secondary" size="sm" onClick={loadData}>
              <i className="bi bi-arrow-clockwise me-1"></i>
              Actualiser
            </Button>
          </div>
        }
      >
        <SearchFilter
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder="Rechercher par nom, prénom, matricule ou email..."
          filters={[
            {
              key: 'statut',
              label: 'Tous les statuts',
              type: 'select',
              options: [
                { value: 'actif', label: 'Actif' },
                { value: 'suspendu', label: 'Suspendu' },
                { value: 'diplômé', label: 'Diplômé' },
                { value: 'exclu', label: 'Exclu' }
              ]
            }
          ]}
          filterValues={filterValues}
          onFilterChange={(key, value) => setFilterValues({ ...filterValues, [key]: value })}
          onReset={() => { setSearchValue(''); setFilterValues({}); }}
        />

        <DataTable
          columns={columns}
          data={filteredData}
          loading={loading}
          selectable
          selectedIds={selectedIds}
          onSelectChange={setSelectedIds}
          emptyMessage="Aucun étudiant trouvé"
        />
      </DataCard>

      <ConfirmModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Supprimer l'étudiant"
        message={`Êtes-vous sûr de vouloir supprimer l'étudiant "${selectedItem?.prenom} ${selectedItem?.nom}" (${selectedItem?.matricule}) ?`}
        confirmLabel="Supprimer"
        variant="danger"
      />
    </div>
  );
};

export default EtudiantsListPage;
