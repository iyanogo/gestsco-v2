import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Badge, Tab, Tabs, Table, ListGroup, ProgressBar } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../../../components/layouts';
import { Avatar } from '../../../components/ui';

interface EtudiantDetails {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  sexe: string;
  date_naissance: string;
  lieu_naissance: string;
  nationalite: string;
  telephone: string;
  email: string;
  adresse: string;
  filiere: string;
  niveau: string;
  statut: string;
  date_inscription: string;
  photo?: string;
}

interface Note {
  matiere: string;
  type: string;
  note: number;
  coefficient: number;
  date: string;
}

interface Paiement {
  id: number;
  date: string;
  montant: number;
  type: string;
  reference: string;
}

const EtudiantDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [etudiant, setEtudiant] = useState<EtudiantDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('informations');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    setTimeout(() => {
      setEtudiant({
        id: parseInt(id || '1'),
        matricule: '2024-0125',
        nom: 'DIALLO',
        prenom: 'Amadou',
        sexe: 'M',
        date_naissance: '1998-05-15',
        lieu_naissance: 'Ouagadougou',
        nationalite: 'Burkinabè',
        telephone: '+226 70 12 34 56',
        email: 'amadou.diallo@email.com',
        adresse: 'Secteur 30, Ouagadougou',
        filiere: 'Informatique',
        niveau: 'Licence 3',
        statut: 'inscrit',
        date_inscription: '2021-10-15'
      });
      setLoading(false);
    }, 500);
  };

  const notes: Note[] = [
    { matiere: 'Algorithmique avancée', type: 'Examen', note: 15, coefficient: 4, date: '03/01/2026' },
    { matiere: 'Base de données', type: 'TP', note: 16, coefficient: 2, date: '02/01/2026' },
    { matiere: 'Programmation Web', type: 'Projet', note: 14, coefficient: 3, date: '28/12/2025' },
    { matiere: 'Réseaux', type: 'Contrôle', note: 12, coefficient: 2, date: '20/12/2025' },
    { matiere: 'Anglais', type: 'Examen', note: 13, coefficient: 1, date: '15/12/2025' },
  ];

  const paiements: Paiement[] = [
    { id: 1, date: '15/10/2025', montant: 150000, type: 'Inscription', reference: 'PAY-2025-001' },
    { id: 2, date: '15/11/2025', montant: 100000, type: 'Scolarité T1', reference: 'PAY-2025-045' },
    { id: 3, date: '15/12/2025', montant: 100000, type: 'Scolarité T2', reference: 'PAY-2025-089' },
  ];

  const financialStatus = {
    totalDue: 450000,
    totalPaid: 350000,
    remaining: 100000
  };

  const calculateMoyenne = () => {
    const totalPoints = notes.reduce((sum, n) => sum + (n.note * n.coefficient), 0);
    const totalCoef = notes.reduce((sum, n) => sum + n.coefficient, 0);
    return (totalPoints / totalCoef).toFixed(2);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  if (loading || !etudiant) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <PageHeader
        title="Détails de l'étudiant"
        breadcrumbs={[
          { label: 'Étudiants', path: '/admin/etudiants' },
          { label: `${etudiant.prenom} ${etudiant.nom}` }
        ]}
        actions={
          <div className="d-flex gap-2">
            <Button variant="outline-secondary">
              <i className="bi bi-printer me-2"></i>
              Imprimer
            </Button>
            <Link to={`/admin/etudiants/${id}/edit`} className="btn btn-primary">
              <i className="bi bi-pencil me-2"></i>
              Modifier
            </Link>
          </div>
        }
      />

      <Row className="g-4">
        {/* Carte profil */}
        <Col lg={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center p-4">
              <Avatar name={`${etudiant.prenom} ${etudiant.nom}`} size="xl" className="mb-3" />
              <h4 className="mb-1">{etudiant.prenom} {etudiant.nom}</h4>
              <p className="text-muted mb-3">
                <code>{etudiant.matricule}</code>
              </p>
              <Badge bg={etudiant.statut === 'inscrit' ? 'success' : 'warning'} className="mb-3 px-3 py-2">
                {etudiant.statut === 'inscrit' ? 'Inscrit' : 'En attente'}
              </Badge>
              
              <hr />
              
              <ListGroup variant="flush" className="text-start">
                <ListGroup.Item className="d-flex justify-content-between px-0">
                  <span className="text-muted">Filière</span>
                  <span className="fw-medium">{etudiant.filiere}</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between px-0">
                  <span className="text-muted">Niveau</span>
                  <Badge bg="primary">{etudiant.niveau}</Badge>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between px-0">
                  <span className="text-muted">Moyenne</span>
                  <span className="fw-bold text-success">{calculateMoyenne()}/20</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between px-0">
                  <span className="text-muted">Inscrit depuis</span>
                  <span>{etudiant.date_inscription}</span>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>

          {/* Situation financière */}
          <Card className="border-0 shadow-sm mt-4">
            <Card.Header className="bg-white">
              <h6 className="mb-0">
                <i className="bi bi-wallet2 me-2"></i>
                Situation financière
              </h6>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <small>Progression</small>
                  <small className="fw-bold">
                    {Math.round((financialStatus.totalPaid / financialStatus.totalDue) * 100)}%
                  </small>
                </div>
                <ProgressBar 
                  now={(financialStatus.totalPaid / financialStatus.totalDue) * 100} 
                  variant="success"
                />
              </div>
              <ListGroup variant="flush">
                <ListGroup.Item className="d-flex justify-content-between px-0">
                  <span>Total dû</span>
                  <span>{formatCurrency(financialStatus.totalDue)}</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between px-0">
                  <span>Payé</span>
                  <span className="text-success">{formatCurrency(financialStatus.totalPaid)}</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between px-0">
                  <span>Reste</span>
                  <span className="fw-bold text-danger">{formatCurrency(financialStatus.remaining)}</span>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>

        {/* Onglets détails */}
        <Col lg={8}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'informations')} className="mb-4">
                <Tab eventKey="informations" title={<><i className="bi bi-person me-2"></i>Informations</>}>
                  <Row className="g-4">
                    <Col md={6}>
                      <h6 className="text-muted mb-3">Informations personnelles</h6>
                      <Table borderless size="sm">
                        <tbody>
                          <tr>
                            <td className="text-muted" width="40%">Nom complet</td>
                            <td className="fw-medium">{etudiant.prenom} {etudiant.nom}</td>
                          </tr>
                          <tr>
                            <td className="text-muted">Sexe</td>
                            <td>{etudiant.sexe === 'M' ? 'Masculin' : 'Féminin'}</td>
                          </tr>
                          <tr>
                            <td className="text-muted">Date de naissance</td>
                            <td>{etudiant.date_naissance}</td>
                          </tr>
                          <tr>
                            <td className="text-muted">Lieu de naissance</td>
                            <td>{etudiant.lieu_naissance}</td>
                          </tr>
                          <tr>
                            <td className="text-muted">Nationalité</td>
                            <td>{etudiant.nationalite}</td>
                          </tr>
                        </tbody>
                      </Table>
                    </Col>
                    <Col md={6}>
                      <h6 className="text-muted mb-3">Contact</h6>
                      <Table borderless size="sm">
                        <tbody>
                          <tr>
                            <td className="text-muted" width="40%">Téléphone</td>
                            <td>{etudiant.telephone}</td>
                          </tr>
                          <tr>
                            <td className="text-muted">Email</td>
                            <td>{etudiant.email}</td>
                          </tr>
                          <tr>
                            <td className="text-muted">Adresse</td>
                            <td>{etudiant.adresse}</td>
                          </tr>
                        </tbody>
                      </Table>
                    </Col>
                  </Row>
                </Tab>

                <Tab eventKey="notes" title={<><i className="bi bi-graph-up me-2"></i>Notes</>}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0">Notes du semestre en cours</h6>
                    <Badge bg="primary" className="px-3 py-2">
                      Moyenne: {calculateMoyenne()}/20
                    </Badge>
                  </div>
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>Matière</th>
                        <th>Type</th>
                        <th>Note</th>
                        <th>Coefficient</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notes.map((note, index) => (
                        <tr key={index}>
                          <td className="fw-medium">{note.matiere}</td>
                          <td><Badge bg="secondary">{note.type}</Badge></td>
                          <td>
                            <span className={`fw-bold ${note.note >= 10 ? 'text-success' : 'text-danger'}`}>
                              {note.note}/20
                            </span>
                          </td>
                          <td>{note.coefficient}</td>
                          <td className="text-muted">{note.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Tab>

                <Tab eventKey="paiements" title={<><i className="bi bi-credit-card me-2"></i>Paiements</>}>
                  <h6 className="mb-3">Historique des paiements</h6>
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Référence</th>
                        <th className="text-end">Montant</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paiements.map((paiement) => (
                        <tr key={paiement.id}>
                          <td>{paiement.date}</td>
                          <td>{paiement.type}</td>
                          <td><code>{paiement.reference}</code></td>
                          <td className="text-end fw-medium text-success">
                            {formatCurrency(paiement.montant)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="table-light">
                        <td colSpan={3} className="fw-bold">Total payé</td>
                        <td className="text-end fw-bold text-success">
                          {formatCurrency(financialStatus.totalPaid)}
                        </td>
                      </tr>
                    </tfoot>
                  </Table>
                </Tab>

                <Tab eventKey="documents" title={<><i className="bi bi-folder me-2"></i>Documents</>}>
                  <h6 className="mb-3">Documents de l'étudiant</h6>
                  <ListGroup>
                    <ListGroup.Item className="d-flex justify-content-between align-items-center">
                      <div>
                        <i className="bi bi-file-earmark-pdf text-danger me-2"></i>
                        Certificat de scolarité 2024-2025
                      </div>
                      <Button size="sm" variant="outline-primary">
                        <i className="bi bi-download"></i>
                      </Button>
                    </ListGroup.Item>
                    <ListGroup.Item className="d-flex justify-content-between align-items-center">
                      <div>
                        <i className="bi bi-file-earmark-pdf text-danger me-2"></i>
                        Bulletin S1 2024-2025
                      </div>
                      <Button size="sm" variant="outline-primary">
                        <i className="bi bi-download"></i>
                      </Button>
                    </ListGroup.Item>
                    <ListGroup.Item className="d-flex justify-content-between align-items-center">
                      <div>
                        <i className="bi bi-file-earmark-image text-primary me-2"></i>
                        Photo d'identité
                      </div>
                      <Button size="sm" variant="outline-primary">
                        <i className="bi bi-download"></i>
                      </Button>
                    </ListGroup.Item>
                  </ListGroup>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default EtudiantDetailsPage;
