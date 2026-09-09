import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Form, Spinner, Table } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/layouts';
import { DataCard } from '../../components/ui';
import portalService, { type EnseignementScope, type TeacherEtudiant } from '../../services/portalService';

const formatEtudiant = (e: TeacherEtudiant) => {
  const name = [e.prenom, e.nom].filter(Boolean).join(' ');
  return name || `Étudiant #${e.etudiant_id}`;
};

const TeacherEtudiantsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [scope, setScope] = useState<EnseignementScope[]>([]);
  const [etudiants, setEtudiants] = useState<TeacherEtudiant[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEtudiants, setLoadingEtudiants] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedScopeKey = searchParams.get('scope') ?? '';
  const matiereParam = searchParams.get('matiere');
  const niveauParam = searchParams.get('niveau');

  const initialScopeKey = useMemo(() => {
    if (matiereParam && niveauParam) {
      return `${matiereParam}-${niveauParam}`;
    }
    return '';
  }, [matiereParam, niveauParam]);

  useEffect(() => {
    const loadScope = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await portalService.getMesMatieresEnseignement();
        setScope(data);
      } catch {
        setError('Impossible de charger le périmètre enseignement.');
      } finally {
        setLoading(false);
      }
    };
    loadScope();
  }, []);

  const effectiveScopeKey = selectedScopeKey || initialScopeKey;

  const selectedScope = useMemo(() => {
    if (!effectiveScopeKey) return null;
    const [matiereId, niveauId] = effectiveScopeKey.split('-').map(Number);
    return scope.find((s) => s.matiere_id === matiereId && s.niveau_id === niveauId) ?? null;
  }, [scope, effectiveScopeKey]);

  const loadEtudiants = useCallback(async () => {
    setLoadingEtudiants(true);
    setError(null);
    try {
      const params =
        selectedScope != null
          ? { matiere_id: selectedScope.matiere_id, niveau_id: selectedScope.niveau_id }
          : undefined;
      const data = await portalService.getMesEtudiants(params);
      setEtudiants(data);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : null;
      setError(typeof message === 'string' ? message : 'Impossible de charger vos étudiants.');
      setEtudiants([]);
    } finally {
      setLoadingEtudiants(false);
    }
  }, [selectedScope]);

  useEffect(() => {
    if (!loading) {
      loadEtudiants();
    }
  }, [loading, loadEtudiants]);

  const handleScopeChange = (value: string) => {
    if (value) {
      setSearchParams({ scope: value });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Mes étudiants"
        subtitle="Étudiants inscrits à vos matières"
        breadcrumbs={[
          { label: 'Tableau de bord', path: '/enseignant/dashboard' },
          { label: 'Mes étudiants' },
        ]}
      />

      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      )}

      {error && <Alert variant="warning">{error}</Alert>}

      {!loading && (
        <DataCard title={`${etudiants.length} étudiant(s)`}>
          <Form.Group className="mb-4">
            <Form.Label>Filtrer par cours</Form.Label>
            <Form.Select
              value={effectiveScopeKey}
              onChange={(e) => handleScopeChange(e.target.value)}
            >
              <option value="">Tous mes cours</option>
              {scope.map((row) => {
                const key = `${row.matiere_id}-${row.niveau_id}`;
                const label = [
                  row.matiere_libelle || row.matiere_code,
                  row.niveau_libelle || row.niveau_code,
                ]
                  .filter(Boolean)
                  .join(' - ');
                return (
                  <option key={key} value={key}>
                    {label || key}
                  </option>
                );
              })}
            </Form.Select>
          </Form.Group>

          {loadingEtudiants ? (
            <div className="text-center py-4">
              <Spinner animation="border" size="sm" variant="primary" />
            </div>
          ) : etudiants.length === 0 ? (
            <p className="text-muted mb-0 text-center py-4">Aucun étudiant trouvé.</p>
          ) : (
            <Table responsive hover className="data-table mb-0">
              <thead>
                <tr>
                  <th>Matricule</th>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Niveau</th>
                  <th>Matières</th>
                </tr>
              </thead>
              <tbody>
                {etudiants.map((etu) => (
                  <tr key={etu.etudiant_id}>
                    <td className="fw-medium">{etu.matricule || '-'}</td>
                    <td>{formatEtudiant(etu)}</td>
                    <td>{etu.email || '-'}</td>
                    <td>{etu.niveau_libelle || `#${etu.niveau_id}`}</td>
                    <td>
                      {etu.matieres.map((m) => (
                        <Badge key={m.matiere_id} bg="light" text="dark" className="me-1 mb-1">
                          {m.matiere_libelle || m.matiere_code || `#${m.matiere_id}`}
                        </Badge>
                      ))}
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

export default TeacherEtudiantsPage;
