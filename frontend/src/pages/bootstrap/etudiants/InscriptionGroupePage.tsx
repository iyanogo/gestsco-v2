import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Badge, Alert, ProgressBar } from 'react-bootstrap';

interface EtudiantImport {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  dateNaissance: string;
  filiere: string;
  niveau: string;
  statut: 'valide' | 'erreur' | 'en_attente';
  erreur?: string;
}

const InscriptionGroupePage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [filiere, setFiliere] = useState('');
  const [niveau, setNiveau] = useState('');
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [etudiants, setEtudiants] = useState<EtudiantImport[]>([]);
  const [importComplete, setImportComplete] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = () => {
    setImporting(true);
    setProgress(0);
    
    // Simulation d'import
    const mockData: EtudiantImport[] = [
      { id: 1, nom: 'Diallo', prenom: 'Amadou', email: 'amadou.diallo@email.com', dateNaissance: '2000-05-15', filiere, niveau, statut: 'valide' },
      { id: 2, nom: 'Sow', prenom: 'Fatou', email: 'fatou.sow@email.com', dateNaissance: '2001-03-22', filiere, niveau, statut: 'valide' },
      { id: 3, nom: 'Ndiaye', prenom: 'Moussa', email: 'moussa.ndiaye@email.com', dateNaissance: '1999-11-08', filiere, niveau, statut: 'erreur', erreur: 'Email déjà existant' },
      { id: 4, nom: 'Fall', prenom: 'Ibrahima', email: 'ibrahima.fall@email.com', dateNaissance: '2000-07-30', filiere, niveau, statut: 'valide' },
      { id: 5, nom: 'Ba', prenom: 'Aïssatou', email: 'aissatou.ba@email.com', dateNaissance: '2001-01-12', filiere, niveau, statut: 'valide' },
      { id: 6, nom: 'Diop', prenom: 'Omar', email: '', dateNaissance: '2000-09-25', filiere, niveau, statut: 'erreur', erreur: 'Email manquant' },
      { id: 7, nom: 'Sarr', prenom: 'Cheikh', email: 'cheikh.sarr@email.com', dateNaissance: '1999-04-18', filiere, niveau, statut: 'valide' },
      { id: 8, nom: 'Gueye', prenom: 'Mariama', email: 'mariama.gueye@email.com', dateNaissance: '2001-06-03', filiere, niveau, statut: 'valide' },
    ];

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      setProgress(currentProgress);
      if (currentProgress >= 100) {
        clearInterval(interval);
        setEtudiants(mockData);
        setImporting(false);
        setStep(3);
      }
    }, 200);
  };

  const handleConfirmImport = () => {
    setImporting(true);
    setProgress(0);
    
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 20;
      setProgress(currentProgress);
      if (currentProgress >= 100) {
        clearInterval(interval);
        setImporting(false);
        setImportComplete(true);
      }
    }, 300);
  };

  const stats = {
    total: etudiants.length,
    valides: etudiants.filter(e => e.statut === 'valide').length,
    erreurs: etudiants.filter(e => e.statut === 'erreur').length
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1 fw-bold">Inscription en groupe</h2>
              <p className="text-muted mb-0">Importation de plusieurs étudiants depuis un fichier Excel/CSV</p>
            </div>
          </div>
        </Col>
      </Row>

      {/* Progress Steps */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-center">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="d-flex align-items-center">
                <div className={`rounded-circle d-flex align-items-center justify-content-center ${step >= s ? 'bg-primary text-white' : 'bg-light text-muted'}`} style={{ width: 40, height: 40 }}>
                  {step > s ? <i className="bi bi-check"></i> : s}
                </div>
                <span className={`ms-2 me-4 d-none d-md-inline ${step >= s ? 'text-primary fw-semibold' : 'text-muted'}`}>
                  {s === 1 ? 'Configuration' : s === 2 ? 'Fichier' : s === 3 ? 'Vérification' : 'Confirmation'}
                </span>
                {s < 4 && <div className={`mx-2 ${step > s ? 'bg-primary' : 'bg-light'}`} style={{ width: 30, height: 3 }}></div>}
              </div>
            ))}
          </div>
        </Col>
      </Row>

      {importComplete && (
        <Alert variant="success" className="mb-4">
          <i className="bi bi-check-circle me-2"></i>
          <strong>{stats.valides} étudiants</strong> ont été importés avec succès !
        </Alert>
      )}

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-4">
          {/* Step 1: Configuration */}
          {step === 1 && (
            <>
              <h5 className="mb-4 fw-bold"><i className="bi bi-gear me-2 text-primary"></i>Configuration de l'import</h5>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Filière <span className="text-danger">*</span></Form.Label>
                    <Form.Select value={filiere} onChange={(e) => setFiliere(e.target.value)} required>
                      <option value="">Sélectionner une filière</option>
                      <option value="Informatique">Informatique</option>
                      <option value="Gestion">Gestion</option>
                      <option value="Économie">Économie</option>
                      <option value="Droit">Droit</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Niveau <span className="text-danger">*</span></Form.Label>
                    <Form.Select value={niveau} onChange={(e) => setNiveau(e.target.value)} required>
                      <option value="">Sélectionner un niveau</option>
                      <option value="L1">Licence 1</option>
                      <option value="L2">Licence 2</option>
                      <option value="L3">Licence 3</option>
                      <option value="M1">Master 1</option>
                      <option value="M2">Master 2</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <div className="text-end mt-4">
                <Button variant="primary" onClick={() => setStep(2)} disabled={!filiere || !niveau}>
                  Suivant <i className="bi bi-arrow-right ms-2"></i>
                </Button>
              </div>
            </>
          )}

          {/* Step 2: Upload fichier */}
          {step === 2 && (
            <>
              <h5 className="mb-4 fw-bold"><i className="bi bi-file-earmark-excel me-2 text-primary"></i>Sélection du fichier</h5>
              <Alert variant="info">
                <i className="bi bi-info-circle me-2"></i>
                Le fichier doit contenir les colonnes: <strong>Nom, Prénom, Email, Date de naissance</strong>
              </Alert>
              <div className="border rounded p-5 text-center bg-light mb-4">
                <i className="bi bi-cloud-upload display-4 text-muted mb-3 d-block"></i>
                <Form.Group>
                  <Form.Label className="btn btn-outline-primary">
                    <i className="bi bi-folder2-open me-2"></i>
                    Sélectionner un fichier
                    <Form.Control type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="d-none" />
                  </Form.Label>
                </Form.Group>
                {file && (
                  <div className="mt-3">
                    <Badge bg="success" className="px-3 py-2">
                      <i className="bi bi-file-earmark-check me-2"></i>
                      {file.name}
                    </Badge>
                  </div>
                )}
                <p className="text-muted mt-3 mb-0">Formats acceptés: Excel (.xlsx, .xls) ou CSV</p>
              </div>
              <Row>
                <Col>
                  <a href="/templates/import_etudiants.xlsx" download className="btn btn-outline-primary me-2">
                    <i className="bi bi-download me-2"></i>Télécharger le modèle
                  </a>
                </Col>
              </Row>
              <div className="d-flex justify-content-between mt-4">
                <Button variant="outline-secondary" onClick={() => setStep(1)}>
                  <i className="bi bi-arrow-left me-2"></i>Précédent
                </Button>
                <Button variant="primary" onClick={handleImport} disabled={!file || importing}>
                  {importing ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Import en cours...
                    </>
                  ) : (
                    <>Analyser le fichier <i className="bi bi-arrow-right ms-2"></i></>
                  )}
                </Button>
              </div>
              {importing && <ProgressBar now={progress} className="mt-3" animated />}
            </>
          )}

          {/* Step 3: Vérification */}
          {step === 3 && (
            <>
              <h5 className="mb-4 fw-bold"><i className="bi bi-list-check me-2 text-primary"></i>Vérification des données</h5>
              <Row className="mb-4">
                <Col md={4}>
                  <Card className="border-0 bg-light">
                    <Card.Body className="text-center">
                      <h4 className="mb-0 fw-bold">{stats.total}</h4>
                      <small className="text-muted">Total lignes</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="border-0 bg-success bg-opacity-10">
                    <Card.Body className="text-center">
                      <h4 className="mb-0 fw-bold text-success">{stats.valides}</h4>
                      <small className="text-muted">Valides</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="border-0 bg-danger bg-opacity-10">
                    <Card.Body className="text-center">
                      <h4 className="mb-0 fw-bold text-danger">{stats.erreurs}</h4>
                      <small className="text-muted">Erreurs</small>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              <Table responsive hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>#</th>
                    <th>Nom</th>
                    <th>Prénom</th>
                    <th>Email</th>
                    <th>Date naissance</th>
                    <th className="text-center">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {etudiants.map((etudiant) => (
                    <tr key={etudiant.id} className={etudiant.statut === 'erreur' ? 'table-danger' : ''}>
                      <td>{etudiant.id}</td>
                      <td>{etudiant.nom}</td>
                      <td>{etudiant.prenom}</td>
                      <td>{etudiant.email || <span className="text-danger">-</span>}</td>
                      <td>{etudiant.dateNaissance}</td>
                      <td className="text-center">
                        {etudiant.statut === 'valide' ? (
                          <Badge bg="success">Valide</Badge>
                        ) : (
                          <Badge bg="danger" title={etudiant.erreur}>{etudiant.erreur}</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <div className="d-flex justify-content-between mt-4">
                <Button variant="outline-secondary" onClick={() => setStep(2)}>
                  <i className="bi bi-arrow-left me-2"></i>Précédent
                </Button>
                <Button variant="primary" onClick={() => setStep(4)} disabled={stats.valides === 0}>
                  Continuer avec {stats.valides} étudiants <i className="bi bi-arrow-right ms-2"></i>
                </Button>
              </div>
            </>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && !importComplete && (
            <>
              <h5 className="mb-4 fw-bold"><i className="bi bi-check-circle me-2 text-primary"></i>Confirmation de l'import</h5>
              <Alert variant="warning">
                <i className="bi bi-exclamation-triangle me-2"></i>
                Vous êtes sur le point d'importer <strong>{stats.valides} étudiants</strong> dans la filière <strong>{filiere}</strong> niveau <strong>{niveau}</strong>.
              </Alert>
              <Card className="border-0 bg-light mb-4">
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <p className="mb-1"><strong>Filière:</strong> {filiere}</p>
                      <p className="mb-1"><strong>Niveau:</strong> {niveau}</p>
                    </Col>
                    <Col md={6}>
                      <p className="mb-1"><strong>Étudiants à importer:</strong> {stats.valides}</p>
                      <p className="mb-1"><strong>Étudiants ignorés:</strong> {stats.erreurs}</p>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
              <div className="d-flex justify-content-between mt-4">
                <Button variant="outline-secondary" onClick={() => setStep(3)}>
                  <i className="bi bi-arrow-left me-2"></i>Précédent
                </Button>
                <Button variant="success" onClick={handleConfirmImport} disabled={importing}>
                  {importing ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Import en cours...
                    </>
                  ) : (
                    <><i className="bi bi-check-lg me-2"></i>Confirmer l'import</>
                  )}
                </Button>
              </div>
              {importing && <ProgressBar now={progress} className="mt-3" animated variant="success" />}
            </>
          )}

          {/* Import terminé */}
          {importComplete && (
            <div className="text-center py-5">
              <i className="bi bi-check-circle-fill text-success display-1 mb-4"></i>
              <h4 className="fw-bold">Import terminé avec succès !</h4>
              <p className="text-muted mb-4">{stats.valides} étudiants ont été ajoutés à la filière {filiere} niveau {niveau}</p>
              <Button variant="primary" href="/admin/etudiants" className="me-2">
                <i className="bi bi-people me-2"></i>Voir les étudiants
              </Button>
              <Button variant="outline-primary" onClick={() => { setStep(1); setImportComplete(false); setEtudiants([]); setFile(null); }}>
                <i className="bi bi-arrow-repeat me-2"></i>Nouvel import
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default InscriptionGroupePage;
