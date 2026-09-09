import React, { useState, useEffect } from 'react';
import { Row, Col, Button, Badge, Modal, Form, Alert } from 'react-bootstrap';
import { PageHeader } from '../../../components/layouts';
import { DataCard, DataTable, SearchFilter, Column, StatCard } from '../../../components/ui';
import { paiementFactureService } from '../../../services/paiementFactureService';
import { downloadBlob } from '../../../utils/formatters';
import type { Paiement } from '../../../types/finance';

const MODE_LABELS: Record<string, string> = {
  especes: 'Espèces',
  mobile_money: 'Mobile Money',
  virement: 'Virement',
  cheque: 'Chèque',
  carte_bancaire: 'Carte bancaire',
  autre: 'Autre',
};

const PaiementsListPage: React.FC = () => {
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    etudiant_id: '',
    facture_id: '',
    montant: '',
    mode_paiement: 'especes',
    reference: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await paiementFactureService.getPaiements({
        statut: filterValues.statut || undefined,
        mode_paiement: filterValues.mode || undefined,
      });
      setPaiements(data);
    } catch (err) {
      console.error('Erreur lors du chargement des paiements:', err);
      setError('Impossible de charger les paiements.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  const formatDate = (value: string) => {
    try {
      return new Date(value).toLocaleDateString('fr-FR');
    } catch {
      return value;
    }
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'valide':
        return <Badge bg="success">Validé</Badge>;
      case 'en_attente':
        return <Badge bg="warning">En attente</Badge>;
      case 'rejete':
        return <Badge bg="danger">Rejeté</Badge>;
      case 'annule':
        return <Badge bg="secondary">Annulé</Badge>;
      default:
        return <Badge bg="secondary">{statut}</Badge>;
    }
  };

  const getModePaiementIcon = (mode: string) => {
    switch (mode) {
      case 'especes':
        return 'bi-cash';
      case 'mobile_money':
        return 'bi-phone';
      case 'virement':
        return 'bi-bank';
      case 'cheque':
        return 'bi-file-text';
      default:
        return 'bi-credit-card';
    }
  };

  const handleDownloadRecu = async (paiement: Paiement) => {
    if (paiement.statut !== 'valide') {
      setError('Seuls les paiements validés disposent d\'un reçu PDF.');
      return;
    }
    try {
      const blob = await paiementFactureService.downloadRecuPDF(paiement.id);
      downloadBlob(blob, `recu_${paiement.numero_paiement}.pdf`);
    } catch (err) {
      console.error('Erreur PDF reçu:', err);
      setError('Impossible de générer le reçu PDF.');
    }
  };

  const columns: Column<Paiement>[] = [
    {
      key: 'numero_paiement',
      header: 'Référence',
      render: (item) => (
        <code className="text-primary fw-medium">{item.numero_paiement}</code>
      ),
    },
    {
      key: 'date_paiement',
      header: 'Date',
      render: (item) => formatDate(item.date_paiement),
    },
    {
      key: 'etudiant_id',
      header: 'Étudiant',
      render: (item) => (
        <div>
          <div className="fw-medium">Étudiant #{item.etudiant_id}</div>
          {item.reference_transaction && (
            <small className="text-muted">{item.reference_transaction}</small>
          )}
        </div>
      ),
    },
    {
      key: 'facture_id',
      header: 'Facture',
      render: (item) => <code>#{item.facture_id}</code>,
    },
    {
      key: 'montant',
      header: 'Montant',
      render: (item) => (
        <span className="fw-bold text-success">{formatCurrency(item.montant)}</span>
      ),
    },
    {
      key: 'mode_paiement',
      header: 'Mode',
      render: (item) => (
        <span>
          <i className={`bi ${getModePaiementIcon(item.mode_paiement)} me-1`}></i>
          {MODE_LABELS[item.mode_paiement] || item.mode_paiement}
        </span>
      ),
    },
    {
      key: 'statut',
      header: 'Statut',
      render: (item) => getStatutBadge(item.statut),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '120px',
      render: (item) => (
        <div className="d-flex gap-1">
          <Button size="sm" variant="outline-info" title="Voir détails">
            <i className="bi bi-eye"></i>
          </Button>
          <Button
            size="sm"
            variant="outline-primary"
            title="Télécharger reçu PDF"
            disabled={item.statut !== 'valide'}
            onClick={() => handleDownloadRecu(item)}
          >
            <i className="bi bi-file-earmark-pdf"></i>
          </Button>
        </div>
      ),
    },
  ];

  const filteredData = paiements.filter((item) => {
    const term = searchValue.toLowerCase();
    const matchSearch =
      !term ||
      item.numero_paiement.toLowerCase().includes(term) ||
      String(item.etudiant_id).includes(term) ||
      String(item.facture_id).includes(term) ||
      (item.reference_transaction || '').toLowerCase().includes(term);
    const matchStatut = !filterValues.statut || item.statut === filterValues.statut;
    const matchMode = !filterValues.mode || item.mode_paiement === filterValues.mode;
    return matchSearch && matchStatut && matchMode;
  });

  const totalEncaisse = paiements
    .filter((p) => p.statut === 'valide')
    .reduce((sum, p) => sum + p.montant, 0);
  const totalEnAttente = paiements
    .filter((p) => p.statut === 'en_attente')
    .reduce((sum, p) => sum + p.montant, 0);
  const today = new Date().toISOString().slice(0, 10);
  const nbPaiementsJour = paiements.filter((p) =>
    p.date_paiement.startsWith(today)
  ).length;

  const handleSave = async () => {
    if (!formData.etudiant_id || !formData.facture_id || !formData.montant) {
      setError('Veuillez renseigner étudiant, facture et montant.');
      return;
    }

    try {
      await paiementFactureService.createPaiement({
        etudiant_id: Number(formData.etudiant_id),
        facture_id: Number(formData.facture_id),
        montant: Number(formData.montant),
        mode_paiement: formData.mode_paiement,
        reference_transaction: formData.reference || undefined,
      });
      setShowModal(false);
      await loadData();
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement:', err);
      setError('Erreur lors de l\'enregistrement du paiement.');
    }
  };

  return (
    <div className="fade-in">
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <PageHeader
        title="Paiements"
        subtitle="Gestion des paiements étudiants"
        breadcrumbs={[
          { label: 'Finances', path: '/admin/finances' },
          { label: 'Paiements' },
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
                { value: 'rejete', label: 'Rejeté' },
                { value: 'annule', label: 'Annulé' },
              ],
            },
            {
              key: 'mode',
              label: 'Tous les modes',
              type: 'select',
              options: [
                { value: 'especes', label: 'Espèces' },
                { value: 'mobile_money', label: 'Mobile Money' },
                { value: 'virement', label: 'Virement' },
                { value: 'cheque', label: 'Chèque' },
              ],
            },
          ]}
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
          emptyMessage="Aucun paiement trouvé"
        />
      </DataCard>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-cash-stack me-2"></i>
            Enregistrer un paiement
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info" className="small">
            Saisissez les identifiants étudiant et facture existants en base.
          </Alert>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>ID Étudiant *</Form.Label>
                <Form.Control
                  type="number"
                  value={formData.etudiant_id}
                  onChange={(e) =>
                    setFormData({ ...formData, etudiant_id: e.target.value })
                  }
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>ID Facture *</Form.Label>
                <Form.Control
                  type="number"
                  value={formData.facture_id}
                  onChange={(e) =>
                    setFormData({ ...formData, facture_id: e.target.value })
                  }
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Montant *</Form.Label>
                <Form.Control
                  type="number"
                  value={formData.montant}
                  onChange={(e) =>
                    setFormData({ ...formData, montant: e.target.value })
                  }
                  placeholder="Montant en FCFA"
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Mode de paiement *</Form.Label>
                <Form.Select
                  value={formData.mode_paiement}
                  onChange={(e) =>
                    setFormData({ ...formData, mode_paiement: e.target.value })
                  }
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
                  onChange={(e) =>
                    setFormData({ ...formData, reference: e.target.value })
                  }
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
