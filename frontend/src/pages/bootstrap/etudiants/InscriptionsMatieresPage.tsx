import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Container, Row, Col, Card, Table, Button, Form, Badge, Alert, Spinner,
} from 'react-bootstrap';
import { AxiosError } from 'axios';
import { getInscriptions, getMatieresByInscription, bulkCreateInscriptionMatieres, deleteInscriptionMatiere } from '../../../services/inscriptionService';
import { getEtudiants } from '../../../services/etudiantService';
import { getMatieres } from '../../../services/matiereService';
import { getModules } from '../../../services/moduleService';
import { getFilieres } from '../../../services/filiereService';
import { getNiveaux } from '../../../services/niveauService';
import { anneeAcademiqueService } from '../../../services/anneeAcademiqueService';
import { resultatService } from '../../../services/resultatService';
import { handleApiError } from '../../../utils/errorHandler';
import type { Inscription, InscriptionMatiere, Etudiant } from '../../../types/etudiant';
import type { Matiere, Module, Filiere, Niveau } from '../../../types/reference';
import type { AnneeAcademique } from '../../../types/anneeAcademique';

const LMD_CREDITS_CIBLE = 30;

interface InscriptionOption extends Inscription {
  label: string;
  etudiantNom?: string;
  filiereLabel?: string;
  niveauLabel?: string;
}

interface MatiereRow {
  matiere: Matiere;
  moduleLabel?: string;
  selected: boolean;
  enrolledId?: number;
  isDette: boolean;
}

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

const InscriptionsMatieresPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeAnnee, setActiveAnnee] = useState<AnneeAcademique | null>(null);
  const [inscriptionOptions, setInscriptionOptions] = useState<InscriptionOption[]>([]);
  const [selectedInscriptionId, setSelectedInscriptionId] = useState('');
  const [semestre, setSemestre] = useState<1 | 2>(1);
  const [matiereRows, setMatiereRows] = useState<MatiereRow[]>([]);
  const [loadingMatieres, setLoadingMatieres] = useState(false);
  const [initialSelectedIds, setInitialSelectedIds] = useState<Set<number>>(new Set());
  const [enrolledByMatiereId, setEnrolledByMatiereId] = useState<Map<number, InscriptionMatiere>>(new Map());

  const inscriptionsAllowed = activeAnnee?.statut === 'ouverte';

  const loadInscriptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [inscriptionData, etudiantData, filiereData, niveauData, anneeData] = await Promise.all([
        getInscriptions({ limit: 500 }),
        getEtudiants({ limit: 500 }),
        getFilieres(),
        getNiveaux(),
        anneeAcademiqueService.getActiveAnnee(),
      ]);

      setActiveAnnee(anneeData);
      const yearCode = anneeData?.code || anneeData?.libelle;

      const etudiantMap = new Map<number, Etudiant>(etudiantData.map((e) => [e.id, e]));
      const filiereMap = new Map<number, Filiere>(filiereData.map((f) => [f.id, f]));
      const niveauMap = new Map<number, Niveau>(niveauData.map((n) => [n.id, n]));

      const options: InscriptionOption[] = inscriptionData
        .filter((i) => i.statut_inscription !== 'annulee' && (!yearCode || i.annee_academique === yearCode))
        .map((inscription) => {
          const etudiant = etudiantMap.get(inscription.etudiant_id);
          const filiere = inscription.filiere_id ? filiereMap.get(inscription.filiere_id) : undefined;
          const niveau = inscription.niveau_id ? niveauMap.get(inscription.niveau_id) : undefined;
          const filiereLabel = filiere?.libelle || filiere?.code || '-';
          const niveauLabel = niveau?.libelle || niveau?.code || '-';
          const etudiantNom = etudiant ? `${etudiant.nom} ${etudiant.prenom}` : `Étudiant #${inscription.etudiant_id}`;

          return {
            ...inscription,
            etudiantNom,
            filiereLabel,
            niveauLabel,
            label: `${etudiantNom} - ${filiereLabel} / ${niveauLabel}`,
          };
        });

      setInscriptionOptions(options);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInscriptions();
  }, [loadInscriptions]);

  const selectedInscription = useMemo(
    () => inscriptionOptions.find((i) => i.id === parseInt(selectedInscriptionId, 10)),
    [inscriptionOptions, selectedInscriptionId],
  );

  const loadMatieresForInscription = useCallback(async () => {
    if (!selectedInscription) {
      setMatiereRows([]);
      return;
    }

    setLoadingMatieres(true);
    setError(null);
    setSuccess(null);

    try {
      const [enrolled, allMatieres, allModules, dettesResultats] = await Promise.all([
        getMatieresByInscription(selectedInscription.id, semestre),
        getMatieres({ limit: 500 }),
        getModules({ limit: 500 }),
        resultatService.getResultatsMatieres(selectedInscription.etudiant_id).catch(() => []),
      ]);

      const moduleMap = new Map<number, Module>(allModules.map((m) => [m.id, m]));
      const filiereModules = allModules.filter(
        (m) => !selectedInscription.filiere_id || m.filiere_id === selectedInscription.filiere_id,
      );
      const allowedModuleIds = new Set(filiereModules.map((m) => m.id));

      const detteMatiereIds = new Set(
        dettesResultats
          .filter((r) => r.statut === 'non_valide' || r.is_valide === false)
          .map((r) => r.matiere_id),
      );

      const enrolledMap = new Map<number, InscriptionMatiere>();
      enrolled.forEach((e) => enrolledMap.set(e.matiere_id, e));
      setEnrolledByMatiereId(enrolledMap);

      const availableMatieres = allMatieres.filter(
        (m) => m.module_id && allowedModuleIds.has(m.module_id),
      );

      const rows: MatiereRow[] = availableMatieres.map((matiere) => {
        const mod = matiere.module_id ? moduleMap.get(matiere.module_id) : undefined;
        const existing = enrolledMap.get(matiere.id);
        const isDette = detteMatiereIds.has(matiere.id);
        return {
          matiere,
          moduleLabel: mod?.libelle || mod?.code,
          selected: Boolean(existing) || isDette,
          enrolledId: existing?.id,
          isDette,
        };
      });

      rows.sort((a, b) => (a.matiere.libelle || '').localeCompare(b.matiere.libelle || ''));

      const selectedIds = new Set(rows.filter((r) => r.selected).map((r) => r.matiere.id));
      setInitialSelectedIds(selectedIds);
      setMatiereRows(rows);
    } catch (err) {
      setError(extractErrorMessage(err));
      setMatiereRows([]);
    } finally {
      setLoadingMatieres(false);
    }
  }, [selectedInscription, semestre]);

  useEffect(() => {
    loadMatieresForInscription();
  }, [loadMatieresForInscription]);

  const toggleMatiere = (matiereId: number) => {
    setMatiereRows((prev) =>
      prev.map((row) =>
        row.matiere.id === matiereId ? { ...row, selected: !row.selected } : row,
      ),
    );
  };

  const creditsEcts = useMemo(() => {
    return matiereRows
      .filter((r) => r.selected)
      .reduce((sum, r) => sum + (r.matiere.credit ?? 3), 0);
  }, [matiereRows]);

  const handleSave = async () => {
    if (!selectedInscription || !inscriptionsAllowed) return;

    const selectedIds = new Set(matiereRows.filter((r) => r.selected).map((r) => r.matiere.id));
    const toAdd = [...selectedIds].filter((id) => !initialSelectedIds.has(id));
    const toRemove = [...initialSelectedIds].filter((id) => !selectedIds.has(id));

    if (toAdd.length === 0 && toRemove.length === 0) {
      setSuccess('Aucune modification à enregistrer.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      for (const matiereId of toRemove) {
        const enrolled = enrolledByMatiereId.get(matiereId);
        if (enrolled) {
          await deleteInscriptionMatiere(enrolled.id);
        }
      }

      if (toAdd.length > 0) {
        await bulkCreateInscriptionMatieres({
          inscription_id: selectedInscription.id,
          matiere_ids: toAdd,
          semestre,
        });
      }

      setSuccess(`${toAdd.length} matière(s) ajoutée(s), ${toRemove.length} retirée(s).`);
      await loadMatieresForInscription();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container fluid className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2 className="mb-1 fw-bold">Inscriptions aux matières</h2>
          <p className="text-muted mb-0">
            Choix des matières par étudiant inscrit
            {activeAnnee && ` - ${activeAnnee.libelle || activeAnnee.code} (${activeAnnee.statut})`}
          </p>
        </Col>
      </Row>

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

      {!activeAnnee && (
        <Alert variant="warning">Aucune année académique active configurée.</Alert>
      )}

      {activeAnnee && !inscriptionsAllowed && (
        <Alert variant="warning">
          L&apos;année n&apos;est pas ouverte - les modifications sont désactivées.
        </Alert>
      )}

      <Alert variant="info" className="mb-4">
        Périmètre admin/scolarité uniquement. Quota ECTS ({LMD_CREDITS_CIBLE}/semestre) basé sur
        les crédits matière renseignés au référentiel. Les matières en dette (résultats non validés)
        sont pré-sélectionnées si disponibles.
      </Alert>

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Inscription étudiant</Form.Label>
                <Form.Select
                  value={selectedInscriptionId}
                  onChange={(e) => setSelectedInscriptionId(e.target.value)}
                >
                  <option value="">Sélectionner une inscription...</option>
                  {inscriptionOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Semestre</Form.Label>
                <Form.Select
                  value={semestre}
                  onChange={(e) => setSemestre(parseInt(e.target.value, 10) as 1 | 2)}
                  disabled={!selectedInscriptionId}
                >
                  <option value={1}>Semestre 1</option>
                  <option value={2}>Semestre 2</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3} className="text-md-end">
              <Badge bg="primary" className="px-3 py-2 fs-6">
                Total ECTS sélectionnés : {creditsEcts} / {LMD_CREDITS_CIBLE}
              </Badge>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {selectedInscription && (
        <Card className="border-0 shadow-sm">
          <Card.Header className="bg-white d-flex justify-content-between align-items-center py-3">
            <div>
              <h6 className="mb-0 fw-bold">{selectedInscription.etudiantNom}</h6>
              <small className="text-muted">
                {selectedInscription.filiereLabel} / {selectedInscription.niveauLabel} - Semestre {semestre}
              </small>
            </div>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saving || loadingMatieres || !inscriptionsAllowed}
            >
              {saving ? (
                <><Spinner animation="border" size="sm" className="me-2" />Enregistrement...</>
              ) : (
                <><i className="bi bi-check-lg me-2"></i>Enregistrer</>
              )}
            </Button>
          </Card.Header>
          <Card.Body className="p-0">
            {loadingMatieres ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : matiereRows.length === 0 ? (
              <Alert variant="secondary" className="m-4">
                Aucune matière disponible pour cette filière. Vérifiez le référentiel modules/matières.
              </Alert>
            ) : (
              <Table responsive hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="border-0 px-4 py-3" style={{ width: 50 }}></th>
                    <th className="border-0 py-3">Code</th>
                    <th className="border-0 py-3">Matière</th>
                    <th className="border-0 py-3">Module / UE</th>
                    <th className="border-0 py-3 text-center">ECTS</th>
                    <th className="border-0 py-3 text-center">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {matiereRows.map((row) => (
                    <tr key={row.matiere.id} className={row.isDette ? 'table-warning' : undefined}>
                      <td className="px-4 py-3">
                        <Form.Check
                          type="checkbox"
                          checked={row.selected}
                          onChange={() => toggleMatiere(row.matiere.id)}
                          disabled={!inscriptionsAllowed}
                        />
                      </td>
                      <td className="py-3"><code>{row.matiere.code || '-'}</code></td>
                      <td className="py-3 fw-medium">{row.matiere.libelle || '-'}</td>
                      <td className="py-3 text-muted">{row.moduleLabel || '-'}</td>
                      <td className="py-3 text-center">{row.matiere.credit ?? 3}</td>
                      <td className="py-3 text-center">
                        {row.isDette && <Badge bg="warning" text="dark" className="me-1">Dette</Badge>}
                        {row.enrolledId && <Badge bg="success">Inscrit</Badge>}
                        {!row.enrolledId && row.selected && !row.isDette && (
                          <Badge bg="info">Nouveau</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default InscriptionsMatieresPage;
