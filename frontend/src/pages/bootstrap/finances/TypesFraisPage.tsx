import React, { useState } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Badge, Modal } from 'react-bootstrap';

interface TypeFrais {
  id: number;
  code: string;
  nom: string;
  description: string;
  montant: number;
  obligatoire: boolean;
  applicable: string[];
  echeances: number;
  statut: 'actif' | 'inactif';
}

const mockTypesFrais: TypeFrais[] = [
  { id: 1, code: 'INSC', nom: 'Frais d\'inscription', description: 'Frais d\'inscription annuelle', montant: 50000, obligatoire: true, applicable: ['L1', 'L2', 'L3', 'M1', 'M2'], echeances: 1, statut: 'actif' },
  { id: 2, code: 'SCOL', nom: 'Frais de scolarité', description: 'Frais de scolarité annuels', montant: 250000, obligatoire: true, applicable: ['L1', 'L2', 'L3', 'M1', 'M2'], echeances: 3, statut: 'actif' },
  { id: 3, code: 'EXAM', nom: 'Frais d\'examen', description: 'Frais pour les sessions d\'examens', montant: 15000, obligatoire: true, applicable: ['L1', 'L2', 'L3', 'M1', 'M2'], echeances: 1, statut: 'actif' },
  { id: 4, code: 'BIBL', nom: 'Frais de bibliothèque', description: 'Accès à la bibliothèque', montant: 10000, obligatoire: false, applicable: ['L1', 'L2', 'L3', 'M1', 'M2'], echeances: 1, statut: 'actif' },
  { id: 5, code: 'SPORT', nom: 'Frais sportifs', description: 'Accès aux installations sportives', montant: 5000, obligatoire: false, applicable: ['L1', 'L2', 'L3', 'M1', 'M2'], echeances: 1, statut: 'actif' },
  { id: 6, code: 'LABO', nom: 'Frais de laboratoire', description: 'Accès aux laboratoires', montant: 20000, obligatoire: true, applicable: ['L2', 'L3', 'M1', 'M2'], echeances: 1, statut: 'actif' },
];

const TypesFraisPage: React.FC = () => {
  const [typesFrais, setTypesFrais] = useState<TypeFrais[]>(mockTypesFrais);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<TypeFrais | null>(null);
  const [formData, setFormData] = useState({
    code: '', nom: '', description: '', montant: 0, obligatoire: true, applicable: ['L1', 'L2', 'L3'], echeances: 1, statut: 'actif' as 'actif' | 'inactif'
  });

  const filteredTypes = typesFrais.filter(t =>
    t.nom.toLowerCase().includes(searchTerm.toLowerCase()) || t.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleShowModal = (type?: TypeFrais) => {
    if (type) {
      setEditingType(type);
      setFormData({ code: type.code, nom: type.nom, description: type.description, montant: type.montant, obligatoire: type.obligatoire, applicable: type.applicable, echeances: type.echeances, statut: type.statut });
    } else {
      setEditingType(null);
      setFormData({ code: '', nom: '', description: '', montant: 0, obligatoire: true, applicable: ['L1', 'L2', 'L3'], echeances: 1, statut: 'actif' });
    }
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingType) {
      setTypesFrais(typesFrais.map(t => t.id === editingType.id ? { ...t, ...formData } : t));
    } else {
      setTypesFrais([...typesFrais, { id: Math.max(...typesFrais.map(t => t.id)) + 1, ...formData }]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Supprimer ce type de frais ?')) setTypesFrais(typesFrais.filter(t => t.id !== id));
  };

  const totalMontantObligatoire = typesFrais.filter(t => t.obligatoire && t.statut === 'actif').reduce((acc, t) => acc + t.montant, 0);

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1 fw-bold">Types de frais</h2>
              <p className="text-muted mb-0">Configuration des différents types de frais</p>
            </div>
            <Button variant="primary" onClick={() => handleShowModal()}>
              <i className="bi bi-plus-lg me-2"></i>Nouveau type
            </Button>
          </div>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={4}>
          <Card className="border-0 shadow-sm bg-primary text-white">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3"><i className="bi bi-tags fs-4"></i></div>
              <div><h3 className="mb-0 fw-bold">{typesFrais.length}</h3><small>Types de frais</small></div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm bg-success text-white">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3"><i className="bi bi-check-circle fs-4"></i></div>
              <div><h3 className="mb-0 fw-bold">{typesFrais.filter(t => t.obligatoire).length}</h3><small>Obligatoires</small></div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm bg-warning text-dark">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3"><i className="bi bi-cash-stack fs-4"></i></div>
              <div><h3 className="mb-0 fw-bold">{totalMontantObligatoire.toLocaleString()}</h3><small>FCFA (obligatoires)</small></div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white py-3">
          <Row className="align-items-center">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text className="bg-light border-end-0"><i className="bi bi-search text-muted"></i></InputGroup.Text>
                <Form.Control type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="border-start-0" />
              </InputGroup>
            </Col>
            <Col md={6} className="text-end">
              <span className="text-muted">{filteredTypes.length} type(s)</span>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="bg-light">
              <tr>
                <th className="border-0 px-4 py-3">Code</th>
                <th className="border-0 py-3">Type de frais</th>
                <th className="border-0 py-3 text-end">Montant</th>
                <th className="border-0 py-3 text-center">Obligatoire</th>
                <th className="border-0 py-3 text-center">Échéances</th>
                <th className="border-0 py-3">Applicable à</th>
                <th className="border-0 py-3 text-center">Statut</th>
                <th className="border-0 py-3 text-end px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTypes.map((type) => (
                <tr key={type.id}>
                  <td className="px-4 py-3"><span className="fw-semibold text-primary">{type.code}</span></td>
                  <td className="py-3">
                    <div className="fw-semibold">{type.nom}</div>
                    <small className="text-muted">{type.description}</small>
                  </td>
                  <td className="py-3 text-end fw-semibold">{type.montant.toLocaleString()} FCFA</td>
                  <td className="py-3 text-center">
                    {type.obligatoire ? <Badge bg="danger">Obligatoire</Badge> : <Badge bg="secondary">Optionnel</Badge>}
                  </td>
                  <td className="py-3 text-center"><Badge bg="info">{type.echeances}</Badge></td>
                  <td className="py-3">
                    {type.applicable.slice(0, 3).map(n => <Badge key={n} bg="light" text="dark" className="me-1">{n}</Badge>)}
                    {type.applicable.length > 3 && <Badge bg="light" text="dark">+{type.applicable.length - 3}</Badge>}
                  </td>
                  <td className="py-3 text-center">
                    <Badge bg={type.statut === 'actif' ? 'success' : 'secondary'}>{type.statut === 'actif' ? 'Actif' : 'Inactif'}</Badge>
                  </td>
                  <td className="py-3 text-end px-4">
                    <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleShowModal(type)}><i className="bi bi-pencil"></i></Button>
                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(type.id)}><i className="bi bi-trash"></i></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton><Modal.Title>{editingType ? 'Modifier le type de frais' : 'Nouveau type de frais'}</Modal.Title></Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={4}><Form.Group className="mb-3"><Form.Label>Code</Form.Label><Form.Control type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required /></Form.Group></Col>
              <Col md={8}><Form.Group className="mb-3"><Form.Label>Nom</Form.Label><Form.Control type="text" value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} required /></Form.Group></Col>
            </Row>
            <Form.Group className="mb-3"><Form.Label>Description</Form.Label><Form.Control as="textarea" rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></Form.Group>
            <Row>
              <Col md={4}><Form.Group className="mb-3"><Form.Label>Montant (FCFA)</Form.Label><Form.Control type="number" value={formData.montant} onChange={(e) => setFormData({ ...formData, montant: parseInt(e.target.value) })} required /></Form.Group></Col>
              <Col md={4}><Form.Group className="mb-3"><Form.Label>Nombre d'échéances</Form.Label><Form.Control type="number" min="1" max="12" value={formData.echeances} onChange={(e) => setFormData({ ...formData, echeances: parseInt(e.target.value) })} required /></Form.Group></Col>
              <Col md={4}><Form.Group className="mb-3"><Form.Label>Statut</Form.Label><Form.Select value={formData.statut} onChange={(e) => setFormData({ ...formData, statut: e.target.value as 'actif' | 'inactif' })}><option value="actif">Actif</option><option value="inactif">Inactif</option></Form.Select></Form.Group></Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Check type="checkbox" label="Frais obligatoire" checked={formData.obligatoire} onChange={(e) => setFormData({ ...formData, obligatoire: e.target.checked })} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button variant="primary" type="submit">{editingType ? 'Modifier' : 'Créer'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default TypesFraisPage;
