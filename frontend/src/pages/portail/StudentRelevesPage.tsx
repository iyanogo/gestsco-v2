import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Form, Spinner, Table } from 'react-bootstrap';
import { PageHeader } from '../../components/layouts';
import { DataCard } from '../../components/ui';
import portalService from '../../services/portalService';
import bulletinService from '../../services/bulletinService';
import { sessionExamenService } from '../../services/sessionExamenService';
import type { ReleveNotes, SessionExamen } from '../../types/evaluation';

const formatNote = (value?: number | null) =>
  value != null ? Number(value).toFixed(2) : '-';

const StudentRelevesPage: React.FC = () => {
  const [etudiantId, setEtudiantId] = useState<number | null>(null);
  const [sessions, setSessions] = useState<SessionExamen[]>([]);
  const [selectedAnneeId, setSelectedAnneeId] = useState('');
  const [releve, setReleve] = useState<ReleveNotes | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingReleve, setLoadingReleve] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const anneesOptions = useMemo(() => {
    const seen = new Map<number, string>();
    sessions.forEach((s) => {
      if (s.annee_academique_id) {
        seen.set(s.annee_academique_id, s.libelle || s.code || `Année #${s.annee_academique_id}`);
      }
    });
    return Array.from(seen.entries()).map(([id, label]) => ({ id, label }));
  }, [sessions]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [profil, sessionData] = await Promise.all([
          portalService.getMesProfil(),
          sessionExamenService.getSessions({ limit: 100 }),
        ]);
        setEtudiantId(profil.etudiant.id);
        setSessions(sessionData);
        const firstAnnee = sessionData.find((s) => s.annee_academique_id)?.annee_academique_id;
        if (firstAnnee) setSelectedAnneeId(String(firstAnnee));
      } catch {
        setError('Impossible de charger les données de référence.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const loadReleve = useCallback(async () => {
    if (!etudiantId) return;
    setLoadingReleve(true);
    setError(null);
    try {
      const anneeId = selectedAnneeId ? Number(selectedAnneeId) : undefined;
      const data = await bulletinService.getReleveNotes(etudiantId, anneeId);
      setReleve(data);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : null;
      setError(typeof message === 'string' ? message : 'Impossible de charger votre relevé de notes.');
      setReleve(null);
    } finally {
      setLoadingReleve(false);
    }
  }, [etudiantId, selectedAnneeId]);

  useEffect(() => {
    if (!loading && etudiantId) {
      loadReleve();
    }
  }, [loading, etudiantId, loadReleve]);

  return (
    <div className="fade-in">
      <PageHeader
        title="Relevés de notes"
        subtitle="Historique complet de vos résultats par année académique"
        breadcrumbs={[
          { label: 'Tableau de bord', path: '/etudiant/dashboard' },
          { label: 'Relevés de notes' },
        ]}
      />

      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      )}

      {error && <Alert variant="warning">{error}</Alert>}

      {!loading && (
        <DataCard title="Relevé de notes">
          {anneesOptions.length > 0 && (
            <Form.Group className="mb-4">
              <Form.Label>Filtrer par année académique</Form.Label>
              <Form.Select
                value={selectedAnneeId}
                onChange={(e) => setSelectedAnneeId(e.target.value)}
              >
                <option value="">Toutes les années</option>
                {anneesOptions.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          )}

          {loadingReleve ? (
            <div className="text-center py-4">
              <Spinner animation="border" size="sm" variant="primary" />
            </div>
          ) : releve ? (
            <>
              <div className="d-flex flex-wrap gap-3 mb-4">
                <Badge bg="light" text="dark" className="px-3 py-2">
                  {releve.etudiant.prenom} {releve.etudiant.nom}
                </Badge>
                <Badge bg="primary" className="px-3 py-2">
                  {releve.etudiant.matricule}
                </Badge>
                <Badge bg="success" className="px-3 py-2">
                  Total crédits : {releve.total_credits_obtenus}
                </Badge>
              </div>

              {releve.parcours.length === 0 ? (
                <p className="text-muted mb-0 text-center py-4">Aucun parcours enregistré.</p>
              ) : (
                releve.parcours.map((parcours) => (
                  <div key={parcours.inscription_id} className="mb-4">
                    <h6 className="mb-3">
                      Année {parcours.annee_academique} - Niveau {parcours.niveau_id}
                    </h6>

                    {parcours.semestres.length > 0 && (
                      <div className="d-flex flex-wrap gap-2 mb-3">
                        {parcours.semestres.map((s) => (
                          <Badge key={s.semestre} bg="light" text="dark">
                            S{s.semestre} : {formatNote(s.moyenne)}/20 - {s.decision}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <Table responsive hover className="data-table mb-0">
                      <thead>
                        <tr>
                          <th>Matière</th>
                          <th>Crédit</th>
                          <th>Moyenne</th>
                          <th>Crédit obtenu</th>
                          <th>Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parcours.matieres.map((m, idx) => (
                          <tr key={`${m.code ?? m.libelle ?? idx}`}>
                            <td>{m.libelle || m.code || '-'}</td>
                            <td>{m.credit}</td>
                            <td>{formatNote(m.moyenne)}</td>
                            <td>{m.credit_obtenu}</td>
                            <td>{m.statut}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>

                    {parcours.resultat_annuel && (
                      <div className="mt-3 p-3 bg-light rounded">
                        <strong>Résultat annuel : </strong>
                        {formatNote(parcours.resultat_annuel.moyenne)}/20 -{' '}
                        {parcours.resultat_annuel.decision}
                        {parcours.resultat_annuel.mention && (
                          <Badge bg="secondary" className="ms-2">
                            {parcours.resultat_annuel.mention}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </>
          ) : (
            <p className="text-muted mb-0 text-center py-4">Aucun relevé disponible.</p>
          )}
        </DataCard>
      )}
    </div>
  );
};

export default StudentRelevesPage;
