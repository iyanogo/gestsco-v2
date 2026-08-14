import React, { useState, useEffect } from 'react';
import { Row, Col, Button, Badge, Modal, Form } from 'react-bootstrap';
import { PageHeader } from '../../../components/layouts';
import { DataCard, DataTable, SearchFilter, ConfirmModal, Column } from '../../../components/ui';

interface Salle {
  id: number;
  code: string;
  nom: string;
  type: 'cours' | 'labo' | 'amphi' | 'reunion';
  capacite: number;
  batiment: string;
  equipements: string[];
  is_active: boolean;
}

const SallesListPage: React.FC = () => {
  const [salles, setSalles] = useState<Salle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Salle | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    nom: '',
    type: 'cours',
    capacite: 30,
    batiment: '',
    equipements: [] as string[]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setTimeout(() => {
      setSalles([
        { id: 1, code: 'S101', nom: 'Salle 101', type: 'cours', capacite: 40, batiment: 'Bâtiment A', equipements: ['Vidéoprojecteur', 'Tableau blanc'], is_active: true },
        { id: 2, code: 'S102', nom: 'Salle 102', type: 'cours', capacite: 35, batiment: 'Bâtiment A', equipements: ['Vidéoprojecteur'], is_active: true },
        { id: 3, code: 'S205', nom: 'Salle 205', type: 'cours', capacite: 50, batiment: 'Bâtiment B', equipements: ['Vidéoprojecteur', 'Climatisation'], is_active: true },
        { id: 4, code: 'LAB1', nom: 'Labo Info 1', type: 'labo', capacite: 25, batiment: 'Bâtiment C', equipements: ['Ordinateurs', 'Vidéoprojecteur', 'Climatisation'], is_active: true },
        { id: 5, code: 'LAB2', nom: 'Labo Info 2', type: 'labo', capacite: 25, batiment: 'Bâtiment C', equipements: ['Ordinateurs', 'Vidéoprojecteur'], is_active: true },
        { id: 6, code: 'LABR', nom: 'Labo Réseau', type: 'labo', capacite: 20, batiment: 'Bâtiment C', equipements: ['Équipements réseau', 'Ordinateurs'], is_active: true },
        { id: 7, code: 'AMPA', nom: 'Amphi A', type: 'amphi', capacite: 200, batiment: 'Bâtiment Principal', equipements: ['Vidéoprojecteur', 'Sonorisation', 'Climatisation'], is_active: true },
        { id: 8, code: 'AMPB', nom: 'Amphi B', type: 'amphi', capacite: 150, batiment: 'Bâtiment Principal', equipements: ['Vidéoprojecteur', 'Sonorisation'], is_active: true },
        { id: 9, code: 'REU1', nom: 'Salle de réunion 1', type: 'reunion', capacite: 15, batiment: 'Administration', equipements: ['Vidéoprojecteur', 'Visioconférence'], is_active: true },
      ]);
      setLoading(false);
    }, 500);
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'cours':
        return <Badge bg="primary">Salle de cours</Badge>;
      case 'labo':
        return <Badge bg="success">Laboratoire</Badge>;
      case 'amphi':
        return <Badge bg="info">Amphithéâtre</Badge>;
      case 'reunion':
        return <Badge bg="warning">Réunion</Badge>;
      default:
        return <Badge bg="secondary">{type}</Badge>;
    }
  };

  const columns: Column<Salle>[] = [
    { key: 'code', header: 'Code', width: '100px', render: (item) => (
      <code className="text-primary fw-medium">{item.code}</code>
    )},
    { key: 'nom', header: 'Nom' },
    { key: 'type', header: 'Type', render: (item) => getTypeBadge(item.type) },
    { key: 'capacite', header: 'Capacité', render: (item) => (
      <span><i className="bi bi-people me-1"></i>{item.capacite} places</span>
    )},
    { key: 'batiment', header: 'Bâtiment' },
    { key: 'equipements', header: 'Équipements', render: (item) => (
      <div className="d-flex flex-wrap gap-1">
        {item.equipements.slice(0, 2).map((eq, i) => (
          <Badge key={i} bg="light" text="dark" className="fw-normal">{eq}</Badge>
        ))}
        {item.equipements.length > 2 && (
          <Badge bg="secondary">+{item.equipements.length - 2}</Badge>
        )}
      </div>
    )},
    { key: 'is_active', header: 'Statut', render: (item) => (
      <Badge bg={item.is_active ? 'success' : 'secondary'}>
        {item.is_active ? 'Disponible' : 'Indisponible'}
      </Badge>
    )},
    { key: 'actions', header: 'Actions', width: '120px', render: (item) => (
      <div className="d-flex gap-1">
        <Button size="sm" variant="outline-primary" onClick={(e) => { e.stopPropagation(); handleEdit(item); }}>
          <i className="bi bi-pencil"></i>
        </Button>
        <Button size="sm" variant="outline-danger" onClick={(e) => { e.stopPropagation(); handleDeleteClick(item); }}>
          <i className="bi bi-trash"></i>
        </Button>
      </div>
    )}
  ];

  const filteredData = salles.filter(item => {
    const matchSearch = 
      item.nom.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.code.toLowerCase().includes(searchValue.toLowerCase());
    const matchType = !filterValues.type || item.type === filterValues.type;
    return matchSearch && matchType;
  });

  const handleAdd = () => {
    setSelectedItem(null);
    setFormData({ code: '', nom: '', type: 'cours', capacite: 30, batiment: '', equipements: [] });
    setShowModal(true);
  };

  const handleEdit = (item: Salle) => {
    setSelectedItem(item);
    setFormData({
      code: item.code,
      nom: item.nom,
      type: item.type,
      capacite: item.capacite,
      batiment: item.batiment,
      equipements: item.equipements
    });
    setShowModal(true);
  };

  const handleDeleteClick = (item: Salle) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const handleSave = () => {
    console.log('Saving:', formData);
    setShowModal(false);
    loadData();
  };

  const handleDelete = () => {
    console.log('Deleting:', selectedItem?.id);
    setShowDeleteModal(false);
    loadData();
  };

  // Statistiques
  const totalCapacite = salles.reduce((sum, s) => sum + s.capacite, 0);
  const nbLabos = salles.filter(s => s.type === 'labo').length;

  return (
    <div className="fade-in">
      <PageHeader
        title="Salles"
        subtitle="Gestion des salles et locaux"
        breadcrumbs={[
          { label: 'Emploi du temps', path: '/admin/emploi-temps' },
          { label: 'Salles' }
        ]}
        actions={
          <Button variant="primary" onClick={handleAdd}>
            <i className="bi bi-plus-lg me-2"></i>
            Nouvelle salle
          </Button>
        }
      />

      {/* Statistiques rapides */}
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
              <small className="text-muted">Laboratoires</small>
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
              <div className="fs-4 fw-bold">{salles.filter(s => s.is_active).length}</div>
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
              key: 'type',
              label: 'Tous les types',
              type: 'select',
              options: [
                { value: 'cours', label: 'Salle de cours' },
                { value: 'labo', label: 'Laboratoire' },
                { value: 'amphi', label: 'Amphithéâtre' },
                { value: 'reunion', label: 'Salle de réunion' }
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
          emptyMessage="Aucune salle trouvée"
        />
      </DataCard>

      {/* Modal Ajout/Modification */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedItem ? 'Modifier la salle' : 'Nouvelle salle'}
          </Modal.Title>
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
                <Form.Label>Nom *</Form.Label>
                <Form.Control
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="Nom de la salle"
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Type *</Form.Label>
                <Form.Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="cours">Salle de cours</option>
                  <option value="labo">Laboratoire</option>
                  <option value="amphi">Amphithéâtre</option>
                  <option value="reunion">Salle de réunion</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Capacité</Form.Label>
                <Form.Control
                  type="number"
                  min={1}
                  value={formData.capacite}
                  onChange={(e) => setFormData({ ...formData, capacite: parseInt(e.target.value) })}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Bâtiment</Form.Label>
                <Form.Control
                  value={formData.batiment}
                  onChange={(e) => setFormData({ ...formData, batiment: e.target.value })}
                  placeholder="Bâtiment"
                />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group>
                <Form.Label>Équipements</Form.Label>
                <div className="d-flex flex-wrap gap-2">
                  {['Vidéoprojecteur', 'Tableau blanc', 'Climatisation', 'Ordinateurs', 'Sonorisation', 'Visioconférence'].map(eq => (
                    <Form.Check
                      key={eq}
                      type="checkbox"
                      label={eq}
                      checked={formData.equipements.includes(eq)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, equipements: [...formData.equipements, eq] });
                        } else {
                          setFormData({ ...formData, equipements: formData.equipements.filter(e => e !== eq) });
                        }
                      }}
                    />
                  ))}
                </div>
              </Form.Group>
            </Col>
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
        title="Supprimer la salle"
        message={`Êtes-vous sûr de vouloir supprimer la salle "${selectedItem?.nom}" ?`}
        confirmLabel="Supprimer"
        variant="danger"
      />
    </div>
  );
};

export default SallesListPage;
