import React, { useEffect, useState } from 'react';
import {
  Container, Row, Col, Card, Form, Button, Table, Badge, Alert, ProgressBar, Spinner,
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { AxiosError } from 'axios';
import {
  inscriptionGroupeService,
  type InscriptionGroupeResult,
} from '../../../services/inscriptionGroupeService';
import { getFilieres } from '../../../services/filiereService';
import { getNiveaux } from '../../../services/niveauService';
import { anneeAcademiqueService } from '../../../services/anneeAcademiqueService';
import { handleApiError } from '../../../utils/errorHandler';
import type { Filiere, Niveau } from '../../../types/reference';
import type { AnneeAcademique } from '../../../types/anneeAcademique';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

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

const downloadTemplate = () => {
  const headers = ['Matricule', 'Nom', 'Prenom', 'Sexe', 'Telephone', 'Date de naissance', 'Lieu de naissance', 'Nationalite'];
  const exampleData = [
    ['0222-SG2-2022', 'GARANE', 'Nafissatou', 'Feminin', '64 26 86 36', '04/09/2000', 'Bobo-Dioulasso', 'Burkinabe'],
    ['', 'KABORE', 'Fadel Moustapha', 'Masculin', '63 33 44 27', '07/01/2001', 'Ouagadougou', 'Burkinabe'],
  ];
  const csvContent = [headers.join(';'), ...exampleData.map((row) => row.join(';'))].join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'template_inscription_groupe.csv';
  link.click();
};

const InscriptionGroupePage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [filiereId, setFiliereId] = useState('');
  const [niveauId, setNiveauId] = useState('');
  const [typeInscription, setTypeInscription] = useState('nouvelle');
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [activeAnnee, setActiveAnnee] = useState<AnneeAcademique | null>(null);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InscriptionGroupeResult | null>(null);

  const inscriptionsAllowed = activeAnnee?.statut === 'ouverte';
  const anneeCode = activeAnnee?.code || activeAnnee?.libelle || '';

  useEffect(() => {
    const loadRefs = async () => {
      try {
        const [filiereData, niveauData, anneeData] = await Promise.all([
          getFilieres(),
          getNiveaux(),
          anneeAcademiqueService.getActiveAnnee(),
        ]);
        setFilieres(filiereData);
        setNiveaux(niveauData);
        setActiveAnnee(anneeData);
      } catch (err) {
        setError(extractErrorMessage(err));
      } finally {
        setLoadingRefs(false);
      }
    };
    loadRefs();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setError(null);
    setResult(null);

    if (!selected) {
      setFile(null);
      return;
    }

    if (!selected.name.endsWith('.xlsx') && !selected.name.endsWith('.xls')) {
      setError('Le fichier doit être au format Excel (.xlsx ou .xls)');
      setFile(null);
      return;
    }

    if (selected.size > MAX_FILE_SIZE) {
      setError(`Fichier trop volumineux (max ${MAX_FILE_SIZE / (1024 * 1024)} Mo)`);
      setFile(null);
      return;
    }

    setFile(selected);
  };

  const handleImport = async () => {
    if (!file || !filiereId || !niveauId || !anneeCode) {
      setError('Veuillez remplir tous les champs et sélectionner un fichier.');
      return;
    }

    if (!inscriptionsAllowed) {
      setError('Aucune année académique ouverte - l\'import est bloqué.');
      return;
    }

    setImporting(true);
    setError(null);
    setResult(null);

    try {
      const uploadResult = await inscriptionGroupeService.uploadInscriptions(
        file,
        parseInt(filiereId, 10),
        parseInt(niveauId, 10),
        anneeCode,
        typeInscription,
      );
      setResult(uploadResult);
      setStep(3);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setImporting(false);
    }
  };

  const resetImport = () => {
    setStep(1);
    setFile(null);
    setResult(null);
    setError(null);
  };

  const filiereLabel = filieres.find((f) => f.id === parseInt(filiereId, 10))?.libelle || '-';
  const niveauLabel = niveaux.find((n) => n.id === parseInt(niveauId, 10))?.libelle || '-';

  if (loadingRefs) {
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
          <h2 className="mb-1 fw-bold">Inscription en groupe</h2>
          <p className="text-muted mb-0">
            Importation d&apos;étudiants depuis un fichier Excel
            {activeAnnee && ` - année ${activeAnnee.libelle || activeAnnee.code} (${activeAnnee.statut})`}
          </p>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {!activeAnnee && (
        <Alert variant="warning">Aucune année académique active configurée.</Alert>
      )}

      {activeAnnee && !inscriptionsAllowed && (
        <Alert variant="warning">
          L&apos;année n&apos;est pas ouverte - l&apos;import est désactivé.
        </Alert>
      )}

      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-center">
            {[1, 2, 3].map((s) => (
              <div key={s} className="d-flex align-items-center">
                <div
                  className={`rounded-circle d-flex align-items-center justify-content-center ${step >= s ? 'bg-primary text-white' : 'bg-light text-muted'}`}
                  style={{ width: 40, height: 40 }}
                >
                  {step > s ? <i className="bi bi-check"></i> : s}
                </div>
                <span className={`ms-2 me-4 d-none d-md-inline ${step >= s ? 'text-primary fw-semibold' : 'text-muted'}`}>
                  {s === 1 ? 'Configuration' : s === 2 ? 'Import' : 'Résultat'}
                </span>
                {s < 3 && <div className={`mx-2 ${step > s ? 'bg-primary' : 'bg-light'}`} style={{ width: 30, height: 3 }}></div>}
              </div>
            ))}
          </div>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-4">
          {step === 1 && (
            <>
              <h5 className="mb-4 fw-bold"><i className="bi bi-gear me-2 text-primary"></i>Configuration de l&apos;import</h5>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Filière <span className="text-danger">*</span></Form.Label>
                    <Form.Select value={filiereId} onChange={(e) => setFiliereId(e.target.value)} required>
                      <option value="">Sélectionner une filière</option>
                      {filieres.map((f) => (
                        <option key={f.id} value={f.id}>{f.libelle || f.code}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Niveau <span className="text-danger">*</span></Form.Label>
                    <Form.Select value={niveauId} onChange={(e) => setNiveauId(e.target.value)} required>
                      <option value="">Sélectionner un niveau</option>
                      {niveaux.map((n) => (
                        <option key={n.id} value={n.id}>{n.libelle || n.code}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Type d&apos;inscription</Form.Label>
                    <Form.Select value={typeInscription} onChange={(e) => setTypeInscription(e.target.value)}>
                      <option value="nouvelle">Nouvelle inscription</option>
                      <option value="redoublement">Redoublement</option>
                      <option value="transfert">Transfert</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Alert variant="info" className="mb-0">
                Colonnes Excel attendues : <strong>Matricule</strong> (optionnel), <strong>Nom</strong>, <strong>Prenom</strong>,
                Sexe, Telephone, Date de naissance (JJ/MM/AAAA), Lieu de naissance, Nationalite
              </Alert>
              <div className="text-end mt-4">
                <Button variant="primary" onClick={() => setStep(2)} disabled={!filiereId || !niveauId || !activeAnnee}>
                  Suivant <i className="bi bi-arrow-right ms-2"></i>
                </Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h5 className="mb-4 fw-bold"><i className="bi bi-file-earmark-excel me-2 text-primary"></i>Import du fichier</h5>
              <div className="border rounded p-5 text-center bg-light mb-4">
                <i className="bi bi-cloud-upload display-4 text-muted mb-3 d-block"></i>
                <Form.Control
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="mx-auto"
                  style={{ maxWidth: 400 }}
                />
                {file && (
                  <Badge bg="success" className="px-3 py-2 mt-3">
                    <i className="bi bi-file-earmark-check me-2"></i>
                    {file.name}
                  </Badge>
                )}
                <p className="text-muted mt-3 mb-0">Formats acceptés : Excel (.xlsx, .xls) - max 10 Mo</p>
              </div>
              <Button variant="outline-primary" onClick={downloadTemplate} className="mb-4">
                <i className="bi bi-download me-2"></i>Télécharger le modèle
              </Button>
              <div className="d-flex justify-content-between">
                <Button variant="outline-secondary" onClick={() => setStep(1)} disabled={importing}>
                  <i className="bi bi-arrow-left me-2"></i>Précédent
                </Button>
                <Button
                  variant="primary"
                  onClick={handleImport}
                  disabled={!file || importing || !inscriptionsAllowed}
                >
                  {importing ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Import en cours...
                    </>
                  ) : (
                    <>Lancer l&apos;import <i className="bi bi-upload ms-2"></i></>
                  )}
                </Button>
              </div>
              {importing && <ProgressBar animated now={100} className="mt-3" />}
            </>
          )}

          {step === 3 && result && (
            <>
              <h5 className="mb-4 fw-bold"><i className="bi bi-list-check me-2 text-primary"></i>Résultat de l&apos;import</h5>
              <Alert variant={result.errors.length === 0 ? 'success' : 'warning'}>
                <strong>{result.success}</strong> inscription(s) réussie(s) sur <strong>{result.total}</strong> ligne(s).
                {result.errors.length > 0 && ` ${result.errors.length} erreur(s).`}
              </Alert>
              <Row className="mb-4">
                <Col md={4}>
                  <Card className="border-0 bg-light">
                    <Card.Body className="text-center">
                      <h4 className="mb-0 fw-bold">{result.total}</h4>
                      <small className="text-muted">Total lignes</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="border-0 bg-success bg-opacity-10">
                    <Card.Body className="text-center">
                      <h4 className="mb-0 fw-bold text-success">{result.success}</h4>
                      <small className="text-muted">Réussis</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="border-0 bg-danger bg-opacity-10">
                    <Card.Body className="text-center">
                      <h4 className="mb-0 fw-bold text-danger">{result.errors.length}</h4>
                      <small className="text-muted">Erreurs</small>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <p className="text-muted mb-3">
                Filière : <strong>{filiereLabel}</strong> - Niveau : <strong>{niveauLabel}</strong> - Année : <strong>{anneeCode}</strong>
              </p>

              {result.created_students.length > 0 && (
                <>
                  <h6 className="fw-bold">Étudiants inscrits</h6>
                  <Table responsive hover className="mb-4">
                    <thead className="bg-light">
                      <tr>
                        <th>Matricule</th>
                        <th>Nom</th>
                        <th>Prénom</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.created_students.map((student, index) => (
                        <tr key={index}>
                          <td><code>{student.matricule}</code></td>
                          <td>{student.nom}</td>
                          <td>{student.prenom}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </>
              )}

              {result.errors.length > 0 && (
                <>
                  <h6 className="fw-bold text-danger">Erreurs par ligne</h6>
                  <Table responsive hover size="sm">
                    <thead className="bg-light">
                      <tr>
                        <th>Ligne</th>
                        <th>Erreur</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.errors.map((err, index) => (
                        <tr key={index} className="table-danger">
                          <td>{err.line}</td>
                          <td>{err.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </>
              )}

              <div className="d-flex justify-content-between mt-4">
                <Button variant="outline-secondary" onClick={resetImport}>
                  <i className="bi bi-arrow-repeat me-2"></i>Nouvel import
                </Button>
                <Link to="/admin/etudiants" className="btn btn-primary">
                  <i className="bi bi-people me-2"></i>Voir les étudiants
                </Link>
              </div>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default InscriptionGroupePage;
