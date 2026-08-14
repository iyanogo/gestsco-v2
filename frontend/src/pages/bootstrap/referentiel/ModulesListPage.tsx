import React, { useState } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Modal, Badge } from 'react-bootstrap';

interface Module {
  id: number;
  code: string;
  nom: string;
  filiere: string;
  niveau: string;
  semestre: number;
  credits: number;
  volumeHoraire: number;
  coefficient: number;
  responsable: string;
  statut: 'actif' | 'inactif';
}

const mockModules: Module[] = [
  { id: 1, code: 'INF101', nom: 'Algorithmique et Programmation', filiere: 'Informatique', niveau: 'L1', semestre: 1, credits: 6, volumeHoraire: 60, coefficient: 3, responsable: 'Dr. Amadou Diallo', statut: 'actif' },
  { id: 2, code: 'INF102', nom: 'Architecture des Ordinateurs', filiere: 'Informatique', niveau: 'L1', semestre: 1, credits: 4, volumeHoraire: 45, coefficient: 2, responsable: 'Dr. Moussa Ndiaye', statut: 'actif' },
  { id: 3, code: 'MAT101', nom: 'Analyse Mathématique', filiere: 'Informatique', niveau: 'L1', semestre: 1, credits: 6, volumeHoraire: 60, coefficient: 3, responsable: 'Pr. Fatou Sow', statut: 'actif' },
  { id: 4, code: 'INF201', nom: 'Bases de Données', filiere: 'Informatique', niveau: 'L2', semestre: 3, credits: 6, volumeHoraire: 60, coefficient: 3, responsable: 'Dr. Ibrahima Fall', statut: 'actif' },
  { id: 5, code: 'INF202', nom: 'Programmation Orientée Objet', filiere: 'Informatique', niveau: 'L2', semestre: 3, credits: 6, volumeHoraire: 60, coefficient: 3, responsable: 'Dr. Amadou Diallo', statut: 'actif' },
  { id: 6, code: 'INF301', nom: 'Génie Logiciel', filiere: 'Informatique', niveau: 'L3', semestre: 5, credits: 6, volumeHoraire: 60, coefficient: 3, responsable: 'Dr. Cheikh Sarr', statut: 'actif' },
  { id: 7, code: 'GES101', nom: 'Introduction à la Gestion', filiere: 'Gestion', niveau: 'L1', semestre: 1, credits: 4, volumeHoraire: 45, coefficient: 2, responsable: 'Dr. Aïssatou Ba', statut: 'actif' },
  { id: 8, code: 'GES201', nom: 'Comptabilité Générale', filiere: 'Gestion', niveau: 'L2', semestre: 3, credits: 6, volumeHoraire: 60, coefficient: 3, responsable: 'Dr. Omar Diop', statut: 'actif' }
];

const ModulesListPage: React.FC = () => {
  const [modules, setModules] = useState<Module[]>(mockModules);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFiliere, setFilterFiliere] = useState('');
  const [filterNiveau, setFilterNiveau] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [formData, setFormData] = useState({
    code: '', nom: '', filiere: 'Informatique', niveau: 'L1', semestre: 1,
    credits: 6, volumeHoraire: 60, coefficient: 3, responsable: '', statut: 'actif' as 'actif' | 'inactif'
  });

  const filieres = [...new Set(modules.map(m => m.filiere))];
  const niveaux = [...new Set(modules.map(m => m.niveau))];

  const filteredModules = modules.filter(m => {
    const matchSearch = m.nom.toLowerCase().includes(searchTerm.toLowerCase()) || m.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFiliere = !filterFiliere || m.filiere === filterFiliere;
    const matchNiveau = !filterNiveau || m.niveau === filterNiveau;
    return matchSearch && matchFiliere && matchNiveau;
  });

  const handleShowModal = (module?: Module) => {
    if (module) {
      setEditingModule(module);
      setFormData({
        code: module.code, nom: module.nom, filiere: module.filiere, niveau: module.niveau,
        semestre: module.semestre, credits: module.credits, volumeHoraire: module.volumeHoraire,
        coefficient: module.coefficient, responsable: module.responsable, statut: module.statut
      });
    } else {
      setEditingModule(null);
      setFormData({ code: '', nom: '', filiere: 'Informatique', niveau: 'L1', semestre: 1, credits: 6, volumeHoraire: 60, coefficient: 3, responsable: '', statut: 'actif' });
    }
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingModule) {
      setModules(modules.map(m => m.id === editingModule.id ? { ...m, ...formData } : m));
    } else {
      setModules([...modules, { id: Math.max(...modules.map(m => m.id)) + 1, ...formData }]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Supprimer ce module ?')) setModules(modules.filter(m => m.id !== id));
  };

  const totalCredits = filteredModules.reduce((acc, m) => acc + m.credits, 0);
  const totalHeures = filteredModules.reduce((acc, m) => acc + m.volumeHoraire, 0);

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1 fw-bold">Modules d'enseignement</h2>
              <p className="text-muted mb-0">Gestion des unités d'enseignement par filière et niveau</p>
            </div>
            <Button variant="primary" onClick={() => handleShowModal()}>
              <i className="bi bi-plus-lg me-2"></i>Nouveau module
            </Button>
          </div>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-primary text-white">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3">
                <i className="bi bi-grid-3x3 fs-4"></i>
              </div>
              <div>
                <h3 className="mb-0 fw-bold">{modules.length}</h3>
                <small>Modules</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-success text-white">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3">
                <i className="bi bi-award fs-4"></i>
              </div>
              <div>
                <h3 className="mb-0 fw-bold">{totalCredits}</h3>
                <small>Crédits totaux</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-info text-white">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3">
                <i className="bi bi-clock fs-4"></i>
              </div>
              <div>
                <h3 className="mb-0 fw-bold">{totalHeures}h</h3>
                <small>Volume horaire</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-warning text-dark">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-white bg-opacity-25 p-3 me-3">
                <i className="bi bi-signpost-split fs-4"></i>
              </div>
              <div>
                <h3 className="mb-0 fw-bold">{filieres.length}</h3>
                <small>Filières</small>
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
                <InputGroup.Text className="bg-light border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </InputGroup.Text>
                <Form.Control type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="border-start-0" />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select value={filterFiliere} onChange={(e) => setFilterFiliere(e.target.value)}>
                <option value="">Toutes les filières</option>
                {filieres.map(f => <option key={f} value={f}>{f}</option>)}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select value={filterNiveau} onChange={(e) => setFilterNiveau(e.target.value)}>
                <option value="">Tous niveaux</option>
                {niveaux.map(n => <option key={n} value={n}>{n}</option>)}
              </Form.Select>
            </Col>
            <Col md={3} className="text-end">
              <Button variant="outline-success" size="sm"><i className="bi bi-download me-1"></i>Exporter</Button>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="bg-light">
              <tr>
                <th className="border-0 px-4 py-3">Code</th>
                <th className="border-0 py-3">Module</th>
                <th className="border-0 py-3">Filière / Niveau</th>
                <th className="border-0 py-3 text-center">Semestre</th>
                <th className="border-0 py-3 text-center">Crédits</th>
                <th className="border-0 py-3 text-center">Volume H.</th>
                <th className="border-0 py-3">Responsable</th>
                <th className="border-0 py-3 text-center">Statut</th>
                <th className="border-0 py-3 text-end px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredModules.map((module) => (
                <tr key={module.id}>
                  <td className="px-4 py-3"><span className="fw-semibold text-primary">{module.code}</span></td>
                  <td className="py-3"><div className="fw-semibold">{module.nom}</div></td>
                  <td className="py-3">
                    <div>{module.filiere}</div>
                    <Badge bg="secondary" className="mt-1">{module.niveau}</Badge>
                  </td>
                  <td className="py-3 text-center"><Badge bg="info">S{module.semestre}</Badge></td>
                  <td className="py-3 text-center"><Badge bg="primary" className="px-3 py-2">{module.credits}</Badge></td>
                  <td className="py-3 text-center">{module.volumeHoraire}h</td>
                  <td className="py-3"><small>{module.responsable}</small></td>
                  <td className="py-3 text-center">
                    <Badge bg={module.statut === 'actif' ? 'success' : 'secondary'}>{module.statut === 'actif' ? 'Actif' : 'Inactif'}</Badge>
                  </td>
                  <td className="py-3 text-end px-4">
                    <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleShowModal(module)}><i className="bi bi-pencil"></i></Button>
                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(module.id)}><i className="bi bi-trash"></i></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingModule ? 'Modifier le module' : 'Nouveau module'}</Modal.Title>
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
                  <Form.Label>Nom du module</Form.Label>
                  <Form.Control type="text" value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} required />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Filière</Form.Label>
                  <Form.Select value={formData.filiere} onChange={(e) => setFormData({ ...formData, filiere: e.target.value })}>
                    <option value="Informatique">Informatique</option>
                    <option value="Gestion">Gestion</option>
                    <option value="Économie">Économie</option>
                    <option value="Mathématiques">Mathématiques</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Niveau</Form.Label>
                  <Form.Select value={formData.niveau} onChange={(e) => setFormData({ ...formData, niveau: e.target.value })}>
                    <option value="L1">L1</option><option value="L2">L2</option><option value="L3">L3</option>
                    <option value="M1">M1</option><option value="M2">M2</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Semestre</Form.Label>
                  <Form.Select value={formData.semestre} onChange={(e) => setFormData({ ...formData, semestre: parseInt(e.target.value) })}>
                    {[1,2,3,4,5,6].map(s => <option key={s} value={s}>Semestre {s}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Crédits</Form.Label>
                  <Form.Control type="number" min="1" value={formData.credits} onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) })} required />
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
                  <Form.Label>Responsable</Form.Label>
                  <Form.Control type="text" value={formData.responsable} onChange={(e) => setFormData({ ...formData, responsable: e.target.value })} />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Statut</Form.Label>
                  <Form.Select value={formData.statut} onChange={(e) => setFormData({ ...formData, statut: e.target.value as 'actif' | 'inactif' })}>
                    <option value="actif">Actif</option><option value="inactif">Inactif</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button variant="primary" type="submit">{editingModule ? 'Modifier' : 'Créer'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default ModulesListPage;
