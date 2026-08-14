import React, { useState, useEffect } from 'react';
import { Row, Col, Button, Badge, Modal, Form } from 'react-bootstrap';
import { PageHeader } from '../../../components/layouts';
import { DataCard, DataTable, SearchFilter, Column, StatCard } from '../../../components/ui';

interface Paiement {
  id: number;
  reference: string;
  etudiant: string;
  matricule: string;
  facture: string;
  montant: number;
  mode_paiement: string;
  date: string;
  statut: 'valide' | 'en_attente' | 'annule';
}

const PaiementsListPage: React.FC = () => {
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    etudiant_id: '',
    facture_id: '',
    montant: '',
    mode_paiement: 'especes',
    reference: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setTimeout(() => {
      setPaiements([
        { id: 1, reference: 'PAY-2026-0001', etudiant: 'Amadou DIALLO', matricule: '2024-0125', facture: 'FAC-2025-0001', montant: 150000, mode_paiement: 'Espèces', date: '06/01/2026', statut: 'valide' },
        { id: 2, reference: 'PAY-2026-0002', etudiant: 'Amadou DIALLO', matricule: '2024-0125', facture: 'FAC-2025-0001', montant: 100000, mode_paiement: 'Mobile Money', date: '05/01/2026', statut: 'valide' },
        { id: 3, reference: 'PAY-2026-0003', etudiant: 'Fatou TRAORE', matricule: '2024-0126', facture: 'FAC-2025-0002', montant: 450000, mode_paiement: 'Virement', date: '04/01/2026', statut: 'valide' },
        { id: 4, reference: 'PAY-2026-0004', etudiant: 'Ibrahim KONE', matricule: '2024-0127', facture: 'FAC-2025-0003', montant: 150000, mode_paiement: 'Espèces', date: '03/01/2026', statut: 'valide' },
        { id: 5, reference: 'PAY-2026-0005', etudiant: 'Aïcha OUEDRAOGO', matricule: '2024-0128', facture: 'FAC-2025-0004', montant: 275000, mode_paiement: 'Chèque', date: '02/01/2026', statut: 'en_attente' },
        { id: 6, reference: 'PAY-2026-0006', etudiant: 'Mariama BARRY', matricule: '2024-0130', facture: 'FAC-2025-0006', montant: 225000, mode_paiement: 'Mobile Money', date: '01/01/2026', statut: 'valide' },
      ]);
      setLoading(false);
    }, 500);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'valide':
        return <Badge bg="success">Validé</Badge>;
      case 'en_attente':
        return <Badge bg="warning">En attente</Badge>;
      case 'annule':
        return <Badge bg="danger">Annulé</Badge>;
      default:
        return <Badge bg="secondary">{statut}</Badge>;
    }
  };

  const getModePaiementIcon = (mode: string) => {
    switch (mode.toLowerCase()) {
      case 'espèces':
        return 'bi-cash';
      case 'mobile money':
        return 'bi-phone';
      case 'virement':
        return 'bi-bank';
      case 'chèque':
        return 'bi-file-text';
      default:
        return 'bi-credit-card';
    }
  };

  const columns: Column<Paiement>[] = [
    { key: 'reference', header: 'Référence', render: (item) => (
      <code className="text-primary fw-medium">{item.reference}</code>
    )},
    { key: 'date', header: 'Date' },
    { key: 'etudiant', header: 'Étudiant', render: (item) => (
      <div>
        <div className="fw-medium">{item.etudiant}</div>
        <small className="text-muted">{item.matricule}</small>
      </div>
    )},
    { key: 'facture', header: 'Facture', render: (item) => (
      <code>{item.facture}</code>
    )},
    { key: 'montant', header: 'Montant', render: (item) => (
      <span className="fw-bold text-success">{formatCurrency(item.montant)}</span>
    )},
    { key: 'mode_paiement', header: 'Mode', render: (item) => (
      <span>
        <i className={`bi ${getModePaiementIcon(item.mode_paiement)} me-1`}></i>
        {item.mode_paiement}
      </span>
    )},
    { key: 'statut', header: 'Statut', render: (item) => getStatutBadge(item.statut) },
    { key: 'actions', header: 'Actions', width: '120px', render: () => (
      <div className="d-flex gap-1">
        <Button size="sm" variant="outline-info" title="Voir détails">
          <i className="bi bi-eye"></i>
        </Button>
        <Button size="sm" variant="outline-primary" title="Imprimer reçu">
          <i className="bi bi-printer"></i>
        </Button>
      </div>
    )}
  ];

  const filteredData = paiements.filter(item => {
    const matchSearch = 
      item.etudiant.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.reference.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.matricule.toLowerCase().includes(searchValue.toLowerCase());
    const matchStatut = !filterValues.statut || item.statut === filterValues.statut;
    const matchMode = !filterValues.mode || item.mode_paiement === filterValues.mode;
    return matchSearch && matchStatut && matchMode;
  });

  // Calculs statistiques
  const totalEncaisse = paiements.filter(p => p.statut === 'valide').reduce((sum, p) => sum + p.montant, 0);
  const totalEnAttente = paiements.filter(p => p.statut === 'en_attente').reduce((sum, p) => sum + p.montant, 0);
  const nbPaiementsJour = paiements.filter(p => p.date === '06/01/2026').length;

  const handleSave = () => {
    console.log('Saving payment:', formData);
    setShowModal(false);
    loadData();
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Paiements"
        subtitle="Gestion des paiements étudiants"
        breadcrumbs={[
          { label: 'Finances', path: '/admin/finances' },
          { label: 'Paiements' }
        ]}
        actions={
          <div className="d-flex gap-2">
            <Button variant="outline-primary">
              <i className="bi bi-download me-2"></i>
              Exporter
            </Button>
            <Button variant="primary" onClick={() => setShowModal(true)}>
              <i className="bi bi-plus-lg me-2"></i>
              Nouveau paiement
            </Button>
          </div>
        }
      />

      {/* Statistiques */}
      <Row className="g-3 mb-4">
        <Col sm={6} xl={3}>
          <StatCard
            title="Total encaissé"
            value={formatCurrency(totalEncaisse)}
            icon="cash-stack"
            variant="success"
          />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard
            title="En attente validation"
            value={formatCurrency(totalEnAttente)}
            icon="hourglass-split"
            variant="warning"
          />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard
            title="Paiements du jour"
            value={nbPaiementsJour}
            icon="calendar-check"
            variant="info"
          />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard
            title="Total paiements"
            value={paiements.length}
            icon="receipt"
            variant="primary"
          />
        </Col>
      </Row>

      <DataCard
        title={`Liste des paiements (${filteredData.length})`}
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
          searchPlaceholder="Rechercher par référence, étudiant..."
          filters={[
            {
              key: 'statut',
              label: 'Tous les statuts',
              type: 'select',
              options: [
                { value: 'valide', label: 'Validé' },
                { value: 'en_attente', label: 'En attente' },
                { value: 'annule', label: 'Annulé' }
              ]
            },
            {
              key: 'mode',
              label: 'Tous les modes',
              type: 'select',
              options: [
                { value: 'Espèces', label: 'Espèces' },
                { value: 'Mobile Money', label: 'Mobile Money' },
                { value: 'Virement', label: 'Virement' },
                { value: 'Chèque', label: 'Chèque' }
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
          emptyMessage="Aucun paiement trouvé"
        />
      </DataCard>

      {/* Modal Nouveau Paiement */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-cash-stack me-2"></i>
            Enregistrer un paiement
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Étudiant *</Form.Label>
                <Form.Select
                  value={formData.etudiant_id}
                  onChange={(e) => setFormData({ ...formData, etudiant_id: e.target.value })}
                >
                  <option value="">Sélectionner un étudiant</option>
                  <option value="1">Amadou DIALLO (2024-0125)</option>
                  <option value="2">Fatou TRAORE (2024-0126)</option>
                  <option value="3">Ibrahim KONE (2024-0127)</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Facture *</Form.Label>
                <Form.Select
                  value={formData.facture_id}
                  onChange={(e) => setFormData({ ...formData, facture_id: e.target.value })}
                >
                  <option value="">Sélectionner une facture</option>
                  <option value="1">FAC-2025-0001 - Reste: 100 000 FCFA</option>
                  <option value="3">FAC-2025-0003 - Reste: 300 000 FCFA</option>
                  <option value="5">FAC-2025-0005 - Reste: 450 000 FCFA</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Montant *</Form.Label>
                <Form.Control
                  type="number"
                  value={formData.montant}
                  onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
                  placeholder="Montant en FCFA"
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Mode de paiement *</Form.Label>
                <Form.Select
                  value={formData.mode_paiement}
                  onChange={(e) => setFormData({ ...formData, mode_paiement: e.target.value })}
                >
                  <option value="especes">Espèces</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="virement">Virement bancaire</option>
                  <option value="cheque">Chèque</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Référence externe</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  placeholder="N° transaction, chèque..."
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Annuler
          </Button>
          <Button variant="success" onClick={handleSave}>
            <i className="bi bi-check-lg me-2"></i>
            Enregistrer le paiement
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PaiementsListPage;
