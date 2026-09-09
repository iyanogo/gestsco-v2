import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Badge, Modal, ProgressBar, Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import {
  getInscriptions,
  validerInscription,
  annulerInscription,
} from '../../../services/inscriptionService';
import { getEtudiants } from '../../../services/etudiantService';
import { getFilieres } from '../../../services/filiereService';
import { getNiveaux } from '../../../services/niveauService';
import { getDocuments } from '../../../services/documentEtudiantService';
import { handleApiError } from '../../../utils/errorHandler';
import type { Inscription, DocumentEtudiant } from '../../../types/etudiant';
import type { Etudiant } from '../../../types/etudiant';
import type { Filiere, Niveau } from '../../../types/reference';

interface InscriptionRow extends Inscription {
  matricule?: string;
  nom?: string;
  prenom?: string;
  filiereLabel?: string;
  niveauLabel?: string;
  documentsCount: number;
}

const InscriptionsPage: React.FC = () => {
  const [inscriptions, setInscriptions] = useState<InscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedInscription, setSelectedInscription] = useState<InscriptionRow | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<DocumentEtudiant[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [inscriptionData, etudiantData, filiereData, niveauData, documentData] = await Promise.all([
        getInscriptions({ limit: 500 }),
        getEtudiants({ limit: 500 }),
        getFilieres(),
        getNiveaux(),
        getDocuments({ limit: 500 }),
      ]);

      const etudiantMap = new Map<number, Etudiant>(etudiantData.map((e) => [e.id, e]));
      const filiereMap = new Map<number, Filiere>(filiereData.map((f) => [f.id, f]));
      const niveauMap = new Map<number, Niveau>(niveauData.map((n) => [n.id, n]));
      const docsByEtudiant = documentData.reduce<Record<number, number>>((acc, doc) => {
        acc[doc.etudiant_id] = (acc[doc.etudiant_id] || 0) + 1;
        return acc;
      }, {});

      const rows: InscriptionRow[] = inscriptionData.map((inscription) => {
        const etudiant = etudiantMap.get(inscription.etudiant_id);
        const filiere = inscription.filiere_id ? filiereMap.get(inscription.filiere_id) : undefined;
        const niveau = inscription.niveau_id ? niveauMap.get(inscription.niveau_id) : undefined;

        return {
          ...inscription,
          matricule: etudiant?.matricule,
          nom: etudiant?.nom,
          prenom: etudiant?.prenom,
          filiereLabel: filiere?.libelle || filiere?.code,
          niveauLabel: niveau?.libelle || niveau?.code,
          documentsCount: docsByEtudiant[inscription.etudiant_id] || 0,
        };
      });

      setInscriptions(rows);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredInscriptions = useMemo(() => {
    return inscriptions.filter((inscription) => {
      const search = searchTerm.toLowerCase();
      const matchSearch =
        !search ||
        `${inscription.nom ?? ''} ${inscription.prenom ?? ''} ${inscription.matricule ?? ''}`
          .toLowerCase()
          .includes(search);
      const matchStatut = !filterStatut || inscription.statut_inscription === filterStatut;
      return matchSearch && matchStatut;
    });
  }, [inscriptions, searchTerm, filterStatut]);

  const getStatutBadge = (statut?: string) => {
    switch (statut) {
      case 'validee':
        return <Badge bg="success">Validée</Badge>;
      case 'en_cours':
        return <Badge bg="warning" text="dark">En cours</Badge>;
      case 'annulee':
        return <Badge bg="danger">Annulée</Badge>;
      default:
        return <Badge bg="secondary">{statut || '-'}</Badge>;
    }
  };

  const openDetails = async (inscription: InscriptionRow) => {
    setSelectedInscription(inscription);
    setShowModal(true);
    try {
      const docs = await getDocuments({ etudiant_id: inscription.etudiant_id });
      setSelectedDocuments(docs);
    } catch {
      setSelectedDocuments([]);
    }
  };

  const handleValidate = async (id: number) => {
    setActionLoading(id);
    try {
      await validerInscription(id);
      await loadData();
      setShowModal(false);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: number) => {
    setActionLoading(id);
    try {
      await annulerInscription(id, 'Rejetée par la scolarité');
      await loadData();
      setShowModal(false);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setActionLoading(null);
    }
  };

  const stats = {
    total: inscriptions.length,
    validees: inscriptions.filter((i) => i.statut_inscription === 'validee').length,
    enCours: inscriptions.filter((i) => i.statut_inscription === 'en_cours').length,
    annulees: inscriptions.filter((i) => i.statut_inscription === 'annulee').length,
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1 fw-bold">Inscriptions</h2>
              <p className="text-muted mb-0">Gestion des inscriptions administratives</p>
            </div>
            <Link to="/admin/etudiants/nouveau" className="btn btn-primary">
              <i className="bi bi-plus-lg me-2"></i>Nouvelle inscription
            </Link>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-primary text-white">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3">
                <i className="bi bi-people fs-4"></i>
              </div>
              <div>
                <h3 className="mb-0 fw-bold">{stats.total}</h3>
                <small>Total inscriptions</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-success text-white">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3">
                <i className="bi bi-check-circle fs-4"></i>
              </div>
              <div>
                <h3 className="mb-0 fw-bold">{stats.validees}</h3>
                <small>Validées</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-warning text-dark">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3">
                <i className="bi bi-hourglass-split fs-4"></i>
              </div>
              <div>
                <h3 className="mb-0 fw-bold">{stats.enCours}</h3>
                <small>En cours</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-danger text-white">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3">
                <i className="bi bi-x-circle fs-4"></i>
              </div>
              <div>
                <h3 className="mb-0 fw-bold">{stats.annulees}</h3>
                <small>Annulées</small>
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
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-start-0"
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}>
                <option value="">Tous les statuts</option>
                <option value="en_cours">En cours</option>
                <option value="validee">Validée</option>
                <option value="annulee">Annulée</option>
              </Form.Select>
            </Col>
            <Col md={4} className="text-end">
              <Button variant="outline-secondary" size="sm" onClick={loadData} disabled={loading}>
                <i className="bi bi-arrow-clockwise me-1"></i>Actualiser
              </Button>
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
                  <th className="border-0 py-3">Date</th>
                  <th className="border-0 py-3 text-center">Paiement</th>
                  <th className="border-0 py-3 text-center">Documents</th>
                  <th className="border-0 py-3 text-center">Statut</th>
                  <th className="border-0 py-3 text-end px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-muted py-5">
                      Aucune inscription trouvée.
                    </td>
                  </tr>
                ) : (
                  filteredInscriptions.map((inscription) => {
                    const total = inscription.frais_inscription ?? 0;
                    const paye = inscription.frais_payes ?? 0;
                    const progress = total > 0 ? (paye / total) * 100 : 0;

                    return (
                      <tr key={inscription.id}>
                        <td className="px-4 py-3">
                          <span className="fw-semibold text-primary">{inscription.matricule || '-'}</span>
                        </td>
                        <td className="py-3">
                          <div className="fw-semibold">
                            {inscription.nom} {inscription.prenom}
                          </div>
                        </td>
                        <td className="py-3">
                          <div>{inscription.filiereLabel || '-'}</div>
                          <Badge bg="secondary">{inscription.niveauLabel || '-'}</Badge>
                        </td>
                        <td className="py-3">
                          {inscription.date_inscription
                            ? new Date(inscription.date_inscription).toLocaleDateString('fr-FR')
                            : '-'}
                        </td>
                        <td className="py-3">
                          {total > 0 ? (
                            <div className="text-center">
                              <small>
                                {paye.toLocaleString()} / {total.toLocaleString()} FCFA
                              </small>
                              <ProgressBar
                                now={progress}
                                variant={paye >= total ? 'success' : 'warning'}
                                style={{ height: 6 }}
                                className="mt-1"
                              />
                            </div>
                          ) : (
                            <div className="text-center text-muted">-</div>
                          )}
                        </td>
                        <td className="py-3 text-center">{inscription.documentsCount}</td>
                        <td className="py-3 text-center">{getStatutBadge(inscription.statut_inscription)}</td>
                        <td className="py-3 text-end px-4">
                          <Button
                            variant="outline-info"
                            size="sm"
                            className="me-2"
                            onClick={() => openDetails(inscription)}
                          >
                            <i className="bi bi-eye"></i>
                          </Button>
                          {inscription.statut_inscription === 'en_cours' && (
                            <>
                              <Button
                                variant="outline-success"
                                size="sm"
                                className="me-2"
                                disabled={actionLoading === inscription.id}
                                onClick={() => handleValidate(inscription.id)}
                              >
                                <i className="bi bi-check"></i>
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                disabled={actionLoading === inscription.id}
                                onClick={() => handleReject(inscription.id)}
                              >
                                <i className="bi bi-x"></i>
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Détails de l'inscription</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedInscription && (
            <>
              <Row className="mb-3">
                <Col md={6}>
                  <p><strong>Matricule:</strong> {selectedInscription.matricule || '-'}</p>
                  <p><strong>Nom:</strong> {selectedInscription.nom} {selectedInscription.prenom}</p>
                  <p><strong>Filière:</strong> {selectedInscription.filiereLabel || '-'}</p>
                  <p><strong>Niveau:</strong> {selectedInscription.niveauLabel || '-'}</p>
                </Col>
                <Col md={6}>
                  <p>
                    <strong>Date:</strong>{' '}
                    {selectedInscription.date_inscription
                      ? new Date(selectedInscription.date_inscription).toLocaleDateString('fr-FR')
                      : '-'}
                  </p>
                  <p><strong>Statut:</strong> {getStatutBadge(selectedInscription.statut_inscription)}</p>
                  <p><strong>Année:</strong> {selectedInscription.annee_academique}</p>
                  <p><strong>Type:</strong> {selectedInscription.type_inscription || '-'}</p>
                </Col>
              </Row>
              <h6 className="fw-bold mb-3">Documents ({selectedDocuments.length})</h6>
              {selectedDocuments.length === 0 ? (
                <p className="text-muted">Aucun document enregistré pour cet étudiant.</p>
              ) : (
                <Table size="sm" bordered>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Libellé</th>
                      <th className="text-center">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDocuments.map((doc) => (
                      <tr key={doc.id}>
                        <td>{doc.type_document}</td>
                        <td>{doc.libelle || '-'}</td>
                        <td className="text-center">{doc.statut || 'en_attente'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Fermer</Button>
          {selectedInscription?.statut_inscription === 'en_cours' && (
            <>
              <Button
                variant="danger"
                disabled={actionLoading === selectedInscription.id}
                onClick={() => handleReject(selectedInscription.id)}
              >
                Annuler
              </Button>
              <Button
                variant="success"
                disabled={actionLoading === selectedInscription.id}
                onClick={() => handleValidate(selectedInscription.id)}
              >
                Valider
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default InscriptionsPage;
