import React, { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Spinner, Table } from 'react-bootstrap';
import { PageHeader } from '../../components/layouts';
import portalService from '../../services/portalService';
import factureService from '../../services/factureService';
import type { Facture } from '../../types/finance';
import { formatDate, formatMontant, formatStatutFacture } from '../../utils/formatters';

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

const StudentFinancesFacturesPage: React.FC = () => {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await portalService.getMesFactures();
        setFactures(data);
      } catch (err: unknown) {
        const message =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
            : null;
        setError(typeof message === 'string' ? message : 'Impossible de charger vos factures.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDownloadPdf = async (facture: Facture) => {
    try {
      setDownloadingId(facture.id);
      const blob = await factureService.downloadFacturePDF(facture.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `facture_${facture.numero_facture}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Impossible de télécharger cette facture.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Mes factures"
        subtitle="Liste de vos factures (lecture seule)"
        breadcrumbs={[
          { label: 'Tableau de bord', path: '/etudiant/dashboard' },
          { label: 'Mes finances', path: '/etudiant/finances/compte' },
          { label: 'Mes factures' },
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
            {factures.length === 0 ? (
              <p className="text-muted p-4 mb-0">Aucune facture disponible.</p>
            ) : (
              <Table responsive hover className="mb-0">
                <thead>
                  <tr>
                    <th>N° facture</th>
                    <th>Émission</th>
                    <th>Échéance</th>
                    <th>Montant</th>
                    <th>Payé</th>
                    <th>Reste</th>
                    <th>Statut</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {factures.map((f) => {
                    const statut = formatStatutFacture(f.statut);
                    return (
                      <tr key={f.id}>
                        <td className="fw-medium">{f.numero_facture}</td>
                        <td>{formatDate(f.date_emission)}</td>
                        <td>{formatDate(f.date_echeance)}</td>
                        <td>{formatMontant(f.montant_total, f.devise)}</td>
                        <td>{formatMontant(f.montant_paye, f.devise)}</td>
                        <td>{formatMontant(f.montant_restant, f.devise)}</td>
                        <td>
                          <Badge bg={bootstrapBadge(statut.color)}>{statut.label}</Badge>
                        </td>
                        <td>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handleDownloadPdf(f)}
                            disabled={downloadingId === f.id}
                            title="Télécharger PDF"
                          >
                            <i className="bi bi-file-earmark-pdf"></i>
                          </Button>
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

export default StudentFinancesFacturesPage;
