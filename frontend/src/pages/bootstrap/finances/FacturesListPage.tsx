import React, { useState, useEffect } from 'react';
import { Row, Col, Button, Badge, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../../components/layouts';
import { DataCard, DataTable, SearchFilter, Column, StatCard } from '../../../components/ui';
import { factureService } from '../../../services/factureService';
import type { Facture } from '../../../types/finance';

const FacturesListPage: React.FC = () => {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await factureService.getFactures({
        statut: filterValues.statut || undefined,
      });
      setFactures(data);
    } catch (err) {
      console.error('Erreur lors du chargement des factures:', err);
      setError('Impossible de charger les factures. Vérifiez que le serveur backend est démarré.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'payee':
        return <Badge bg="success">Payée</Badge>;
      case 'partiellement_payee':
        return <Badge bg="info">Partiellement payée</Badge>;
      case 'en_attente':
        return <Badge bg="warning">En attente</Badge>;
      case 'annulee':
        return <Badge bg="secondary">Annulée</Badge>;
      default:
        return <Badge bg="secondary">{statut || 'En attente'}</Badge>;
    }
  };

  const columns: Column<Facture>[] = [
    { key: 'numero_facture', header: 'N° Facture', render: (item) => (
      <code className="text-primary fw-medium">{item.numero_facture}</code>
    )},
    { key: 'etudiant_id', header: 'Étudiant ID', render: (item) => (
      <span className="text-muted">#{item.etudiant_id}</span>
    )},
    { key: 'montant_total', header: 'Montant', render: (item) => (
      <span className="fw-medium">{formatCurrency(item.montant_total)}</span>
    )},
    { key: 'montant_paye', header: 'Payé', render: (item) => (
      <div>
        <span className="text-success">{formatCurrency(item.montant_paye)}</span>
        <div className="progress mt-1" style={{ height: '4px' }}>
          <div 
            className="progress-bar bg-success" 
            style={{ width: `${item.montant_total > 0 ? (item.montant_paye / item.montant_total) * 100 : 0}%` }}
          />
        </div>
      </div>
    )},
    { key: 'date_echeance', header: 'Échéance', render: (item) => (
      <span>{item.date_echeance ? new Date(item.date_echeance).toLocaleDateString('fr-FR') : '-'}</span>
    )},
    { key: 'statut', header: 'Statut', render: (item) => getStatutBadge(item.statut) },
    { key: 'actions', header: 'Actions', width: '150px', render: (item) => (
      <div className="d-flex gap-1">
        <Link to={`/admin/finances/factures/${item.id}`} className="btn btn-sm btn-outline-info">
          <i className="bi bi-eye"></i>
        </Link>
        <Button size="sm" variant="outline-success" title="Enregistrer un paiement">
          <i className="bi bi-cash"></i>
        </Button>
        <Button size="sm" variant="outline-primary" title="Imprimer">
          <i className="bi bi-printer"></i>
        </Button>
      </div>
    )}
  ];

  const filteredData = factures.filter(item => {
    const matchSearch = !searchValue ||
      item.numero_facture.toLowerCase().includes(searchValue.toLowerCase()) ||
      String(item.etudiant_id).includes(searchValue);
    const matchStatut = !filterValues.statut || item.statut === filterValues.statut;
    return matchSearch && matchStatut;
  });

  // Calculs statistiques
  const totalFacture = factures.reduce((sum, f) => sum + f.montant_total, 0);
  const totalPaye = factures.reduce((sum, f) => sum + f.montant_paye, 0);
  const totalImpaye = factures.reduce((sum, f) => sum + f.montant_restant, 0);
  const facturesPayees = factures.filter(f => f.statut === 'payee').length;

  return (
    <div className="fade-in">
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <PageHeader
        title="Factures"
        subtitle="Gestion des factures étudiants"
        breadcrumbs={[
          { label: 'Finances', path: '/admin/finances' },
          { label: 'Factures' }
        ]}
        actions={
          <div className="d-flex gap-2">
            <Button variant="outline-primary">
              <i className="bi bi-download me-2"></i>
              Exporter
            </Button>
            <Link to="/admin/finances/factures/nouveau" className="btn btn-primary">
              <i className="bi bi-plus-lg me-2"></i>
              Nouvelle facture
            </Link>
          </div>
        }
      />

      {/* Statistiques */}
      <Row className="g-3 mb-4">
        <Col sm={6} xl={3}>
          <StatCard
            title="Total facturé"
            value={formatCurrency(totalFacture)}
            icon="receipt"
            variant="primary"
          />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard
            title="Total encaissé"
            value={formatCurrency(totalPaye)}
            icon="cash-stack"
            variant="success"
          />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard
            title="Reste à percevoir"
            value={formatCurrency(totalImpaye)}
            icon="exclamation-triangle"
            variant="warning"
          />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard
            title="Factures soldées"
            value={`${facturesPayees}/${factures.length}`}
            icon="check-circle"
            variant="info"
          />
        </Col>
      </Row>

      <DataCard
        title={`Liste des factures (${filteredData.length})`}
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
          searchPlaceholder="Rechercher par numéro, étudiant..."
          filters={[
            {
              key: 'statut',
              label: 'Tous les statuts',
              type: 'select',
              options: [
                { value: 'en_attente', label: 'En attente' },
                { value: 'partiellement_payee', label: 'Partiellement payée' },
                { value: 'payee', label: 'Payée' },
                { value: 'annulee', label: 'Annulée' }
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
          emptyMessage="Aucune facture trouvée"
        />
      </DataCard>
    </div>
  );
};

export default FacturesListPage;
