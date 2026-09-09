import React, { useEffect, useState } from 'react';
import { Alert, Badge, Spinner, Table } from 'react-bootstrap';
import { PageHeader } from '../../components/layouts';
import { DataCard } from '../../components/ui';
import portalService from '../../services/portalService';
import type { Stage } from '../../types/anneeAcademique';

const formatEtudiantStage = (stage: Stage) => {
  const name = [stage.etudiant_prenom, stage.etudiant_nom].filter(Boolean).join(' ');
  if (name && stage.etudiant_matricule) {
    return `${name} (${stage.etudiant_matricule})`;
  }
  if (name) return name;
  if (stage.etudiant_matricule) return stage.etudiant_matricule;
  return `#${stage.etudiant_id}`;
};

const TeacherStagesPage: React.FC = () => {
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await portalService.getMesStagesEncadres();
        setStages(data);
      } catch (err: unknown) {
        const message =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
            : null;
        setError(typeof message === 'string' ? message : 'Impossible de charger vos stages encadrés.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statutVariant = (statut: string) => {
    switch (statut) {
      case 'valide':
        return 'success';
      case 'termine':
        return 'info';
      case 'invalide':
        return 'danger';
      default:
        return 'warning';
    }
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Mes stages encadrés"
        subtitle="Stages dont vous êtes l'encadrant académique"
        breadcrumbs={[
          { label: 'Tableau de bord', path: '/enseignant/dashboard' },
          { label: 'Stages encadrés' },
        ]}
      />

      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      )}

      {error && <Alert variant="warning">{error}</Alert>}

      {!loading && !error && (
        <DataCard title={`${stages.length} stage(s) encadré(s)`}>
          {stages.length === 0 ? (
            <p className="text-muted mb-0 text-center py-4">Aucun stage encadré pour le moment.</p>
          ) : (
            <Table responsive hover className="data-table mb-0">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Thème</th>
                  <th>Entreprise</th>
                  <th>Étudiant</th>
                  <th>Période</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {stages.map((stage) => (
                  <tr key={stage.id}>
                    <td className="fw-medium">{stage.code}</td>
                    <td>{stage.theme}</td>
                    <td>{stage.entreprise_nom}</td>
                    <td>{formatEtudiantStage(stage)}</td>
                    <td>
                      {stage.date_debut} → {stage.date_fin}
                    </td>
                    <td>
                      <Badge bg={statutVariant(stage.statut)}>{stage.statut}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </DataCard>
      )}
    </div>
  );
};

export default TeacherStagesPage;
