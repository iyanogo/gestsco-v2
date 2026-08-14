import React, { useState } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Modal, Badge } from 'react-bootstrap';

interface Universite {
  id: number;
  code: string;
  nom: string;
  sigle: string;
  pays: string;
  ville: string;
  adresse: string;
  telephone: string;
  email: string;
  siteWeb: string;
  dateCreation: string;
  statut: 'active' | 'inactive';
  nombreEtablissements: number;
}

const mockUniversites: Universite[] = [
  {
    id: 1,
    code: 'UCAD',
    nom: 'Université Cheikh Anta Diop',
    sigle: 'UCAD',
    pays: 'Sénégal',
    ville: 'Dakar',
    adresse: 'BP 5005, Dakar-Fann',
    telephone: '+221 33 825 00 00',
    email: 'contact@ucad.edu.sn',
    siteWeb: 'www.ucad.sn',
    dateCreation: '1957-02-24',
    statut: 'active',
    nombreEtablissements: 12
  },
  {
    id: 2,
    code: 'UGB',
    nom: 'Université Gaston Berger',
    sigle: 'UGB',
    pays: 'Sénégal',
    ville: 'Saint-Louis',
    adresse: 'BP 234, Saint-Louis',
    telephone: '+221 33 961 19 06',
    email: 'contact@ugb.edu.sn',
    siteWeb: 'www.ugb.sn',
    dateCreation: '1990-01-15',
    statut: 'active',
    nombreEtablissements: 6
  },
  {
    id: 3,
    code: 'UADB',
    nom: 'Université Alioune Diop de Bambey',
    sigle: 'UADB',
    pays: 'Sénégal',
    ville: 'Bambey',
    adresse: 'BP 30, Bambey',
    telephone: '+221 33 973 30 70',
    email: 'contact@uadb.edu.sn',
    siteWeb: 'www.uadb.edu.sn',
    dateCreation: '2007-01-01',
    statut: 'active',
    nombreEtablissements: 4
  },
  {
    id: 4,
    code: 'UT',
    nom: 'Université de Thiès',
    sigle: 'UT',
    pays: 'Sénégal',
    ville: 'Thiès',
    adresse: 'BP A967, Thiès',
    telephone: '+221 33 951 14 59',
    email: 'contact@univ-thies.sn',
    siteWeb: 'www.univ-thies.sn',
    dateCreation: '2007-01-01',
    statut: 'active',
    nombreEtablissements: 5
  }
];

const UniversitesListPage: React.FC = () => {
  const [universites, setUniversites] = useState<Universite[]>(mockUniversites);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUniversite, setEditingUniversite] = useState<Universite | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    nom: '',
    sigle: '',
    pays: 'Sénégal',
    ville: '',
    adresse: '',
    telephone: '',
    email: '',
    siteWeb: '',
    statut: 'active' as 'active' | 'inactive'
  });

  const filteredUniversites = universites.filter(u =>
    u.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.ville.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleShowModal = (universite?: Universite) => {
    if (universite) {
      setEditingUniversite(universite);
      setFormData({
        code: universite.code,
        nom: universite.nom,
        sigle: universite.sigle,
        pays: universite.pays,
        ville: universite.ville,
        adresse: universite.adresse,
        telephone: universite.telephone,
        email: universite.email,
        siteWeb: universite.siteWeb,
        statut: universite.statut
      });
    } else {
      setEditingUniversite(null);
      setFormData({
        code: '',
        nom: '',
        sigle: '',
        pays: 'Sénégal',
        ville: '',
        adresse: '',
        telephone: '',
        email: '',
        siteWeb: '',
        statut: 'active'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUniversite(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUniversite) {
      setUniversites(universites.map(u =>
        u.id === editingUniversite.id
          ? { ...u, ...formData }
          : u
      ));
    } else {
      const newUniversite: Universite = {
        id: Math.max(...universites.map(u => u.id)) + 1,
        ...formData,
        dateCreation: new Date().toISOString().split('T')[0],
        nombreEtablissements: 0
      };
      setUniversites([...universites, newUniversite]);
    }
    handleCloseModal();
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette université ?')) {
      setUniversites(universites.filter(u => u.id !== id));
    }
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1 fw-bold">Universités</h2>
              <p className="text-muted mb-0">Gestion des universités partenaires</p>
            </div>
            <Button variant="primary" onClick={() => handleShowModal()}>
              <i className="bi bi-plus-lg me-2"></i>
              Nouvelle université
            </Button>
          </div>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white py-3">
          <Row className="align-items-center">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text className="bg-light border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Rechercher une université..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-start-0"
                />
              </InputGroup>
            </Col>
            <Col md={6} className="text-end">
              <span className="text-muted">
                {filteredUniversites.length} université(s) trouvée(s)
              </span>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="bg-light">
              <tr>
                <th className="border-0 px-4 py-3">Code</th>
                <th className="border-0 py-3">Nom</th>
                <th className="border-0 py-3">Ville</th>
                <th className="border-0 py-3">Contact</th>
                <th className="border-0 py-3 text-center">Établissements</th>
                <th className="border-0 py-3 text-center">Statut</th>
                <th className="border-0 py-3 text-end px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUniversites.map((universite) => (
                <tr key={universite.id}>
                  <td className="px-4 py-3">
                    <span className="fw-semibold text-primary">{universite.code}</span>
                  </td>
                  <td className="py-3">
                    <div className="fw-semibold">{universite.nom}</div>
                    <small className="text-muted">{universite.sigle}</small>
                  </td>
                  <td className="py-3">
                    <div>{universite.ville}</div>
                    <small className="text-muted">{universite.pays}</small>
                  </td>
                  <td className="py-3">
                    <div><i className="bi bi-envelope me-2 text-muted"></i>{universite.email}</div>
                    <small className="text-muted"><i className="bi bi-telephone me-2"></i>{universite.telephone}</small>
                  </td>
                  <td className="py-3 text-center">
                    <Badge bg="info" className="px-3 py-2">
                      {universite.nombreEtablissements}
                    </Badge>
                  </td>
                  <td className="py-3 text-center">
                    <Badge bg={universite.statut === 'active' ? 'success' : 'secondary'}>
                      {universite.statut === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="py-3 text-end px-4">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                      onClick={() => handleShowModal(universite)}
                    >
                      <i className="bi bi-pencil"></i>
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDelete(universite.id)}
                    >
                      <i className="bi bi-trash"></i>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Modal Ajout/Modification */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingUniversite ? 'Modifier l\'université' : 'Nouvelle université'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Code</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Sigle</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.sigle}
                    onChange={(e) => setFormData({ ...formData, sigle: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Statut</Form.Label>
                  <Form.Select
                    value={formData.statut}
                    onChange={(e) => setFormData({ ...formData, statut: e.target.value as 'active' | 'inactive' })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Nom complet</Form.Label>
              <Form.Control
                type="text"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                required
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Pays</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.pays}
                    onChange={(e) => setFormData({ ...formData, pays: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Ville</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.ville}
                    onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Adresse</Form.Label>
              <Form.Control
                type="text"
                value={formData.adresse}
                onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Téléphone</Form.Label>
                  <Form.Control
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Site web</Form.Label>
              <Form.Control
                type="text"
                value={formData.siteWeb}
                onChange={(e) => setFormData({ ...formData, siteWeb: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Annuler
            </Button>
            <Button variant="primary" type="submit">
              {editingUniversite ? 'Modifier' : 'Créer'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default UniversitesListPage;
