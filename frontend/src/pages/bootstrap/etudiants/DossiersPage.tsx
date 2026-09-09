import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Form,
  InputGroup,
  Badge,
  Modal,
  Nav,
  Tab,
  Alert,
  Spinner,
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getEtudiants } from '../../../services/etudiantService';
import {
  getDocuments,
  createDocument,
  deleteDocument,
} from '../../../services/documentEtudiantService';
import { getFilieres } from '../../../services/filiereService';
import { getNiveaux } from '../../../services/niveauService';
import { getInscriptions } from '../../../services/inscriptionService';
import { handleApiError } from '../../../utils/errorHandler';
import type { DocumentEtudiant, Etudiant } from '../../../types/etudiant';
import { TYPES_DOCUMENT } from '../../../types/etudiant';

const REQUIRED_DOC_TYPES = ["Carte d'identité", "Photo d'identité", 'Baccalauréat', 'Certificat médical'];
const MAX_FILE_SIZE = 2 * 1024 * 1024;

interface DossierRow {
  etudiant: Etudiant;
  documents: DocumentEtudiant[];
  filiereLabel?: string;
  niveauLabel?: string;
  completude: number;
  statut: 'complet' | 'incomplet';
}

const DossiersPage: React.FC = () => {
  const [dossiers, setDossiers] = useState<DossierRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState<DossierRow | null>(null);
  const [uploadType, setUploadType] = useState<string>(TYPES_DOCUMENT[0]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [etudiants, documents, inscriptions, filieres, niveaux] = await Promise.all([
        getEtudiants({ limit: 500 }),
        getDocuments({ limit: 500 }),
        getInscriptions({ limit: 500 }),
        getFilieres(),
        getNiveaux(),
      ]);

      const filiereMap = new Map(filieres.map((f) => [f.id, f.libelle || f.code || '']));
      const niveauMap = new Map(niveaux.map((n) => [n.id, n.libelle || n.code || '']));
      const latestInscription = new Map<number, (typeof inscriptions)[0]>();

      inscriptions.forEach((inscription) => {
        const current = latestInscription.get(inscription.etudiant_id);
        if (!current || (inscription.date_inscription ?? '') > (current.date_inscription ?? '')) {
          latestInscription.set(inscription.etudiant_id, inscription);
        }
      });

      const docsByEtudiant = documents.reduce<Record<number, DocumentEtudiant[]>>((acc, doc) => {
        if (!acc[doc.etudiant_id]) acc[doc.etudiant_id] = [];
        acc[doc.etudiant_id].push(doc);
        return acc;
      }, {});

      const rows: DossierRow[] = etudiants.map((etudiant) => {
        const studentDocs = docsByEtudiant[etudiant.id] || [];
        const presentTypes = new Set(studentDocs.map((d) => d.type_document));
        const requiredPresent = REQUIRED_DOC_TYPES.filter((type) => presentTypes.has(type)).length;
        const completude = Math.round((requiredPresent / REQUIRED_DOC_TYPES.length) * 100);
        const inscription = latestInscription.get(etudiant.id);

        return {
          etudiant,
          documents: studentDocs,
          filiereLabel: inscription?.filiere_id ? filiereMap.get(inscription.filiere_id) : undefined,
          niveauLabel: inscription?.niveau_id ? niveauMap.get(inscription.niveau_id) : undefined,
          completude,
          statut: completude >= 100 ? 'complet' : 'incomplet',
        };
      });

      setDossiers(rows);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredDossiers = useMemo(() => {
    return dossiers.filter((dossier) => {
      const search = searchTerm.toLowerCase();
      const matchSearch =
        !search ||
        `${dossier.etudiant.nom} ${dossier.etudiant.prenom} ${dossier.etudiant.matricule ?? ''}`
          .toLowerCase()
          .includes(search);
      const matchStatut = !filterStatut || dossier.statut === filterStatut;
      return matchSearch && matchStatut;
    });
  }, [dossiers, searchTerm, filterStatut]);

  const getStatutBadge = (statut: string) => {
    if (statut === 'complet') return <Badge bg="success">Complet</Badge>;
    return <Badge bg="warning" text="dark">Incomplet</Badge>;
  };

  const getDocStatutBadge = (statut?: string) => {
    switch (statut) {
      case 'valide':
        return <Badge bg="success">Valide</Badge>;
      case 'refuse':
        return <Badge bg="danger">Refusé</Badge>;
      default:
        return <Badge bg="warning" text="dark">En attente</Badge>;
    }
  };

  const openDossier = (dossier: DossierRow) => {
    setSelectedDossier(dossier);
    setUploadFile(null);
    setShowModal(true);
  };

  const handleAddDocument = async () => {
    if (!selectedDossier || !uploadFile) {
      setError('Sélectionnez un type et un fichier.');
      return;
    }
    if (uploadFile.size > MAX_FILE_SIZE) {
      setError('Le fichier dépasse la taille maximale de 2 Mo.');
      return;
    }

    setUploading(true);
    setError(null);
    try {
      await createDocument({
        etudiant_id: selectedDossier.etudiant.id,
        type_document: uploadType,
        libelle: uploadFile.name,
        format_fichier: uploadFile.type,
        taille_fichier: uploadFile.size,
      });
      const docs = await getDocuments({ etudiant_id: selectedDossier.etudiant.id });
      setSelectedDossier((prev) => (prev ? { ...prev, documents: docs } : prev));
      await loadData();
      setUploadFile(null);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: number) => {
    if (!window.confirm('Supprimer ce document ?')) return;
    try {
      await deleteDocument(documentId);
      await loadData();
      if (selectedDossier) {
        setSelectedDossier((prev) =>
          prev
            ? {
                ...prev,
                documents: prev.documents.filter((doc) => doc.id !== documentId),
              }
            : prev
        );
      }
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const stats = {
    total: dossiers.length,
    complets: dossiers.filter((d) => d.statut === 'complet').length,
    incomplets: dossiers.filter((d) => d.statut === 'incomplet').length,
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1 fw-bold">Dossiers administratifs</h2>
              <p className="text-muted mb-0">Documents des étudiants inscrits</p>
            </div>
            <div>
              <Button variant="outline-warning" className="me-2" disabled>
                Dossiers incomplets ({stats.incomplets})
              </Button>
              <Button variant="outline-secondary" size="sm" onClick={loadData} disabled={loading}>
                <i className="bi bi-arrow-clockwise me-1"></i>Actualiser
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Row className="mb-4">
        <Col md={4}>
          <Card className="border-0 shadow-sm bg-primary text-white">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3">
                <i className="bi bi-folder2 fs-4"></i>
              </div>
              <div>
                <h3 className="mb-0 fw-bold">{stats.total}</h3>
                <small>Total dossiers</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm bg-success text-white">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3">
                <i className="bi bi-folder-check fs-4"></i>
              </div>
              <div>
                <h3 className="mb-0 fw-bold">{stats.complets}</h3>
                <small>Dossiers complets</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm bg-warning text-dark">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3">
                <i className="bi bi-folder-x fs-4"></i>
              </div>
              <div>
                <h3 className="mb-0 fw-bold">{stats.incomplets}</h3>
                <small>Dossiers incomplets</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white py-3">
          <Row className="align-items-center">
            <Col md={5}>
              <InputGroup>
                <InputGroup.Text className="bg-light border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Rechercher un étudiant..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-start-0"
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}>
                <option value="">Tous les statuts</option>
                <option value="complet">Complet</option>
                <option value="incomplet">Incomplet</option>
              </Form.Select>
            </Col>
            <Col md={4} className="text-end">
              <span className="text-muted">{filteredDossiers.length} dossier(s)</span>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : (
            <Table responsive hover className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="border-0 px-4 py-3">Matricule</th>
                  <th className="border-0 py-3">Étudiant</th>
                  <th className="border-0 py-3">Filière / Niveau</th>
                  <th className="border-0 py-3 text-center">Documents</th>
                  <th className="border-0 py-3 text-center">Complétude</th>
                  <th className="border-0 py-3 text-center">Statut</th>
                  <th className="border-0 py-3 text-end px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDossiers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-5">
                      Aucun dossier trouvé.
                    </td>
                  </tr>
                ) : (
                  filteredDossiers.map((dossier) => (
                    <tr key={dossier.etudiant.id}>
                      <td className="px-4 py-3">
                        <span className="fw-semibold text-primary">{dossier.etudiant.matricule || '-'}</span>
                      </td>
                      <td className="py-3">
                        <div className="fw-semibold">
                          {dossier.etudiant.nom} {dossier.etudiant.prenom}
                        </div>
                      </td>
                      <td className="py-3">
                        <div>{dossier.filiereLabel || '-'}</div>
                        <Badge bg="secondary">{dossier.niveauLabel || '-'}</Badge>
                      </td>
                      <td className="py-3 text-center">
                        <Badge bg="info" className="px-3 py-2">{dossier.documents.length}</Badge>
                      </td>
                      <td className="py-3 text-center">
                        <div className="d-flex align-items-center justify-content-center">
                          <div className="progress" style={{ width: 80, height: 8 }}>
                            <div
                              className={`progress-bar bg-${dossier.completude === 100 ? 'success' : 'warning'}`}
                              style={{ width: `${dossier.completude}%` }}
                            />
                          </div>
                          <span className="ms-2 small">{dossier.completude}%</span>
                        </div>
                      </td>
                      <td className="py-3 text-center">{getStatutBadge(dossier.statut)}</td>
                      <td className="py-3 text-end px-4">
                        <Button variant="outline-primary" size="sm" className="me-2" onClick={() => openDossier(dossier)}>
                          <i className="bi bi-eye me-1"></i>Voir
                        </Button>
                        <Link to={`/admin/etudiants/${dossier.etudiant.id}`} className="btn btn-sm btn-outline-secondary">
                          <i className="bi bi-person"></i>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Dossier de {selectedDossier?.etudiant.prenom} {selectedDossier?.etudiant.nom}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedDossier && (
            <Tab.Container defaultActiveKey="documents">
              <Nav variant="tabs" className="mb-3">
                <Nav.Item>
                  <Nav.Link eventKey="documents">
                    <i className="bi bi-file-earmark me-2"></i>Documents
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="infos">
                    <i className="bi bi-person me-2"></i>Informations
                  </Nav.Link>
                </Nav.Item>
              </Nav>
              <Tab.Content>
                <Tab.Pane eventKey="documents">
                  <Table bordered hover size="sm">
                    <thead className="bg-light">
                      <tr>
                        <th>Document</th>
                        <th>Type</th>
                        <th className="text-center">Statut</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDossier.documents.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center text-muted py-3">
                            Aucun document enregistré.
                          </td>
                        </tr>
                      ) : (
                        selectedDossier.documents.map((doc) => (
                          <tr key={doc.id}>
                            <td>{doc.libelle || doc.type_document}</td>
                            <td>{doc.type_document}</td>
                            <td className="text-center">{getDocStatutBadge(doc.statut)}</td>
                            <td className="text-center">
                              <Button
                                variant="link"
                                size="sm"
                                className="p-0 text-danger"
                                onClick={() => handleDeleteDocument(doc.id)}
                              >
                                <i className="bi bi-trash"></i>
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                  <Card className="mt-3 border">
                    <Card.Body>
                      <h6 className="fw-bold mb-3">Ajouter un document</h6>
                      <Row className="g-2 align-items-end">
                        <Col md={4}>
                          <Form.Select value={uploadType} onChange={(e) => setUploadType(e.target.value)}>
                            {TYPES_DOCUMENT.map((type) => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </Form.Select>
                        </Col>
                        <Col md={5}>
                          <Form.Control
                            type="file"
                            accept=".pdf,image/*"
                            onChange={(e) => {
                              const input = e.target as HTMLInputElement;
                              setUploadFile(input.files?.[0] ?? null);
                            }}
                          />
                        </Col>
                        <Col md={3}>
                          <Button variant="primary" className="w-100" onClick={handleAddDocument} disabled={uploading}>
                            {uploading ? 'Envoi...' : 'Enregistrer'}
                          </Button>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Tab.Pane>
                <Tab.Pane eventKey="infos">
                  <Row>
                    <Col md={6}>
                      <p><strong>Matricule:</strong> {selectedDossier.etudiant.matricule || '-'}</p>
                      <p><strong>Email:</strong> {selectedDossier.etudiant.email || '-'}</p>
                      <p><strong>Téléphone:</strong> {selectedDossier.etudiant.telephone || '-'}</p>
                    </Col>
                    <Col md={6}>
                      <p><strong>Filière:</strong> {selectedDossier.filiereLabel || '-'}</p>
                      <p><strong>Niveau:</strong> {selectedDossier.niveauLabel || '-'}</p>
                      <p><strong>Statut dossier:</strong> {getStatutBadge(selectedDossier.statut)}</p>
                    </Col>
                  </Row>
                </Tab.Pane>
              </Tab.Content>
            </Tab.Container>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Fermer</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default DossiersPage;
