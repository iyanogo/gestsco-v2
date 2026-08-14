import React, { useState } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Modal, Badge } from 'react-bootstrap';

interface Matiere {
  id: number;
  code: string;
  nom: string;
  module: string;
  type: 'CM' | 'TD' | 'TP';
  volumeHoraire: number;
  coefficient: number;
  enseignant: string;
  statut: 'actif' | 'inactif';
}

const mockMatieres: Matiere[] = [
  { id: 1, code: 'ALG-CM', nom: 'Algorithmique - Cours', module: 'Algorithmique et Programmation', type: 'CM', volumeHoraire: 30, coefficient: 2, enseignant: 'Dr. Amadou Diallo', statut: 'actif' },
  { id: 2, code: 'ALG-TD', nom: 'Algorithmique - TD', module: 'Algorithmique et Programmation', type: 'TD', volumeHoraire: 15, coefficient: 1, enseignant: 'M. Cheikh Sarr', statut: 'actif' },
  { id: 3, code: 'ALG-TP', nom: 'Algorithmique - TP', module: 'Algorithmique et Programmation', type: 'TP', volumeHoraire: 15, coefficient: 1, enseignant: 'M. Cheikh Sarr', statut: 'actif' },
  { id: 4, code: 'BDD-CM', nom: 'Bases de Données - Cours', module: 'Bases de Données', type: 'CM', volumeHoraire: 30, coefficient: 2, enseignant: 'Dr. Ibrahima Fall', statut: 'actif' },
  { id: 5, code: 'BDD-TD', nom: 'Bases de Données - TD', module: 'Bases de Données', type: 'TD', volumeHoraire: 15, coefficient: 1, enseignant: 'Mme. Fatou Sow', statut: 'actif' },
  { id: 6, code: 'BDD-TP', nom: 'Bases de Données - TP', module: 'Bases de Données', type: 'TP', volumeHoraire: 15, coefficient: 1, enseignant: 'Mme. Fatou Sow', statut: 'actif' },
  { id: 7, code: 'ANA-CM', nom: 'Analyse Mathématique - Cours', module: 'Analyse Mathématique', type: 'CM', volumeHoraire: 40, coefficient: 3, enseignant: 'Pr. Moussa Ndiaye', statut: 'actif' },
  { id: 8, code: 'ANA-TD', nom: 'Analyse Mathématique - TD', module: 'Analyse Mathématique', type: 'TD', volumeHoraire: 20, coefficient: 1, enseignant: 'Dr. Aïssatou Ba', statut: 'actif' }
];

const MatieresListPage: React.FC = () => {
  const [matieres, setMatieres] = useState<Matiere[]>(mockMatieres);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMatiere, setEditingMatiere] = useState<Matiere | null>(null);
  const [formData, setFormData] = useState({
    code: '', nom: '', module: '', type: 'CM' as 'CM' | 'TD' | 'TP',
    volumeHoraire: 30, coefficient: 2, enseignant: '', statut: 'actif' as 'actif' | 'inactif'
  });

  const modules = [...new Set(matieres.map(m => m.module))];

  const filteredMatieres = matieres.filter(m => {
    const matchSearch = m.nom.toLowerCase().includes(searchTerm.toLowerCase()) || m.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = !filterType || m.type === filterType;
    return matchSearch && matchType;
  });

  const handleShowModal = (matiere?: Matiere) => {
    if (matiere) {
      setEditingMatiere(matiere);
      setFormData({ code: matiere.code, nom: matiere.nom, module: matiere.module, type: matiere.type, volumeHoraire: matiere.volumeHoraire, coefficient: matiere.coefficient, enseignant: matiere.enseignant, statut: matiere.statut });
    } else {
      setEditingMatiere(null);
      setFormData({ code: '', nom: '', module: '', type: 'CM', volumeHoraire: 30, coefficient: 2, enseignant: '', statut: 'actif' });
    }
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMatiere) {
      setMatieres(matieres.map(m => m.id === editingMatiere.id ? { ...m, ...formData } : m));
    } else {
      setMatieres([...matieres, { id: Math.max(...matieres.map(m => m.id)) + 1, ...formData }]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Supprimer cette matière ?')) setMatieres(matieres.filter(m => m.id !== id));
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'CM': return <Badge bg="primary">CM</Badge>;
      case 'TD': return <Badge bg="success">TD</Badge>;
      case 'TP': return <Badge bg="warning" text="dark">TP</Badge>;
      default: return <Badge bg="secondary">{type}</Badge>;
    }
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1 fw-bold">Matières</h2>
              <p className="text-muted mb-0">Gestion des matières enseignées (CM, TD, TP)</p>
            </div>
            <Button variant="primary" onClick={() => handleShowModal()}>
              <i className="bi bi-plus-lg me-2"></i>Nouvelle matière
            </Button>
          </div>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={4}>
          <Card className="border-0 shadow-sm bg-primary text-white">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3">
                <i className="bi bi-journal-text fs-4"></i>
              </div>
              <div>
                <h3 className="mb-0 fw-bold">{matieres.filter(m => m.type === 'CM').length}</h3>
                <small>Cours Magistraux</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm bg-success text-white">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3">
                <i className="bi bi-people fs-4"></i>
              </div>
              <div>
                <h3 className="mb-0 fw-bold">{matieres.filter(m => m.type === 'TD').length}</h3>
                <small>Travaux Dirigés</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm bg-warning text-dark">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3">
                <i className="bi bi-pc-display fs-4"></i>
              </div>
              <div>
                <h3 className="mb-0 fw-bold">{matieres.filter(m => m.type === 'TP').length}</h3>
                <small>Travaux Pratiques</small>
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
              <Form.Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="">Tous les types</option>
                <option value="CM">Cours Magistraux (CM)</option>
                <option value="TD">Travaux Dirigés (TD)</option>
                <option value="TP">Travaux Pratiques (TP)</option>
              </Form.Select>
            </Col>
            <Col md={4} className="text-end">
              <span className="text-muted">{filteredMatieres.length} matière(s)</span>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="bg-light">
              <tr>
                <th className="border-0 px-4 py-3">Code</th>
                <th className="border-0 py-3">Matière</th>
                <th className="border-0 py-3">Module</th>
                <th className="border-0 py-3 text-center">Type</th>
                <th className="border-0 py-3 text-center">Volume H.</th>
                <th className="border-0 py-3 text-center">Coef.</th>
                <th className="border-0 py-3">Enseignant</th>
                <th className="border-0 py-3 text-center">Statut</th>
                <th className="border-0 py-3 text-end px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMatieres.map((matiere) => (
                <tr key={matiere.id}>
                  <td className="px-4 py-3"><span className="fw-semibold text-primary">{matiere.code}</span></td>
                  <td className="py-3 fw-semibold">{matiere.nom}</td>
                  <td className="py-3"><small className="text-muted">{matiere.module}</small></td>
                  <td className="py-3 text-center">{getTypeBadge(matiere.type)}</td>
                  <td className="py-3 text-center">{matiere.volumeHoraire}h</td>
                  <td className="py-3 text-center"><Badge bg="secondary">{matiere.coefficient}</Badge></td>
                  <td className="py-3"><small>{matiere.enseignant}</small></td>
                  <td className="py-3 text-center">
                    <Badge bg={matiere.statut === 'actif' ? 'success' : 'secondary'}>{matiere.statut === 'actif' ? 'Actif' : 'Inactif'}</Badge>
                  </td>
                  <td className="py-3 text-end px-4">
                    <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleShowModal(matiere)}><i className="bi bi-pencil"></i></Button>
                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(matiere.id)}><i className="bi bi-trash"></i></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingMatiere ? 'Modifier la matière' : 'Nouvelle matière'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Code</Form.Label>
                  <Form.Control type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required />
                </Form.Group>
              </Col>
              <Col md={9}>
                <Form.Group className="mb-3">
                  <Form.Label>Nom</Form.Label>
                  <Form.Control type="text" value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} required />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Module</Form.Label>
              <Form.Select value={formData.module} onChange={(e) => setFormData({ ...formData, module: e.target.value })} required>
                <option value="">Sélectionner un module</option>
                {modules.map(m => <option key={m} value={m}>{m}</option>)}
                <option value="Nouveau module">+ Nouveau module</option>
              </Form.Select>
            </Form.Group>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Type</Form.Label>
                  <Form.Select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as 'CM' | 'TD' | 'TP' })}>
                    <option value="CM">Cours Magistral (CM)</option>
                    <option value="TD">Travaux Dirigés (TD)</option>
                    <option value="TP">Travaux Pratiques (TP)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Volume horaire</Form.Label>
                  <Form.Control type="number" min="1" value={formData.volumeHoraire} onChange={(e) => setFormData({ ...formData, volumeHoraire: parseInt(e.target.value) })} required />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Coefficient</Form.Label>
                  <Form.Control type="number" min="1" value={formData.coefficient} onChange={(e) => setFormData({ ...formData, coefficient: parseInt(e.target.value) })} required />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Enseignant</Form.Label>
                  <Form.Control type="text" value={formData.enseignant} onChange={(e) => setFormData({ ...formData, enseignant: e.target.value })} />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Statut</Form.Label>
                  <Form.Select value={formData.statut} onChange={(e) => setFormData({ ...formData, statut: e.target.value as 'actif' | 'inactif' })}>
                    <option value="actif">Actif</option>
                    <option value="inactif">Inactif</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button variant="primary" type="submit">{editingMatiere ? 'Modifier' : 'Créer'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default MatieresListPage;
