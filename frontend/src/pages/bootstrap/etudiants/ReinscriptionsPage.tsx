import React, { useState } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Badge, Modal } from 'react-bootstrap';

interface Etudiant {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  filiere: string;
  niveauActuel: string;
  niveauSuivant: string;
  moyenne: number;
  decision: 'admis' | 'ajourné' | 'exclu';
  reinscriptionStatut: 'eligible' | 'reinscrit' | 'non_eligible';
  fraisPaye: boolean;
}

const mockEtudiants: Etudiant[] = [
  { id: 1, matricule: '2024-0001', nom: 'Diallo', prenom: 'Amadou', filiere: 'Informatique', niveauActuel: 'L1', niveauSuivant: 'L2', moyenne: 14.5, decision: 'admis', reinscriptionStatut: 'eligible', fraisPaye: false },
  { id: 2, matricule: '2024-0002', nom: 'Sow', prenom: 'Fatou', filiere: 'Informatique', niveauActuel: 'L1', niveauSuivant: 'L2', moyenne: 12.8, decision: 'admis', reinscriptionStatut: 'reinscrit', fraisPaye: true },
  { id: 3, matricule: '2024-0003', nom: 'Ndiaye', prenom: 'Moussa', filiere: 'Gestion', niveauActuel: 'L2', niveauSuivant: 'L3', moyenne: 15.2, decision: 'admis', reinscriptionStatut: 'eligible', fraisPaye: false },
  { id: 4, matricule: '2024-0004', nom: 'Fall', prenom: 'Ibrahima', filiere: 'Informatique', niveauActuel: 'L1', niveauSuivant: 'L1', moyenne: 8.5, decision: 'ajourné', reinscriptionStatut: 'eligible', fraisPaye: false },
  { id: 5, matricule: '2024-0005', nom: 'Ba', prenom: 'Aïssatou', filiere: 'Économie', niveauActuel: 'L3', niveauSuivant: 'M1', moyenne: 16.0, decision: 'admis', reinscriptionStatut: 'reinscrit', fraisPaye: true },
  { id: 6, matricule: '2024-0006', nom: 'Diop', prenom: 'Omar', filiere: 'Gestion', niveauActuel: 'L1', niveauSuivant: '-', moyenne: 5.2, decision: 'exclu', reinscriptionStatut: 'non_eligible', fraisPaye: false },
];

const ReinscriptionsPage: React.FC = () => {
  const [etudiants, setEtudiants] = useState<Etudiant[]>(mockEtudiants);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [filterFiliere, setFilterFiliere] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedEtudiant, setSelectedEtudiant] = useState<Etudiant | null>(null);

  const filieres = [...new Set(etudiants.map(e => e.filiere))];

  const filteredEtudiants = etudiants.filter(e => {
    const matchSearch = `${e.nom} ${e.prenom} ${e.matricule}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatut = !filterStatut || e.reinscriptionStatut === filterStatut;
    const matchFiliere = !filterFiliere || e.filiere === filterFiliere;
    return matchSearch && matchStatut && matchFiliere;
  });

  const handleReinscrire = (id: number) => {
    setEtudiants(etudiants.map(e => e.id === id ? { ...e, reinscriptionStatut: 'reinscrit' as const, fraisPaye: true } : e));
    setShowModal(false);
  };

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case 'admis': return <Badge bg="success">Admis</Badge>;
      case 'ajourné': return <Badge bg="warning" text="dark">Ajourné</Badge>;
      case 'exclu': return <Badge bg="danger">Exclu</Badge>;
      default: return <Badge bg="secondary">{decision}</Badge>;
    }
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'reinscrit': return <Badge bg="success">Réinscrit</Badge>;
      case 'eligible': return <Badge bg="info">Éligible</Badge>;
      case 'non_eligible': return <Badge bg="danger">Non éligible</Badge>;
      default: return <Badge bg="secondary">{statut}</Badge>;
    }
  };

  const stats = {
    total: etudiants.length,
    reinscrits: etudiants.filter(e => e.reinscriptionStatut === 'reinscrit').length,
    eligibles: etudiants.filter(e => e.reinscriptionStatut === 'eligible').length,
    nonEligibles: etudiants.filter(e => e.reinscriptionStatut === 'non_eligible').length
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1 fw-bold">Réinscriptions</h2>
              <p className="text-muted mb-0">Gestion des réinscriptions pour l'année 2025-2026</p>
            </div>
            <Button variant="outline-success">
              <i className="bi bi-download me-2"></i>Exporter la liste
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
                <small>Total étudiants</small>
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
                <h3 className="mb-0 fw-bold">{stats.reinscrits}</h3>
                <small>Réinscrits</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-info text-white">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3">
                <i className="bi bi-hourglass-split fs-4"></i>
              </div>
              <div>
                <h3 className="mb-0 fw-bold">{stats.eligibles}</h3>
                <small>Éligibles</small>
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
                <h3 className="mb-0 fw-bold">{stats.nonEligibles}</h3>
                <small>Non éligibles</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white py-3">
          <Row className="align-items-center">
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text className="bg-light border-end-0"><i className="bi bi-search text-muted"></i></InputGroup.Text>
                <Form.Control type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="border-start-0" />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select value={filterFiliere} onChange={(e) => setFilterFiliere(e.target.value)}>
                <option value="">Toutes les filières</option>
                {filieres.map(f => <option key={f} value={f}>{f}</option>)}
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}>
                <option value="">Tous les statuts</option>
                <option value="eligible">Éligible</option>
                <option value="reinscrit">Réinscrit</option>
                <option value="non_eligible">Non éligible</option>
              </Form.Select>
            </Col>
            <Col md={2} className="text-end">
              <span className="text-muted">{filteredEtudiants.length} étudiant(s)</span>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="bg-light">
              <tr>
                <th className="border-0 px-4 py-3">Matricule</th>
                <th className="border-0 py-3">Étudiant</th>
                <th className="border-0 py-3">Filière</th>
                <th className="border-0 py-3 text-center">Niveau actuel</th>
                <th className="border-0 py-3 text-center">Niveau suivant</th>
                <th className="border-0 py-3 text-center">Moyenne</th>
                <th className="border-0 py-3 text-center">Décision</th>
                <th className="border-0 py-3 text-center">Statut</th>
                <th className="border-0 py-3 text-end px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEtudiants.map((etudiant) => (
                <tr key={etudiant.id}>
                  <td className="px-4 py-3"><span className="fw-semibold text-primary">{etudiant.matricule}</span></td>
                  <td className="py-3">
                    <div className="fw-semibold">{etudiant.nom} {etudiant.prenom}</div>
                  </td>
                  <td className="py-3">{etudiant.filiere}</td>
                  <td className="py-3 text-center"><Badge bg="secondary">{etudiant.niveauActuel}</Badge></td>
                  <td className="py-3 text-center">
                    {etudiant.niveauSuivant !== '-' ? <Badge bg="primary">{etudiant.niveauSuivant}</Badge> : <span className="text-muted">-</span>}
                  </td>
                  <td className="py-3 text-center">
                    <span className={etudiant.moyenne >= 10 ? 'text-success fw-semibold' : 'text-danger fw-semibold'}>
                      {etudiant.moyenne.toFixed(2)}
                    </span>
                  </td>
                  <td className="py-3 text-center">{getDecisionBadge(etudiant.decision)}</td>
                  <td className="py-3 text-center">{getStatutBadge(etudiant.reinscriptionStatut)}</td>
                  <td className="py-3 text-end px-4">
                    {etudiant.reinscriptionStatut === 'eligible' && (
                      <Button variant="success" size="sm" onClick={() => { setSelectedEtudiant(etudiant); setShowModal(true); }}>
                        <i className="bi bi-check-lg me-1"></i>Réinscrire
                      </Button>
                    )}
                    {etudiant.reinscriptionStatut === 'reinscrit' && (
                      <Button variant="outline-info" size="sm">
                        <i className="bi bi-printer me-1"></i>Attestation
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Modal Réinscription */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmer la réinscription</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEtudiant && (
            <>
              <p>Voulez-vous réinscrire l'étudiant suivant ?</p>
              <Card className="bg-light border-0">
                <Card.Body>
                  <p className="mb-1"><strong>Matricule:</strong> {selectedEtudiant.matricule}</p>
                  <p className="mb-1"><strong>Nom:</strong> {selectedEtudiant.nom} {selectedEtudiant.prenom}</p>
                  <p className="mb-1"><strong>Filière:</strong> {selectedEtudiant.filiere}</p>
                  <p className="mb-1"><strong>Passage:</strong> {selectedEtudiant.niveauActuel} → {selectedEtudiant.niveauSuivant}</p>
                  <p className="mb-0"><strong>Moyenne:</strong> {selectedEtudiant.moyenne.toFixed(2)}</p>
                </Card.Body>
              </Card>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Annuler</Button>
          <Button variant="success" onClick={() => selectedEtudiant && handleReinscrire(selectedEtudiant.id)}>
            <i className="bi bi-check-lg me-2"></i>Confirmer la réinscription
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ReinscriptionsPage;
