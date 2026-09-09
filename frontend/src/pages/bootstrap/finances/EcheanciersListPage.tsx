import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Col, Row } from 'react-bootstrap';
import { PageHeader } from '../../../components/layouts';
import { DataCard, DataTable, SearchFilter, Column } from '../../../components/ui';
import { echeancierService } from '../../../services/echeancierService';
import type { Echeancier } from '../../../types/finance';

const STATUT_BADGE: Record<string, string> = {
  en_attente: 'warning',
  partiellement_payee: 'info',
  payee: 'success',
  en_retard: 'danger',
  annulee: 'secondary',
};

const EcheanciersListPage: React.FC = () => {
  const [echeances, setEcheances] = useState<Echeancier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [updating, setUpdating] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await echeancierService.getEcheanciers({
        limit: 500,
        statut: filterStatut || undefined,
      });
      setEcheances(data);
    } catch {
      setError('Impossible de charger les échéances.');
    } finally {
      setLoading(false);
    }
  }, [filterStatut]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';

  const filtered = echeances.filter((e) => {
    const q = searchValue.toLowerCase();
    return (
      !q ||
      String(e.facture_id).includes(q) ||
      String(e.etudiant_id).includes(q) ||
      String(e.numero_echeance).includes(q)
    );
  });

  const handleRefreshStatuts = async () => {
    setUpdating(true);
    try {
      await echeancierService.mettreAJourStatuts();
      await loadData();
    } catch {
      setError('Mise à jour des statuts impossible.');
    } finally {
      setUpdating(false);
    }
  };

  const columns: Column<Echeancier>[] = [
    { key: 'facture', header: 'Facture', render: (i) => `#${i.facture_id}` },
    { key: 'etudiant', header: 'Étudiant', render: (i) => `#${i.etudiant_id}` },
    { key: 'numero', header: 'N°', width: '60px', render: (i) => i.numero_echeance },
    {
      key: 'date',
      header: 'Échéance',
      render: (i) => new Date(i.date_echeance).toLocaleDateString('fr-FR'),
    },
    {
      key: 'montant',
      header: 'Montant',
      render: (i) => formatCurrency(Number(i.montant_echeance)),
    },
    {
      key: 'paye',
      header: 'Payé',
      render: (i) => formatCurrency(Number(i.montant_paye)),
    },
    {
      key: 'statut',
      header: 'Statut',
      render: (i) => (
        <Badge bg={STATUT_BADGE[i.statut] ?? 'secondary'}>{i.statut.replace(/_/g, ' ')}</Badge>
      ),
    },
  ];

  const stats = {
    total: echeances.length,
    retard: echeances.filter((e) => e.statut === 'en_retard').length,
    proches: echeances.filter((e) => {
      const diff = (new Date(e.date_echeance).getTime() - Date.now()) / 86400000;
      return diff >= 0 && diff <= 7 && e.statut === 'en_attente';
    }).length,
  };

  return (
    <div className="fade-in">
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <PageHeader
        title="Échéanciers"
        subtitle="Suivi des échéances de paiement par facture"
        breadcrumbs={[
          { label: 'Finances', path: '/admin/finances/factures' },
          { label: 'Échéanciers' },
        ]}
        actions={
          <Button variant="outline-primary" onClick={handleRefreshStatuts} disabled={updating}>
            <i className="bi bi-arrow-clockwise me-2" />
            {updating ? 'Mise à jour…' : 'Actualiser statuts'}
          </Button>
        }
      />

      <Row className="g-3 mb-4">
        <Col sm={4}>
          <div className="p-3 bg-primary text-white rounded">
            <h3 className="mb-0">{stats.total}</h3>
            <small>Échéances</small>
          </div>
        </Col>
        <Col sm={4}>
          <div className="p-3 bg-warning text-dark rounded">
            <h3 className="mb-0">{stats.proches}</h3>
            <small>À échéance (7 jours)</small>
          </div>
        </Col>
        <Col sm={4}>
          <div className="p-3 bg-danger text-white rounded">
            <h3 className="mb-0">{stats.retard}</h3>
            <small>En retard</small>
          </div>
        </Col>
      </Row>

      <DataCard title={`Liste (${filtered.length})`}>
        <SearchFilter
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder="Rechercher facture, étudiant..."
          filters={[
            {
              key: 'statut',
              label: 'Tous statuts',
              type: 'select',
              options: [
                { value: 'en_attente', label: 'En attente' },
                { value: 'en_retard', label: 'En retard' },
                { value: 'payee', label: 'Payée' },
                { value: 'partiellement_payee', label: 'Partielle' },
              ],
            },
          ]}
          filterValues={{ statut: filterStatut }}
          onFilterChange={(key, value) => key === 'statut' && setFilterStatut(value)}
          onReset={() => {
            setSearchValue('');
            setFilterStatut('');
          }}
        />
        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          emptyMessage="Aucune échéance"
        />
      </DataCard>
    </div>
  );
};

export default EcheanciersListPage;
