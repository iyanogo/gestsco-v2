import React, { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Row, Spinner } from 'react-bootstrap';
import { PageHeader } from '../../components/layouts';
import portalService from '../../services/portalService';
import compteEtudiantService from '../../services/compteEtudiantService';
import type { CompteEtudiantWithDetails } from '../../types/finance';
import { formatDate, formatMontant, formatStatutCompte } from '../../utils/formatters';

const StudentFinancesComptePage: React.FC = () => {
  const [compte, setCompte] = useState<CompteEtudiantWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await portalService.getMonCompte();
        setCompte(data);
      } catch (err: unknown) {
        const message =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
            : null;
        setError(typeof message === 'string' ? message : 'Impossible de charger votre compte.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDownloadReleve = async () => {
    if (!compte) return;
    try {
      setDownloading(true);
      const blob = await compteEtudiantService.downloadRelevePDF(compte.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `releve_compte_${compte.id}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Impossible de télécharger le relevé PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const statutCompte = compte ? formatStatutCompte(compte.statut_compte) : null;

  return (
    <div className="fade-in">
      <PageHeader
        title="Mon compte"
        subtitle="Situation financière (lecture seule)"
        breadcrumbs={[
          { label: 'Tableau de bord', path: '/etudiant/dashboard' },
          { label: 'Mes finances', path: '/etudiant/finances/compte' },
          { label: 'Mon compte' },
        ]}
      />

      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      )}

      {error && <Alert variant="warning">{error}</Alert>}

      {!loading && !error && compte && (
        <>
          <Row className="g-3 mb-4">
            <Col md={3}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <Card.Title className="text-muted small">Solde actuel</Card.Title>
                  <div className={`fs-4 fw-bold ${Number(compte.solde_actuel) < 0 ? 'text-danger' : 'text-success'}`}>
                    {formatMontant(Number(compte.solde_actuel), compte.devise)}
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <Card.Title className="text-muted small">Total facturé</Card.Title>
                  <div className="fs-5 fw-bold">{formatMontant(Number(compte.total_facture), compte.devise)}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <Card.Title className="text-muted small">Total payé</Card.Title>
                  <div className="fs-5 fw-bold text-success">
                    {formatMontant(Number(compte.total_paye), compte.devise)}
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <Card.Title className="text-muted small">Reste à payer</Card.Title>
                  <div className="fs-5 fw-bold text-danger">
                    {formatMontant(Number(compte.total_restant), compte.devise)}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Card className="border-0 shadow-sm mb-4">
            <Card.Body className="d-flex flex-wrap justify-content-between align-items-center gap-3">
              <div>
                <div className="text-muted small">Année académique</div>
                <div className="fw-medium">{compte.annee_academique_code ?? compte.annee_academique_id}</div>
              </div>
              {statutCompte && (
                <Badge bg={statutCompte.color === 'success' ? 'success' : 'secondary'}>
                  {statutCompte.label}
                </Badge>
              )}
              <Button
                variant="outline-primary"
                size="sm"
                onClick={handleDownloadReleve}
                disabled={downloading}
              >
                <i className="bi bi-file-earmark-pdf me-1"></i>
                {downloading ? 'Téléchargement…' : 'Relevé PDF'}
              </Button>
            </Card.Body>
          </Card>

          {compte.date_derniere_operation && (
            <p className="text-muted small">
              Dernière opération : {formatDate(compte.date_derniere_operation)}
            </p>
          )}

          <Alert variant="info" className="mb-0">
            Consultation seule - les paiements sont enregistrés par la scolarité/comptabilité.
          </Alert>
        </>
      )}
    </div>
  );
};

export default StudentFinancesComptePage;
