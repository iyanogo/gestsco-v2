import React, { useState } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Badge, Modal, ProgressBar } from 'react-bootstrap';

interface Inscription {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  filiere: string;
  niveau: string;
  dateInscription: string;
  statut: 'en_attente' | 'validee' | 'rejetee' | 'incomplete';
  montantPaye: number;
  montantTotal: number;
  documents: { nom: string; statut: 'fourni' | 'manquant' }[];
}

const mockInscriptions: Inscription[] = [
  { id: 1, matricule: '2025-0001', nom: 'Diallo', prenom: 'Amadou', filiere: 'Informatique', niveau: 'L1', dateInscription: '2025-01-05', statut: 'en_attente', montantPaye: 150000, montantTotal: 300000, documents: [{ nom: 'CNI', statut: 'fourni' }, { nom: 'Photo', statut: 'fourni' }, { nom: 'Diplôme', statut: 'manquant' }] },
  { id: 2, matricule: '2025-0002', nom: 'Sow', prenom: 'Fatou', filiere: 'Gestion', niveau: 'L1', dateInscription: '2025-01-04', statut: 'validee', montantPaye: 300000, montantTotal: 300000, documents: [{ nom: 'CNI', statut: 'fourni' }, { nom: 'Photo', statut: 'fourni' }, { nom: 'Diplôme', statut: 'fourni' }] },
  { id: 3, matricule: '2025-0003', nom: 'Ndiaye', prenom: 'Moussa', filiere: 'Économie', niveau: 'L1', dateInscription: '2025-01-03', statut: 'incomplete', montantPaye: 0, montantTotal: 280000, documents: [{ nom: 'CNI', statut: 'manquant' }, { nom: 'Photo', statut: 'fourni' }, { nom: 'Diplôme', statut: 'manquant' }] },
  { id: 4, matricule: '2025-0004', nom: 'Fall', prenom: 'Ibrahima', filiere: 'Informatique', niveau: 'L1', dateInscription: '2025-01-02', statut: 'rejetee', montantPaye: 0, montantTotal: 300000, documents: [{ nom: 'CNI', statut: 'fourni' }, { nom: 'Photo', statut: 'fourni' }, { nom: 'Diplôme', statut: 'fourni' }] },
  { id: 5, matricule: '2025-0005', nom: 'Ba', prenom: 'Aïssatou', filiere: 'Droit', niveau: 'L1', dateInscription: '2025-01-06', statut: 'en_attente', montantPaye: 200000, montantTotal: 350000, documents: [{ nom: 'CNI', statut: 'fourni' }, { nom: 'Photo', statut: 'fourni' }, { nom: 'Diplôme', statut: 'fourni' }] },
];

const InscriptionsPage: React.FC = () => {
  const [inscriptions, setInscriptions] = useState<Inscription[]>(mockInscriptions);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedInscription, setSelectedInscription] = useState<Inscription | null>(null);

  const filteredInscriptions = inscriptions.filter(i => {
    const matchSearch = `${i.nom} ${i.prenom} ${i.matricule}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatut = !filterStatut || i.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'validee': return <Badge bg="success">Validée</Badge>;
      case 'en_attente': return <Badge bg="warning" text="dark">En attente</Badge>;
      case 'rejetee': return <Badge bg="danger">Rejetée</Badge>;
      case 'incomplete': return <Badge bg="secondary">Incomplète</Badge>;
      default: return <Badge bg="secondary">{statut}</Badge>;
    }
  };

  const handleValidate = (id: number) => {
    setInscriptions(inscriptions.map(i => i.id === id ? { ...i, statut: 'validee' as const } : i));
    setShowModal(false);
  };

  const handleReject = (id: number) => {
    setInscriptions(inscriptions.map(i => i.id === id ? { ...i, statut: 'rejetee' as const } : i));
    setShowModal(false);
  };

  const stats = {
    total: inscriptions.length,
    validees: inscriptions.filter(i => i.statut === 'validee').length,
    enAttente: inscriptions.filter(i => i.statut === 'en_attente').length,
    incompletes: inscriptions.filter(i => i.statut === 'incomplete').length
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1 fw-bold">Inscriptions</h2>
              <p className="text-muted mb-0">Gestion des nouvelles inscriptions</p>
            </div>
            <Button variant="primary" href="/admin/etudiants/nouveau">
              <i className="bi bi-plus-lg me-2"></i>Nouvelle inscription
            </Button>
          </div>
        </Col>
      </Row>

      {/* Stats */}
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
                <h3 className="mb-0 fw-bold">{stats.enAttente}</h3>
                <small>En attente</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-secondary text-white">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3">
                <i className="bi bi-exclamation-triangle fs-4"></i>
              </div>
              <div>
                <h3 className="mb-0 fw-bold">{stats.incompletes}</h3>
                <small>Incomplètes</small>
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
                <InputGroup.Text className="bg-light border-end-0"><i className="bi bi-search text-muted"></i></InputGroup.Text>
                <Form.Control type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="border-start-0" />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}>
                <option value="">Tous les statuts</option>
                <option value="en_attente">En attente</option>
                <option value="validee">Validée</option>
                <option value="incomplete">Incomplète</option>
                <option value="rejetee">Rejetée</option>
              </Form.Select>
            </Col>
            <Col md={4} className="text-end">
              <Button variant="outline-success" size="sm"><i className="bi bi-download me-1"></i>Exporter</Button>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body className="p-0">
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
              {filteredInscriptions.map((inscription) => (
                <tr key={inscription.id}>
                  <td className="px-4 py-3"><span className="fw-semibold text-primary">{inscription.matricule}</span></td>
                  <td className="py-3">
                    <div className="fw-semibold">{inscription.nom} {inscription.prenom}</div>
                  </td>
                  <td className="py-3">
                    <div>{inscription.filiere}</div>
                    <Badge bg="secondary">{inscription.niveau}</Badge>
                  </td>
                  <td className="py-3">{new Date(inscription.dateInscription).toLocaleDateString('fr-FR')}</td>
                  <td className="py-3">
                    <div className="text-center">
                      <small>{inscription.montantPaye.toLocaleString()} / {inscription.montantTotal.toLocaleString()} FCFA</small>
                      <ProgressBar now={(inscription.montantPaye / inscription.montantTotal) * 100} variant={inscription.montantPaye >= inscription.montantTotal ? 'success' : 'warning'} style={{ height: 6 }} className="mt-1" />
                    </div>
                  </td>
                  <td className="py-3 text-center">
                    <span className="text-success">{inscription.documents.filter(d => d.statut === 'fourni').length}</span>
                    <span className="text-muted">/</span>
                    <span>{inscription.documents.length}</span>
                  </td>
                  <td className="py-3 text-center">{getStatutBadge(inscription.statut)}</td>
                  <td className="py-3 text-end px-4">
                    <Button variant="outline-info" size="sm" className="me-2" onClick={() => { setSelectedInscription(inscription); setShowModal(true); }}>
                      <i className="bi bi-eye"></i>
                    </Button>
                    {inscription.statut === 'en_attente' && (
                      <>
                        <Button variant="outline-success" size="sm" className="me-2" onClick={() => handleValidate(inscription.id)}>
                          <i className="bi bi-check"></i>
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleReject(inscription.id)}>
                          <i className="bi bi-x"></i>
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Modal détails */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Détails de l'inscription</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedInscription && (
            <>
              <Row className="mb-3">
                <Col md={6}>
                  <p><strong>Matricule:</strong> {selectedInscription.matricule}</p>
                  <p><strong>Nom:</strong> {selectedInscription.nom} {selectedInscription.prenom}</p>
                  <p><strong>Filière:</strong> {selectedInscription.filiere}</p>
                  <p><strong>Niveau:</strong> {selectedInscription.niveau}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Date d'inscription:</strong> {new Date(selectedInscription.dateInscription).toLocaleDateString('fr-FR')}</p>
                  <p><strong>Statut:</strong> {getStatutBadge(selectedInscription.statut)}</p>
                  <p><strong>Paiement:</strong> {selectedInscription.montantPaye.toLocaleString()} / {selectedInscription.montantTotal.toLocaleString()} FCFA</p>
                </Col>
              </Row>
              <h6 className="fw-bold mb-3">Documents</h6>
              <Table size="sm" bordered>
                <thead>
                  <tr><th>Document</th><th className="text-center">Statut</th></tr>
                </thead>
                <tbody>
                  {selectedInscription.documents.map((doc, idx) => (
                    <tr key={idx}>
                      <td>{doc.nom}</td>
                      <td className="text-center">
                        {doc.statut === 'fourni' ? <Badge bg="success">Fourni</Badge> : <Badge bg="danger">Manquant</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Fermer</Button>
          {selectedInscription?.statut === 'en_attente' && (
            <>
              <Button variant="danger" onClick={() => handleReject(selectedInscription.id)}>Rejeter</Button>
              <Button variant="success" onClick={() => handleValidate(selectedInscription.id)}>Valider</Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default InscriptionsPage;
