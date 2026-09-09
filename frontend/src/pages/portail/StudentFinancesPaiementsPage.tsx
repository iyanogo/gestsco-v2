import React, { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Spinner, Table } from 'react-bootstrap';
import { PageHeader } from '../../components/layouts';
import portalService from '../../services/portalService';
import api from '../../services/api';
import type { PaiementFacture } from '../../types/finance';
import { formatDate, formatMontant, formatModePaiement, formatStatutPaiement } from '../../utils/formatters';

const bootstrapBadge = (color: string): string => {
  const map: Record<string, string> = {
    success: 'success',
    warning: 'warning',
    danger: 'danger',
    info: 'info',
    primary: 'primary',
    secondary: 'secondary',
    default: 'secondary',
  };
  return map[color] ?? 'secondary';
};

const StudentFinancesPaiementsPage: React.FC = () => {
  const [paiements, setPaiements] = useState<PaiementFacture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await portalService.getMesPaiements();
        setPaiements(data);
      } catch (err: unknown) {
        const message =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
            : null;
        setError(typeof message === 'string' ? message : 'Impossible de charger vos paiements.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDownloadRecu = async (paiement: PaiementFacture) => {
    if (paiement.statut !== 'valide') return;
    try {
      setDownloadingId(paiement.id);
      const response = await api.get(`/api/v1/paiements-factures/${paiement.id}/recu`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `recu_${paiement.numero_recu ?? paiement.id}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Impossible de télécharger ce reçu.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Mes paiements"
        subtitle="Historique de vos paiements (lecture seule)"
        breadcrumbs={[
          { label: 'Tableau de bord', path: '/etudiant/dashboard' },
          { label: 'Mes finances', path: '/etudiant/finances/compte' },
          { label: 'Mes paiements' },
        ]}
      />

      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      )}

      {error && <Alert variant="warning">{error}</Alert>}

      {!loading && !error && (
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            {paiements.length === 0 ? (
              <p className="text-muted p-4 mb-0">Aucun paiement enregistré.</p>
            ) : (
              <Table responsive hover className="mb-0">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Référence</th>
                    <th>Mode</th>
                    <th>Montant</th>
                    <th>Statut</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {paiements.map((p) => {
                    const statut = formatStatutPaiement(p.statut);
                    return (
                      <tr key={p.id}>
                        <td>{formatDate(p.date_paiement)}</td>
                        <td>{p.numero_recu ?? `#${p.id}`}</td>
                        <td>{formatModePaiement(p.mode_paiement)}</td>
                        <td>{formatMontant(Number(p.montant), p.devise)}</td>
                        <td>
                          <Badge bg={bootstrapBadge(statut.color)}>{statut.label}</Badge>
                        </td>
                        <td>
                          {p.statut === 'valide' && (
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => handleDownloadRecu(p)}
                              disabled={downloadingId === p.id}
                              title="Télécharger reçu PDF"
                            >
                              <i className="bi bi-file-earmark-pdf"></i>
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default StudentFinancesPaiementsPage;
