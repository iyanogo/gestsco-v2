import React, { useState } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Badge, Modal, Nav, Tab } from 'react-bootstrap';

interface Document {
  id: number;
  nom: string;
  type: string;
  dateUpload: string;
  statut: 'valide' | 'en_attente' | 'expire';
}

interface Dossier {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  filiere: string;
  niveau: string;
  completude: number;
  documents: Document[];
  statut: 'complet' | 'incomplet' | 'en_cours';
}

const mockDossiers: Dossier[] = [
  {
    id: 1, matricule: '2024-0001', nom: 'Diallo', prenom: 'Amadou', filiere: 'Informatique', niveau: 'L2', completude: 100, statut: 'complet',
    documents: [
      { id: 1, nom: 'Carte d\'identité', type: 'CNI', dateUpload: '2024-09-15', statut: 'valide' },
      { id: 2, nom: 'Photo d\'identité', type: 'Photo', dateUpload: '2024-09-15', statut: 'valide' },
      { id: 3, nom: 'Baccalauréat', type: 'Diplôme', dateUpload: '2024-09-15', statut: 'valide' },
      { id: 4, nom: 'Certificat de scolarité', type: 'Certificat', dateUpload: '2024-09-20', statut: 'valide' }
    ]
  },
  {
    id: 2, matricule: '2024-0002', nom: 'Sow', prenom: 'Fatou', filiere: 'Gestion', niveau: 'L1', completude: 75, statut: 'incomplet',
    documents: [
      { id: 1, nom: 'Carte d\'identité', type: 'CNI', dateUpload: '2024-09-10', statut: 'valide' },
      { id: 2, nom: 'Photo d\'identité', type: 'Photo', dateUpload: '2024-09-10', statut: 'valide' },
      { id: 3, nom: 'Baccalauréat', type: 'Diplôme', dateUpload: '2024-09-10', statut: 'valide' }
    ]
  },
  {
    id: 3, matricule: '2024-0003', nom: 'Ndiaye', prenom: 'Moussa', filiere: 'Économie', niveau: 'L3', completude: 50, statut: 'incomplet',
    documents: [
      { id: 1, nom: 'Carte d\'identité', type: 'CNI', dateUpload: '2024-09-05', statut: 'expire' },
      { id: 2, nom: 'Photo d\'identité', type: 'Photo', dateUpload: '2024-09-05', statut: 'valide' }
    ]
  },
  {
    id: 4, matricule: '2024-0004', nom: 'Fall', prenom: 'Ibrahima', filiere: 'Informatique', niveau: 'M1', completude: 100, statut: 'complet',
    documents: [
      { id: 1, nom: 'Carte d\'identité', type: 'CNI', dateUpload: '2024-09-12', statut: 'valide' },
      { id: 2, nom: 'Photo d\'identité', type: 'Photo', dateUpload: '2024-09-12', statut: 'valide' },
      { id: 3, nom: 'Licence', type: 'Diplôme', dateUpload: '2024-09-12', statut: 'valide' },
      { id: 4, nom: 'Relevé de notes L3', type: 'Relevé', dateUpload: '2024-09-12', statut: 'valide' }
    ]
  }
];

const DossiersPage: React.FC = () => {
  const [dossiers] = useState<Dossier[]>(mockDossiers);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState<Dossier | null>(null);

  const filteredDossiers = dossiers.filter(d => {
    const matchSearch = `${d.nom} ${d.prenom} ${d.matricule}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatut = !filterStatut || d.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'complet': return <Badge bg="success">Complet</Badge>;
      case 'incomplet': return <Badge bg="warning" text="dark">Incomplet</Badge>;
      case 'en_cours': return <Badge bg="info">En cours</Badge>;
      default: return <Badge bg="secondary">{statut}</Badge>;
    }
  };

  const getDocStatutBadge = (statut: string) => {
    switch (statut) {
      case 'valide': return <Badge bg="success">Valide</Badge>;
      case 'en_attente': return <Badge bg="warning" text="dark">En attente</Badge>;
      case 'expire': return <Badge bg="danger">Expiré</Badge>;
      default: return <Badge bg="secondary">{statut}</Badge>;
    }
  };

  const stats = {
    total: dossiers.length,
    complets: dossiers.filter(d => d.statut === 'complet').length,
    incomplets: dossiers.filter(d => d.statut === 'incomplet').length
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1 fw-bold">Dossiers administratifs</h2>
              <p className="text-muted mb-0">Gestion des documents des étudiants</p>
            </div>
            <div>
              <Button variant="outline-warning" className="me-2">
                <i className="bi bi-exclamation-triangle me-2"></i>Dossiers incomplets ({stats.incomplets})
              </Button>
              <Button variant="outline-success">
                <i className="bi bi-download me-2"></i>Exporter
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Stats */}
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
                <InputGroup.Text className="bg-light border-end-0"><i className="bi bi-search text-muted"></i></InputGroup.Text>
                <Form.Control type="text" placeholder="Rechercher un étudiant..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="border-start-0" />
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
              {filteredDossiers.map((dossier) => (
                <tr key={dossier.id}>
                  <td className="px-4 py-3"><span className="fw-semibold text-primary">{dossier.matricule}</span></td>
                  <td className="py-3">
                    <div className="fw-semibold">{dossier.nom} {dossier.prenom}</div>
                  </td>
                  <td className="py-3">
                    <div>{dossier.filiere}</div>
                    <Badge bg="secondary">{dossier.niveau}</Badge>
                  </td>
                  <td className="py-3 text-center">
                    <Badge bg="info" className="px-3 py-2">{dossier.documents.length}</Badge>
                  </td>
                  <td className="py-3 text-center">
                    <div className="d-flex align-items-center justify-content-center">
                      <div className="progress" style={{ width: 80, height: 8 }}>
                        <div className={`progress-bar bg-${dossier.completude === 100 ? 'success' : 'warning'}`} style={{ width: `${dossier.completude}%` }}></div>
                      </div>
                      <span className="ms-2 small">{dossier.completude}%</span>
                    </div>
                  </td>
                  <td className="py-3 text-center">{getStatutBadge(dossier.statut)}</td>
                  <td className="py-3 text-end px-4">
                    <Button variant="outline-primary" size="sm" className="me-2" onClick={() => { setSelectedDossier(dossier); setShowModal(true); }}>
                      <i className="bi bi-eye me-1"></i>Voir
                    </Button>
                    <Button variant="outline-secondary" size="sm">
                      <i className="bi bi-upload"></i>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Modal Détails Dossier */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Dossier de {selectedDossier?.prenom} {selectedDossier?.nom}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedDossier && (
            <Tab.Container defaultActiveKey="documents">
              <Nav variant="tabs" className="mb-3">
                <Nav.Item>
                  <Nav.Link eventKey="documents"><i className="bi bi-file-earmark me-2"></i>Documents</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="infos"><i className="bi bi-person me-2"></i>Informations</Nav.Link>
                </Nav.Item>
              </Nav>
              <Tab.Content>
                <Tab.Pane eventKey="documents">
                  <Table bordered hover size="sm">
                    <thead className="bg-light">
                      <tr>
                        <th>Document</th>
                        <th>Type</th>
                        <th>Date d'upload</th>
                        <th className="text-center">Statut</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDossier.documents.map((doc) => (
                        <tr key={doc.id}>
                          <td>{doc.nom}</td>
                          <td>{doc.type}</td>
                          <td>{new Date(doc.dateUpload).toLocaleDateString('fr-FR')}</td>
                          <td className="text-center">{getDocStatutBadge(doc.statut)}</td>
                          <td className="text-center">
                            <Button variant="link" size="sm" className="p-0 me-2"><i className="bi bi-eye"></i></Button>
                            <Button variant="link" size="sm" className="p-0 text-danger"><i className="bi bi-trash"></i></Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  <div className="text-center mt-3">
                    <Button variant="outline-primary">
                      <i className="bi bi-plus-lg me-2"></i>Ajouter un document
                    </Button>
                  </div>
                </Tab.Pane>
                <Tab.Pane eventKey="infos">
                  <Row>
                    <Col md={6}>
                      <p><strong>Matricule:</strong> {selectedDossier.matricule}</p>
                      <p><strong>Nom:</strong> {selectedDossier.nom}</p>
                      <p><strong>Prénom:</strong> {selectedDossier.prenom}</p>
                    </Col>
                    <Col md={6}>
                      <p><strong>Filière:</strong> {selectedDossier.filiere}</p>
                      <p><strong>Niveau:</strong> {selectedDossier.niveau}</p>
                      <p><strong>Statut:</strong> {getStatutBadge(selectedDossier.statut)}</p>
                    </Col>
                  </Row>
                </Tab.Pane>
              </Tab.Content>
            </Tab.Container>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Fermer</Button>
          <Button variant="primary"><i className="bi bi-printer me-2"></i>Imprimer le dossier</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default DossiersPage;
