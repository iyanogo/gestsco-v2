import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Col, Form, Nav, Row, Spinner, Tab, Table } from 'react-bootstrap';
import { PageHeader } from '../../components/layouts';
import { DataCard } from '../../components/ui';
import portalService from '../../services/portalService';
import bulletinService from '../../services/bulletinService';
import { sessionExamenService } from '../../services/sessionExamenService';
import type { BulletinAnnuel, BulletinSemestre, SessionExamen } from '../../types/evaluation';

const formatNote = (value?: number | null) =>
  value != null ? Number(value).toFixed(2) : '-';

const StudentBulletinsPage: React.FC = () => {
  const [etudiantId, setEtudiantId] = useState<number | null>(null);
  const [sessions, setSessions] = useState<SessionExamen[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [selectedAnneeId, setSelectedAnneeId] = useState('');
  const [activeTab, setActiveTab] = useState<'semestre' | 'annuel'>('semestre');
  const [bulletinSemestre, setBulletinSemestre] = useState<BulletinSemestre | null>(null);
  const [bulletinAnnuel, setBulletinAnnuel] = useState<BulletinAnnuel | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingBulletin, setLoadingBulletin] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSession = useMemo(
    () => sessions.find((s) => s.id === Number(selectedSessionId)) ?? null,
    [sessions, selectedSessionId],
  );

  const anneesOptions = useMemo(() => {
    const seen = new Map<number, SessionExamen>();
    sessions.forEach((s) => {
      if (s.annee_academique_id && !seen.has(s.annee_academique_id)) {
        seen.set(s.annee_academique_id, s);
      }
    });
    return Array.from(seen.entries()).map(([anneeId, session]) => ({
      anneeId,
      label: session.libelle || session.code || `Année #${anneeId}`,
    }));
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
        if (sessionData.length > 0) {
          setSelectedSessionId(String(sessionData[0].id));
          const firstAnnee = sessionData.find((s) => s.annee_academique_id)?.annee_academique_id;
          if (firstAnnee) setSelectedAnneeId(String(firstAnnee));
        }
      } catch {
        setError('Impossible de charger les données de référence.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const loadBulletinSemestre = useCallback(async () => {
    if (!etudiantId || !selectedSession) return;
    setLoadingBulletin(true);
    setError(null);
    try {
      const data = await bulletinService.getBulletinSemestre(
        etudiantId,
        selectedSession.id,
        selectedSession.semestre,
      );
      setBulletinSemestre(data);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : null;
      setError(typeof message === 'string' ? message : 'Impossible de générer le bulletin semestriel.');
      setBulletinSemestre(null);
    } finally {
      setLoadingBulletin(false);
    }
  }, [etudiantId, selectedSession]);

  const loadBulletinAnnuel = useCallback(async () => {
    if (!etudiantId || !selectedAnneeId) return;
    setLoadingBulletin(true);
    setError(null);
    try {
      const data = await bulletinService.getBulletinAnnuel(etudiantId, Number(selectedAnneeId));
      setBulletinAnnuel(data);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : null;
      setError(typeof message === 'string' ? message : 'Impossible de générer le bulletin annuel.');
      setBulletinAnnuel(null);
    } finally {
      setLoadingBulletin(false);
    }
  }, [etudiantId, selectedAnneeId]);

  useEffect(() => {
    if (loading || !etudiantId) return;
    if (activeTab === 'semestre' && selectedSession) {
      loadBulletinSemestre();
    } else if (activeTab === 'annuel' && selectedAnneeId) {
      loadBulletinAnnuel();
    }
  }, [loading, etudiantId, activeTab, selectedSession, selectedAnneeId, loadBulletinSemestre, loadBulletinAnnuel]);

  const handleDownloadSemestre = async () => {
    if (!etudiantId || !selectedSession) return;
    try {
      setDownloading(true);
      const blob = await bulletinService.downloadBulletinSemestre(
        etudiantId,
        selectedSession.id,
        selectedSession.semestre,
      );
      bulletinService.downloadBlob(
        blob,
        `bulletin_S${selectedSession.semestre}_${bulletinSemestre?.etudiant.matricule ?? etudiantId}.pdf`,
      );
    } catch {
      setError('Impossible de télécharger le PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadAnnuel = async () => {
    if (!etudiantId || !selectedAnneeId) return;
    try {
      setDownloading(true);
      const blob = await bulletinService.downloadBulletinAnnuel(etudiantId, Number(selectedAnneeId));
      bulletinService.downloadBlob(
        blob,
        `bulletin_annuel_${bulletinAnnuel?.etudiant.matricule ?? etudiantId}.pdf`,
      );
    } catch {
      setError('Impossible de télécharger le PDF.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Mes bulletins"
        subtitle="Consultation et téléchargement de vos bulletins officiels"
        breadcrumbs={[
          { label: 'Tableau de bord', path: '/etudiant/dashboard' },
          { label: 'Mes bulletins' },
        ]}
      />

      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      )}

      {error && <Alert variant="warning">{error}</Alert>}

      {!loading && (
        <Tab.Container activeKey={activeTab} onSelect={(k) => k && setActiveTab(k as 'semestre' | 'annuel')}>
          <Nav variant="tabs" className="mb-4">
            <Nav.Item>
              <Nav.Link eventKey="semestre">Bulletin semestriel</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="annuel">Bulletin annuel</Nav.Link>
            </Nav.Item>
          </Nav>

          <Tab.Content>
            <Tab.Pane eventKey="semestre">
              <DataCard title="Bulletin semestriel">
                <Row className="g-3 mb-4">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Session d'examen</Form.Label>
                      <Form.Select
                        value={selectedSessionId}
                        onChange={(e) => setSelectedSessionId(e.target.value)}
                      >
                        {sessions.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.libelle || s.code} - S{s.semestre}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6} className="d-flex align-items-end">
                    <Button
                      variant="outline-primary"
                      onClick={handleDownloadSemestre}
                      disabled={downloading || !bulletinSemestre}
                    >
                      {downloading ? (
                        <Spinner animation="border" size="sm" className="me-2" />
                      ) : (
                        <i className="bi bi-download me-2"></i>
                      )}
                      Télécharger PDF
                    </Button>
                  </Col>
                </Row>

                {loadingBulletin ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" size="sm" variant="primary" />
                  </div>
                ) : bulletinSemestre ? (
                  <>
                    {bulletinSemestre.resultat && (
                      <Row className="g-3 mb-4">
                        <Col sm={4}>
                          <div className="text-muted small">Moyenne générale</div>
                          <div className="fs-4 fw-bold text-primary">
                            {formatNote(bulletinSemestre.resultat.moyenne_generale)}/20
                          </div>
                        </Col>
                        <Col sm={4}>
                          <div className="text-muted small">Crédits</div>
                          <div className="fs-5 fw-medium">
                            {bulletinSemestre.resultat.total_credits_obtenus}/
                            {bulletinSemestre.resultat.total_credits_inscrits}
                          </div>
                        </Col>
                        <Col sm={4}>
                          <div className="text-muted small">Décision</div>
                          <Badge bg="secondary" className="mt-1">
                            {bulletinSemestre.resultat.decision}
                          </Badge>
                        </Col>
                      </Row>
                    )}
                    <Table responsive hover className="data-table mb-0">
                      <thead>
                        <tr>
                          <th>Matière</th>
                          <th>CC</th>
                          <th>TP</th>
                          <th>Examen</th>
                          <th>Moyenne</th>
                          <th>Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulletinSemestre.matieres.map((m) => (
                          <tr key={m.id ?? m.matiere_id}>
                            <td>
                              {(m as { libelle?: string; code?: string }).libelle ||
                                (m as { code?: string }).code ||
                                `#${m.matiere_id}`}
                            </td>
                            <td>{formatNote(m.note_cc)}</td>
                            <td>{formatNote(m.note_tp)}</td>
                            <td>{formatNote(m.note_examen)}</td>
                            <td>{formatNote(m.moyenne_matiere)}</td>
                            <td>{m.statut ?? '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </>
                ) : (
                  <p className="text-muted mb-0 text-center py-4">Aucun bulletin disponible.</p>
                )}
              </DataCard>
            </Tab.Pane>

            <Tab.Pane eventKey="annuel">
              <DataCard title="Bulletin annuel">
                <Row className="g-3 mb-4">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Année académique</Form.Label>
                      <Form.Select
                        value={selectedAnneeId}
                        onChange={(e) => setSelectedAnneeId(e.target.value)}
                      >
                        {anneesOptions.map((a) => (
                          <option key={a.anneeId} value={a.anneeId}>
                            {a.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6} className="d-flex align-items-end">
                    <Button
                      variant="outline-primary"
                      onClick={handleDownloadAnnuel}
                      disabled={downloading || !bulletinAnnuel}
                    >
                      {downloading ? (
                        <Spinner animation="border" size="sm" className="me-2" />
                      ) : (
                        <i className="bi bi-download me-2"></i>
                      )}
                      Télécharger PDF
                    </Button>
                  </Col>
                </Row>

                {loadingBulletin ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" size="sm" variant="primary" />
                  </div>
                ) : bulletinAnnuel ? (
                  <>
                    {bulletinAnnuel.resultat && (
                      <Row className="g-3 mb-4">
                        <Col sm={4}>
                          <div className="text-muted small">Moyenne annuelle</div>
                          <div className="fs-4 fw-bold text-primary">
                            {formatNote(bulletinAnnuel.resultat.moyenne_annuelle)}/20
                          </div>
                        </Col>
                        <Col sm={4}>
                          <div className="text-muted small">Crédits obtenus</div>
                          <div className="fs-5 fw-medium">
                            {bulletinAnnuel.resultat.total_credits_obtenus}
                          </div>
                        </Col>
                        <Col sm={4}>
                          <div className="text-muted small">Décision</div>
                          <Badge bg="secondary" className="mt-1">
                            {bulletinAnnuel.resultat.decision}
                          </Badge>
                        </Col>
                      </Row>
                    )}
                    <Table responsive hover className="data-table mb-0">
                      <thead>
                        <tr>
                          <th>Semestre</th>
                          <th>Moyenne</th>
                          <th>Crédits</th>
                          <th>Mention</th>
                          <th>Décision</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulletinAnnuel.semestres.map((s) => (
                          <tr key={s.semestre}>
                            <td>S{s.semestre}</td>
                            <td>{formatNote(s.moyenne_generale)}</td>
                            <td>
                              {s.total_credits_obtenus}/{s.total_credits_inscrits}
                            </td>
                            <td>{s.mention ?? '-'}</td>
                            <td>{s.decision}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </>
                ) : (
                  <p className="text-muted mb-0 text-center py-4">Aucun bulletin annuel disponible.</p>
                )}
              </DataCard>
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      )}
    </div>
  );
};

export default StudentBulletinsPage;
