import React, { useEffect, useState } from 'react';
import { Alert, Badge, Col, Row, Spinner, Table } from 'react-bootstrap';
import { PageHeader } from '../../components/layouts';
import { Avatar, DataCard } from '../../components/ui';
import portalService, { type MesProfilResponse } from '../../services/portalService';
import type { Inscription } from '../../types/etudiant';

const InfoRow: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
  <div className="mb-3">
    <div className="text-muted small">{label}</div>
    <div className="fw-medium">{value || '-'}</div>
  </div>
);

const StudentProfilPage: React.FC = () => {
  const [profil, setProfil] = useState<MesProfilResponse | null>(null);
  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [profilData, inscriptionsData] = await Promise.all([
          portalService.getMesProfil(),
          portalService.getMesInscriptions().catch(() => []),
        ]);
        setProfil(profilData);
        setInscriptions(inscriptionsData);
      } catch (err: unknown) {
        const message =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
            : null;
        setError(typeof message === 'string' ? message : 'Impossible de charger votre profil.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const etu = profil?.etudiant;
  const inscription = profil?.inscription_active;

  return (
    <div className="fade-in">
      <PageHeader
        title="Mon profil"
        subtitle="Informations personnelles et parcours académique"
        breadcrumbs={[
          { label: 'Tableau de bord', path: '/etudiant/dashboard' },
          { label: 'Mon profil' },
        ]}
      />

      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      )}

      {error && <Alert variant="warning">{error}</Alert>}

      {!loading && !error && etu && (
        <>
          <Row className="g-4 mb-4">
            <Col lg={4}>
              <DataCard title="Identité">
                <div className="text-center mb-4">
                  <Avatar name={etu.full_name} size="xl" className="mx-auto mb-3" />
                  <h5 className="mb-1">{etu.full_name}</h5>
                  <Badge bg="primary">{etu.matricule || 'Sans matricule'}</Badge>
                  {etu.statut && (
                    <Badge bg="light" text="dark" className="ms-2">
                      {etu.statut}
                    </Badge>
                  )}
                </div>
                <InfoRow label="Email" value={etu.email} />
                <InfoRow label="Téléphone" value={etu.telephone} />
                <InfoRow label="Date de naissance" value={etu.date_naissance} />
                <InfoRow label="Lieu de naissance" value={etu.lieu_naissance} />
                <InfoRow label="Sexe" value={etu.sexe} />
                <InfoRow label="Nationalité" value={etu.nationalite} />
              </DataCard>
            </Col>

            <Col lg={8}>
              <DataCard title="Coordonnées">
                <Row>
                  <Col md={6}>
                    <InfoRow label="Adresse" value={etu.adresse} />
                  </Col>
                  <Col md={6}>
                    <InfoRow label="Ville" value={etu.ville} />
                  </Col>
                </Row>
              </DataCard>

              <DataCard title="Inscription active" className="mt-4">
                {inscription ? (
                  <Row>
                    <Col sm={6} md={3}>
                      <InfoRow label="Année" value={inscription.annee_academique} />
                    </Col>
                    <Col sm={6} md={3}>
                      <InfoRow label="Niveau" value={String(inscription.niveau_id)} />
                    </Col>
                    <Col sm={6} md={3}>
                      <InfoRow label="Filière" value={String(inscription.filiere_id)} />
                    </Col>
                    <Col sm={6} md={3}>
                      <InfoRow label="Statut" value={inscription.statut_inscription} />
                    </Col>
                    <Col sm={6} md={3}>
                      <InfoRow label="Type" value={inscription.type_inscription} />
                    </Col>
                    <Col sm={6} md={3}>
                      <InfoRow label="Date inscription" value={inscription.date_inscription} />
                    </Col>
                  </Row>
                ) : (
                  <p className="text-muted mb-0">Aucune inscription active.</p>
                )}
              </DataCard>
            </Col>
          </Row>

          <DataCard title={`Historique des inscriptions (${inscriptions.length})`}>
            {inscriptions.length === 0 ? (
              <p className="text-muted mb-0 text-center py-4">Aucune inscription enregistrée.</p>
            ) : (
              <Table responsive hover className="data-table mb-0">
                <thead>
                  <tr>
                    <th>Année</th>
                    <th>Niveau</th>
                    <th>Filière</th>
                    <th>Type</th>
                    <th>Statut</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {inscriptions.map((insc) => (
                    <tr key={insc.id}>
                      <td className="fw-medium">{insc.annee_academique}</td>
                      <td>{insc.niveau_id}</td>
                      <td>{insc.filiere_id}</td>
                      <td>{insc.type_inscription}</td>
                      <td>
                        <Badge bg={insc.is_active ? 'success' : 'secondary'}>
                          {insc.statut_inscription}
                        </Badge>
                      </td>
                      <td>{insc.date_inscription}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </DataCard>
        </>
      )}
    </div>
  );
};

export default StudentProfilPage;
