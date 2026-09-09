import React, { useEffect, useState } from 'react';
import { Alert, Spinner } from 'react-bootstrap';
import { PageHeader } from '../../components/layouts';
import MonEmploiTemps from '../../components/emploiTemps/MonEmploiTemps';
import portalService from '../../services/portalService';

const StudentEmploiTempsPage: React.FC = () => {
  const [niveauId, setNiveauId] = useState<number | undefined>();
  const [filiereId, setFiliereId] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const profil = await portalService.getMesProfil();
        if (profil.inscription_active) {
          setNiveauId(profil.inscription_active.niveau_id);
          setFiliereId(profil.inscription_active.filiere_id);
        } else {
          setError('Aucune inscription active - emploi du temps indisponible.');
        }
      } catch (err: unknown) {
        const message =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
            : null;
        setError(typeof message === 'string' ? message : 'Impossible de charger votre emploi du temps.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="fade-in">
      <PageHeader
        title="Mon emploi du temps"
        subtitle="Planning hebdomadaire de vos cours"
        breadcrumbs={[
          { label: 'Tableau de bord', path: '/etudiant/dashboard' },
          { label: 'Emploi du temps' },
        ]}
      />

      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      )}

      {error && <Alert variant="warning">{error}</Alert>}

      {!loading && !error && niveauId && (
        <MonEmploiTemps userRole="etudiant" niveauId={niveauId} filiereId={filiereId} />
      )}
    </div>
  );
};

export default StudentEmploiTempsPage;
