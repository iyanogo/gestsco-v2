import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Row, Col, Button, Badge, Form, Card, Table, Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { AxiosError } from 'axios';
import { PageHeader } from '../../../components/layouts';
import { DataCard } from '../../../components/ui';
import { usePermissions } from '../../../hooks/usePermissions';
import { noteService } from '../../../services/noteService';
import { examenService } from '../../../services/examenService';
import { sessionExamenService } from '../../../services/sessionExamenService';
import { getInscriptions, getMatieresByInscription } from '../../../services/inscriptionService';
import { getEtudiants } from '../../../services/etudiantService';
import { getMatieres } from '../../../services/matiereService';
import { getFilieres } from '../../../services/filiereService';
import { getNiveaux } from '../../../services/niveauService';
import { handleApiError } from '../../../utils/errorHandler';
import portalService, { EnseignementScope } from '../../../services/portalService';
import type { Examen, SessionExamen, NoteWithEtudiant, TypeEvaluation } from '../../../types/evaluation';
import type { Etudiant } from '../../../types/etudiant';
import type { Filiere, Matiere, Niveau } from '../../../types/reference';

type TypeEvaluationBackend = Extract<
  TypeEvaluation,
  'controle_continu' | 'examen_partiel' | 'examen_final' | 'tp' | 'projet'
>;

interface EtudiantNoteRow {
  etudiantId: number;
  inscriptionMatiereId: number;
  matricule: string;
  nom: string;
  prenom: string;
  noteId?: number;
  note?: number;
  absent: boolean;
  isValide: boolean;
}

const TYPE_EVAL_OPTIONS: { value: TypeEvaluationBackend; label: string }[] = [
  { value: 'controle_continu', label: 'Contrôle continu' },
  { value: 'tp', label: 'TP' },
  { value: 'examen_final', label: 'Examen final' },
  { value: 'examen_partiel', label: 'Examen partiel' },
  { value: 'projet', label: 'Projet' },
];

const extractErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail.map((item: { msg?: string }) => item.msg).filter(Boolean).join(', ');
    }
  }
  return handleApiError(error);
};

type PortalMode = 'admin' | 'teacher';

interface SaisieNotesPageProps {
  portalMode?: PortalMode;
}

const scopeToMatieres = (scope: EnseignementScope[]): Matiere[] => {
  const map = new Map<number, Matiere>();
  scope.forEach((row) => {
    if (!map.has(row.matiere_id)) {
      map.set(row.matiere_id, {
        id: row.matiere_id,
        code: row.matiere_code || `MAT-${row.matiere_id}`,
        libelle: row.matiere_libelle || `Matière ${row.matiere_id}`,
      } as Matiere);
    }
  });
  return Array.from(map.values());
};

const scopeToNiveaux = (scope: EnseignementScope[], matiereId?: number): Niveau[] => {
  const map = new Map<number, Niveau>();
  scope
    .filter((row) => !matiereId || row.matiere_id === matiereId)
    .forEach((row) => {
      if (!map.has(row.niveau_id)) {
        map.set(row.niveau_id, {
          id: row.niveau_id,
          code: row.niveau_code || `NIV-${row.niveau_id}`,
          libelle: row.niveau_libelle || `Niveau ${row.niveau_id}`,
        } as Niveau);
      }
    });
  return Array.from(map.values());
};

const scopeToFilieres = (
  scope: EnseignementScope[],
  matiereId?: number,
  niveauId?: number,
): Filiere[] => {
  const map = new Map<number, Filiere>();
  scope
    .filter(
      (row) =>
        (!matiereId || row.matiere_id === matiereId) &&
        (!niveauId || row.niveau_id === niveauId) &&
        row.filiere_id != null,
    )
    .forEach((row) => {
      if (row.filiere_id != null && !map.has(row.filiere_id)) {
        map.set(row.filiere_id, {
          id: row.filiere_id,
          code: row.filiere_code || `FIL-${row.filiere_id}`,
          libelle: row.filiere_libelle || `Filière ${row.filiere_id}`,
        } as Filiere);
      }
    });
  return Array.from(map.values());
};

const SaisieNotesPage: React.FC<SaisieNotesPageProps> = ({ portalMode = 'admin' }) => {
  const { canPerform } = usePermissions();
  const canSaveNotes =
    portalMode === 'teacher' || canPerform('evaluations_notes', 'update');
  const [sessions, setSessions] = useState<SessionExamen[]>([]);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [enseignementScope, setEnseignementScope] = useState<EnseignementScope[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [selectedFiliereId, setSelectedFiliereId] = useState('');
  const [selectedNiveauId, setSelectedNiveauId] = useState('');
  const [selectedMatiereId, setSelectedMatiereId] = useState('');
  const [selectedTypeEval, setSelectedTypeEval] = useState<TypeEvaluationBackend>('examen_final');
  const [examen, setExamen] = useState<Examen | null>(null);
  const [etudiants, setEtudiants] = useState<EtudiantNoteRow[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [loadingRows, setLoadingRows] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedSession = useMemo(
    () => sessions.find((s) => s.id === parseInt(selectedSessionId, 10)),
    [sessions, selectedSessionId],
  );

  const saisieAllowed = selectedSession?.statut === 'en_cours';

  useEffect(() => {
    const loadRefs = async () => {
      try {
        const sessionData = await sessionExamenService.getSessions({ limit: 100 });
        setSessions(sessionData);

        if (portalMode === 'teacher') {
          const scope = await portalService.getMesMatieresEnseignement();
          setEnseignementScope(scope);
          setMatieres(scopeToMatieres(scope));
          setFilieres(scopeToFilieres(scope));
          setNiveaux(scopeToNiveaux(scope));
        } else {
          const [filiereData, niveauData, matiereData] = await Promise.all([
            getFilieres(),
            getNiveaux(),
            getMatieres({ limit: 500 }),
          ]);
          setFilieres(filiereData);
          setNiveaux(niveauData);
          setMatieres(matiereData);
        }
      } catch (err) {
        setError(extractErrorMessage(err));
      } finally {
        setLoadingRefs(false);
      }
    };
    loadRefs();
  }, [portalMode]);

  useEffect(() => {
    if (portalMode !== 'teacher') return;
    const matId = selectedMatiereId ? parseInt(selectedMatiereId, 10) : undefined;
    const nivId = selectedNiveauId ? parseInt(selectedNiveauId, 10) : undefined;
    setNiveaux(scopeToNiveaux(enseignementScope, matId));
    setFilieres(scopeToFilieres(enseignementScope, matId, nivId));
  }, [portalMode, enseignementScope, selectedMatiereId, selectedNiveauId]);

  const filtersComplete =
    selectedSessionId && selectedFiliereId && selectedNiveauId && selectedMatiereId && selectedTypeEval;

  const loadGrid = useCallback(async () => {
    if (!filtersComplete || !selectedSession) return;

    setLoadingRows(true);
    setError(null);
    setSuccess(null);

    const sessionId = parseInt(selectedSessionId, 10);
    const filiereId = parseInt(selectedFiliereId, 10);
    const niveauId = parseInt(selectedNiveauId, 10);
    const matiereId = parseInt(selectedMatiereId, 10);

    try {
      let examenCourant: Examen | null = null;
      try {
        examenCourant = await examenService.getExamenMatch({
          session_id: sessionId,
          matiere_id: matiereId,
          niveau_id: niveauId,
          type_evaluation: selectedTypeEval,
        });
      } catch {
        examenCourant = null;
      }

      if (!examenCourant) {
        const payload = {
          session_id: sessionId,
          matiere_id: matiereId,
          niveau_id: niveauId,
          type_evaluation: selectedTypeEval,
        };
        examenCourant =
          portalMode === 'teacher'
            ? await examenService.createExamenEnseignant(payload)
            : await examenService.createExamen(payload);
      }
      setExamen(examenCourant);

      const [inscriptionData, etudiantData] = await Promise.all([
        getInscriptions({ filiere_id: filiereId, niveau_id: niveauId, limit: 500 }),
        getEtudiants({ limit: 500 }),
      ]);

      const etudiantMap = new Map<number, Etudiant>(etudiantData.map((e) => [e.id, e]));
      const semestre = selectedSession.semestre;

      const enrolledRows: EtudiantNoteRow[] = [];
      await Promise.all(
        inscriptionData.map(async (inscription) => {
          const matieresInscrites = await getMatieresByInscription(inscription.id, semestre);
          const im = matieresInscrites.find((m) => m.matiere_id === matiereId);
          if (!im) return;

          const etudiant = etudiantMap.get(inscription.etudiant_id);
          enrolledRows.push({
            etudiantId: inscription.etudiant_id,
            inscriptionMatiereId: im.id,
            matricule: etudiant?.matricule || '-',
            nom: etudiant?.nom || '-',
            prenom: etudiant?.prenom || '-',
            absent: false,
            isValide: false,
          });
        }),
      );

      enrolledRows.sort((a, b) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`));

      const notesExistantes: NoteWithEtudiant[] = await noteService.getNotesByExamen(examenCourant.id);
      const notesByEtudiant = new Map<number, NoteWithEtudiant>(
        notesExistantes.map((n) => [n.etudiant_id, n]),
      );

      const merged = enrolledRows.map((row) => {
        const existing = notesByEtudiant.get(row.etudiantId);
        if (!existing) return row;
        return {
          ...row,
          noteId: existing.id,
          note: existing.note ?? undefined,
          absent: existing.statut_presence === 'absent' || existing.statut_presence === 'absent_justifie',
          isValide: existing.is_valide,
        };
      });

      setEtudiants(merged);
    } catch (err) {
      setError(extractErrorMessage(err));
      setEtudiants([]);
      setExamen(null);
    } finally {
      setLoadingRows(false);
    }
  }, [filtersComplete, selectedSession, selectedSessionId, selectedFiliereId, selectedNiveauId, selectedMatiereId, selectedTypeEval, portalMode]);

  useEffect(() => {
    loadGrid();
  }, [loadGrid]);

  const handleNoteChange = (etudiantId: number, value: string) => {
    const parsed = value === '' ? undefined : parseFloat(value);
    if (parsed !== undefined && (parsed < 0 || parsed > 20)) return;
    setEtudiants((prev) =>
      prev.map((e) =>
        e.etudiantId === etudiantId ? { ...e, note: parsed, absent: false } : e,
      ),
    );
    setSuccess(null);
  };

  const handleAbsentChange = (etudiantId: number, absent: boolean) => {
    setEtudiants((prev) =>
      prev.map((e) =>
        e.etudiantId === etudiantId ? { ...e, absent, note: absent ? undefined : e.note } : e,
      ),
    );
    setSuccess(null);
  };

  const handleSave = async () => {
    if (!examen || !saisieAllowed) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const toCreate = etudiants.filter((e) => !e.noteId && !e.isValide);
      const toUpdate = etudiants.filter((e) => e.noteId && !e.isValide);

      for (const row of toUpdate) {
        await noteService.updateNote(row.noteId!, {
          note: row.absent ? undefined : row.note,
          statut_presence: row.absent ? 'absent' : 'present',
        });
      }

      const newNotes = toCreate
        .filter((row) => row.note !== undefined || row.absent)
        .map((row) => ({
          etudiant_id: row.etudiantId,
          inscription_matiere_id: row.inscriptionMatiereId,
          note: row.absent ? undefined : row.note,
          statut_presence: row.absent ? ('absent' as const) : ('present' as const),
        }));

      if (newNotes.length > 0) {
        await noteService.createNotesBulk({ examen_id: examen.id, notes: newNotes });
      }

      setSuccess(`${toUpdate.length + newNotes.length} note(s) enregistrée(s). Les moyennes officielles seront calculées après validation et délibération.`);
      await loadGrid();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const stats = useMemo(() => {
    const notesValides = etudiants.filter((e) => e.note !== undefined && !e.absent);
    const absents = etudiants.filter((e) => e.absent).length;
    const moyenne =
      notesValides.length > 0
        ? notesValides.reduce((sum, e) => sum + (e.note || 0), 0) / notesValides.length
        : 0;
    return { notesValides: notesValides.length, absents, moyenne };
  }, [etudiants]);

  if (loadingRefs) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="fade-in">
      <PageHeader
        title={portalMode === 'teacher' ? 'Saisie des notes' : 'Saisie des notes'}
        subtitle={
          portalMode === 'teacher'
            ? 'Enregistrement des notes pour vos matières enseignées'
            : "Enregistrement des notes d'évaluation (par examen / session)"
        }
        breadcrumbs={
          portalMode === 'teacher'
            ? [
                { label: 'Tableau de bord', path: '/enseignant/dashboard' },
                { label: 'Saisie des notes' },
              ]
            : [
                { label: 'Évaluations', path: '/admin/evaluations/notes' },
                { label: 'Saisie des notes' },
              ]
        }
      />

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Alert variant="info" className="mb-4">
        Moyenne affichée = <strong>indicative</strong> (notes de cet examen uniquement).
        Les moyennes matière, compensation et décisions LMD sont calculées côté backend via{' '}
        <code>/api/v1/resultats/calculer/*</code> après validation des notes - pas recalculées ici.
      </Alert>

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={3}>
              <Form.Group>
                <Form.Label>Session *</Form.Label>
                <Form.Select value={selectedSessionId} onChange={(e) => setSelectedSessionId(e.target.value)}>
                  <option value="">Sélectionner...</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.libelle} ({s.type_session}, S{s.semestre}) - {s.statut}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Filière *</Form.Label>
                <Form.Select value={selectedFiliereId} onChange={(e) => setSelectedFiliereId(e.target.value)}>
                  <option value="">-</option>
                  {filieres.map((f) => (
                    <option key={f.id} value={f.id}>{f.libelle || f.code}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Niveau *</Form.Label>
                <Form.Select value={selectedNiveauId} onChange={(e) => setSelectedNiveauId(e.target.value)}>
                  <option value="">-</option>
                  {niveaux.map((n) => (
                    <option key={n.id} value={n.id}>{n.libelle || n.code}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Matière *</Form.Label>
                <Form.Select value={selectedMatiereId} onChange={(e) => setSelectedMatiereId(e.target.value)}>
                  <option value="">-</option>
                  {matieres.map((m) => (
                    <option key={m.id} value={m.id}>{m.libelle || m.code}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Type *</Form.Label>
                <Form.Select
                  value={selectedTypeEval}
                  onChange={(e) => setSelectedTypeEval(e.target.value as TypeEvaluationBackend)}
                >
                  {TYPE_EVAL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {selectedSession && !saisieAllowed && (
        <Alert variant="warning">
          La session <strong>{selectedSession.libelle}</strong> n&apos;est pas <code>en_cours</code> (statut : {selectedSession.statut}).
          {portalMode === 'admin' ? (
            <>
              {' '}
              Ouvrez-la depuis <Link to="/admin/evaluations/sessions">Sessions d&apos;examen</Link> avant de saisir.
            </>
          ) : (
            ' Contactez la scolarité pour ouvrir la session.'
          )}
        </Alert>
      )}

      {filtersComplete && (
        <>
          <Row className="g-3 mb-4">
            <Col sm={6} md={3}>
              <div className="bg-white rounded p-3 border text-center">
                <div className="fs-4 fw-bold text-primary">{etudiants.length}</div>
                <small className="text-muted">Inscrits à la matière</small>
              </div>
            </Col>
            <Col sm={6} md={3}>
              <div className="bg-white rounded p-3 border text-center">
                <div className="fs-4 fw-bold text-success">{stats.notesValides}</div>
                <small className="text-muted">Notes saisies</small>
              </div>
            </Col>
            <Col sm={6} md={3}>
              <div className="bg-white rounded p-3 border text-center">
                <div className="fs-4 fw-bold text-info">{stats.moyenne.toFixed(2)}/20</div>
                <small className="text-muted">Moyenne indicative</small>
              </div>
            </Col>
            <Col sm={6} md={3}>
              <div className="bg-white rounded p-3 border text-center">
                <div className="fs-4 fw-bold text-warning">{stats.absents}</div>
                <small className="text-muted">Absents</small>
              </div>
            </Col>
          </Row>

          {examen && (
            <p className="text-muted small mb-3">
              Examen #{examen.id} - statut {examen.statut}
              {etudiants.length === 0 && ' - aucun étudiant inscrit à cette matière pour ce semestre (voir Inscriptions matières).'}
            </p>
          )}

          <DataCard
            title="Grille de saisie"
            actions={
              <div className="d-flex gap-2">
                <Button variant="outline-secondary" onClick={loadGrid} disabled={loadingRows}>
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Actualiser
                </Button>
                {canSaveNotes && (
                  <Button variant="success" onClick={handleSave} disabled={saving || loadingRows || !saisieAllowed}>
                    {saving ? (
                      <><Spinner animation="border" size="sm" className="me-2" />Enregistrement...</>
                    ) : (
                      <><i className="bi bi-check-lg me-2"></i>Enregistrer</>
                    )}
                  </Button>
                )}
              </div>
            }
          >
            {loadingRows ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : (
              <Table responsive hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '50px' }}>#</th>
                    <th style={{ width: '120px' }}>Matricule</th>
                    <th>Nom et Prénom</th>
                    <th style={{ width: '150px' }} className="text-center">Note /20</th>
                    <th style={{ width: '100px' }} className="text-center">Absent</th>
                    <th style={{ width: '120px' }} className="text-center">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {etudiants.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-muted py-4">Aucun étudiant éligible</td>
                    </tr>
                  ) : (
                    etudiants.map((etudiant, index) => (
                      <tr key={etudiant.etudiantId} className={etudiant.absent ? 'table-warning' : undefined}>
                        <td className="text-muted">{index + 1}</td>
                        <td><code>{etudiant.matricule}</code></td>
                        <td className="fw-medium">{etudiant.nom} {etudiant.prenom}</td>
                        <td>
                          <Form.Control
                            type="number"
                            min={0}
                            max={20}
                            step={0.25}
                            value={etudiant.note ?? ''}
                            onChange={(e) => handleNoteChange(etudiant.etudiantId, e.target.value)}
                            disabled={etudiant.absent || etudiant.isValide || !saisieAllowed}
                            className="text-center"
                            placeholder="-"
                          />
                        </td>
                        <td className="text-center">
                          <Form.Check
                            type="checkbox"
                            checked={etudiant.absent}
                            onChange={(e) => handleAbsentChange(etudiant.etudiantId, e.target.checked)}
                            disabled={etudiant.isValide || !saisieAllowed}
                          />
                        </td>
                        <td className="text-center">
                          {etudiant.isValide ? (
                            <Badge bg="secondary">Validée</Badge>
                          ) : etudiant.absent ? (
                            <Badge bg="warning">Absent</Badge>
                          ) : etudiant.note !== undefined ? (
                            <Badge bg="info">Saisie</Badge>
                          ) : (
                            <Badge bg="light" text="dark">En attente</Badge>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            )}
          </DataCard>
        </>
      )}

      {!filtersComplete && (
        <Card className="border-0 shadow-sm">
          <Card.Body className="text-center py-5">
            <i className="bi bi-pencil-square fs-1 text-muted mb-3 d-block"></i>
            <h5 className="text-muted">Sélectionnez les critères</h5>
            <p className="text-muted mb-0">
              Session, filière, niveau, matière et type d&apos;évaluation sont requis.
            </p>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default SaisieNotesPage;
