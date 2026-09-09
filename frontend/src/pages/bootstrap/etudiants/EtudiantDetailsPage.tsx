import React, { useState, useEffect, useMemo } from 'react';

import { Row, Col, Card, Button, Badge, Tab, Tabs, Table, ListGroup, ProgressBar, Alert } from 'react-bootstrap';

import { Link, useParams } from 'react-router-dom';

import { PageHeader } from '../../../components/layouts';

import { Avatar } from '../../../components/ui';

import { usePermissions } from '../../../hooks/usePermissions';

import { getEtudiantDetails } from '../../../services/etudiantService';

import { getFilieres } from '../../../services/filiereService';

import { getNiveaux } from '../../../services/niveauService';

import bulletinService from '../../../services/bulletinService';

import paiementFactureService from '../../../services/paiementFactureService';

import factureService from '../../../services/factureService';

import { handleApiError } from '../../../utils/errorHandler';

import type { EtudiantWithDetails } from '../../../types/etudiant';

import type { ReleveNotes } from '../../../types/evaluation';

import type { Paiement as PaiementFacture, Facture } from '../../../types/finance';



interface FinancialSummary {

  totalDue: number;

  totalPaid: number;

  remaining: number;

}



const formatDate = (value?: string | null): string => {

  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('fr-FR');

};



const formatModePaiement = (mode: string): string => {

  const labels: Record<string, string> = {

    especes: 'Espèces',

    cheque: 'Chèque',

    virement: 'Virement',

    mobile_money: 'Mobile money',

    carte: 'Carte bancaire',

  };

  return labels[mode] || mode;

};



const EtudiantDetailsPage: React.FC = () => {

  const { id } = useParams<{ id: string }>();

  const { moduleActions } = usePermissions();

  const { canUpdate } = moduleActions('etudiants');



  const [etudiant, setEtudiant] = useState<EtudiantWithDetails | null>(null);

  const [filiereLabel, setFiliereLabel] = useState('-');

  const [niveauLabel, setNiveauLabel] = useState('-');

  const [dateInscription, setDateInscription] = useState('-');

  const [releve, setReleve] = useState<ReleveNotes | null>(null);

  const [paiements, setPaiements] = useState<PaiementFacture[]>([]);

  const [factures, setFactures] = useState<Facture[]>([]);

  const [notesError, setNotesError] = useState<string | null>(null);

  const [financeError, setFinanceError] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState('informations');



  useEffect(() => {

    loadData();

  }, [id]);



  const loadData = async () => {

    if (!id) return;

    const etudiantId = parseInt(id, 10);

    setLoading(true);

    setError(null);

    setNotesError(null);

    setFinanceError(null);



    try {

      const [details, filieres, niveaux, releveData, paiementsData, facturesData] = await Promise.all([

        getEtudiantDetails(etudiantId),

        getFilieres(),

        getNiveaux(),

        bulletinService.getReleveNotes(etudiantId).catch((err) => {

          setNotesError(handleApiError(err));

          return null;

        }),

        paiementFactureService.getPaiementsEtudiant(etudiantId).catch((err) => {

          setFinanceError(handleApiError(err));

          return [] as PaiementFacture[];

        }),

        factureService.getFacturesEtudiant(etudiantId).catch((err) => {

          setFinanceError((prev) => prev || handleApiError(err));

          return [] as Facture[];

        }),

      ]);



      setEtudiant(details);

      setReleve(releveData);

      setPaiements(paiementsData);

      setFactures(facturesData);



      const latestInscription = [...(details.inscriptions || [])].sort((a, b) => {

        const dateA = a.date_inscription || a.created_at || '';

        const dateB = b.date_inscription || b.created_at || '';

        return dateB.localeCompare(dateA);

      })[0];



      if (latestInscription) {

        const filiere = filieres.find((f) => f.id === latestInscription.filiere_id);

        const niveau = niveaux.find((n) => n.id === latestInscription.niveau_id);

        setFiliereLabel(filiere?.libelle || filiere?.code || '-');

        setNiveauLabel(niveau?.libelle || niveau?.code || '-');

        setDateInscription(latestInscription.date_inscription || '-');

      }

    } catch (err) {

      setError(handleApiError(err));

    } finally {

      setLoading(false);

    }

  };



  const latestParcours = useMemo(() => {

    if (!releve?.parcours?.length) return null;

    return releve.parcours[releve.parcours.length - 1];

  }, [releve]);



  const matieresNotes = latestParcours?.matieres ?? [];



  const moyenneGenerale = useMemo(() => {

    const moyenneAnnuelle = latestParcours?.resultat_annuel?.moyenne;

    if (moyenneAnnuelle != null) return moyenneAnnuelle.toFixed(2);



    const dernierSemestre = latestParcours?.semestres?.[latestParcours.semestres.length - 1];

    if (dernierSemestre?.moyenne != null) return dernierSemestre.moyenne.toFixed(2);



    const notesValides = matieresNotes.filter((m) => m.moyenne != null);

    if (notesValides.length === 0) return null;

    const sum = notesValides.reduce((acc, m) => acc + (m.moyenne ?? 0), 0);

    return (sum / notesValides.length).toFixed(2);

  }, [latestParcours, matieresNotes]);



  const financialStatus: FinancialSummary = useMemo(() => {

    if (factures.length > 0) {

      return factures.reduce(

        (acc, f) => ({

          totalDue: acc.totalDue + f.montant_total,

          totalPaid: acc.totalPaid + f.montant_paye,

          remaining: acc.remaining + f.montant_restant,

        }),

        { totalDue: 0, totalPaid: 0, remaining: 0 }

      );

    }

    const totalPaid = paiements

      .filter((p) => p.statut === 'valide' || p.statut === 'en_attente')

      .reduce((sum, p) => sum + p.montant, 0);

    return { totalDue: totalPaid, totalPaid, remaining: 0 };

  }, [factures, paiements]);



  const progressionPct = financialStatus.totalDue > 0

    ? Math.round((financialStatus.totalPaid / financialStatus.totalDue) * 100)

    : 0;



  const formatCurrency = (amount: number) => {

    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';

  };



  if (loading) {

    return (

      <div className="text-center py-5">

        <div className="spinner-border text-primary" role="status">

          <span className="visually-hidden">Chargement...</span>

        </div>

      </div>

    );

  }



  if (error || !etudiant) {

    return (

      <div className="fade-in">

        <PageHeader

          title="Détails de l'étudiant"

          breadcrumbs={[{ label: 'Étudiants', path: '/admin/etudiants' }, { label: 'Erreur' }]}

        />

        <Alert variant="danger">{error || 'Étudiant introuvable.'}</Alert>

        <Link to="/admin/etudiants" className="btn btn-outline-secondary">Retour à la liste</Link>

      </div>

    );

  }



  const statutLabel = etudiant.statut || 'actif';

  const isInscrit = (etudiant.inscriptions || []).some((i) => i.statut_inscription === 'validee');



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

            {canUpdate ? (

              <Link to={`/admin/etudiants/${etudiant.id}/edit`} className="btn btn-primary">

                <i className="bi bi-pencil me-2"></i>

                Modifier

              </Link>

            ) : (

              <Button variant="primary" disabled title="Permission insuffisante">

                <i className="bi bi-pencil me-2"></i>

                Modifier

              </Button>

            )}

          </div>

        }

      />



      <Row className="g-4">

        <Col lg={4}>

          <Card className="border-0 shadow-sm">

            <Card.Body className="text-center p-4">

              <Avatar name={`${etudiant.prenom} ${etudiant.nom}`} size="xl" className="mb-3" />

              <h4 className="mb-1">{etudiant.prenom} {etudiant.nom}</h4>

              <p className="text-muted mb-3">

                <code>{etudiant.matricule}</code>

              </p>

              <Badge bg={isInscrit ? 'success' : 'warning'} className="mb-3 px-3 py-2">

                {isInscrit ? 'Inscrit' : statutLabel}

              </Badge>



              <hr />



              <ListGroup variant="flush" className="text-start">

                <ListGroup.Item className="d-flex justify-content-between px-0">

                  <span className="text-muted">Filière</span>

                  <span className="fw-medium">{filiereLabel}</span>

                </ListGroup.Item>

                <ListGroup.Item className="d-flex justify-content-between px-0">

                  <span className="text-muted">Niveau</span>

                  <Badge bg="primary">{niveauLabel}</Badge>

                </ListGroup.Item>

                <ListGroup.Item className="d-flex justify-content-between px-0">

                  <span className="text-muted">Moyenne</span>

                  <span className="fw-bold text-success">

                    {moyenneGenerale != null ? `${moyenneGenerale}/20` : '-'}

                  </span>

                </ListGroup.Item>

                <ListGroup.Item className="d-flex justify-content-between px-0">

                  <span className="text-muted">Inscrit depuis</span>

                  <span>{dateInscription}</span>

                </ListGroup.Item>

              </ListGroup>

            </Card.Body>

          </Card>



          <Card className="border-0 shadow-sm mt-4">

            <Card.Header className="bg-white">

              <h6 className="mb-0">

                <i className="bi bi-wallet2 me-2"></i>

                Situation financière

              </h6>

            </Card.Header>

            <Card.Body>

              {financeError && (

                <Alert variant="warning" className="py-2 small mb-3">{financeError}</Alert>

              )}

              {financialStatus.totalDue === 0 && paiements.length === 0 ? (

                <Alert variant="secondary" className="mb-0 py-2">Aucune facture ni paiement enregistré.</Alert>

              ) : (

                <>

                  <div className="mb-3">

                    <div className="d-flex justify-content-between mb-1">

                      <small>Progression</small>

                      <small className="fw-bold">{progressionPct}%</small>

                    </div>

                    <ProgressBar now={progressionPct} variant="success" />

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

                </>

              )}

            </Card.Body>

          </Card>

        </Col>



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

                  {notesError && (

                    <Alert variant="warning" className="mb-3">{notesError}</Alert>

                  )}

                  <div className="d-flex justify-content-between align-items-center mb-3">

                    <h6 className="mb-0">

                      {latestParcours?.annee_academique

                        ? `Résultats - ${latestParcours.annee_academique}`

                        : 'Résultats par matière'}

                    </h6>

                    {moyenneGenerale != null && (

                      <Badge bg="primary" className="px-3 py-2">

                        Moyenne: {moyenneGenerale}/20

                      </Badge>

                    )}

                  </div>

                  {matieresNotes.length === 0 ? (

                    <Alert variant="secondary">Aucune note ou résultat enregistré pour cet étudiant.</Alert>

                  ) : (

                    <Table responsive hover>

                      <thead>

                        <tr>

                          <th>Matière</th>

                          <th>Crédits</th>

                          <th>Moyenne</th>

                          <th>Crédits obtenus</th>

                          <th>Statut</th>

                        </tr>

                      </thead>

                      <tbody>

                        {matieresNotes.map((matiere, index) => (

                          <tr key={`${matiere.code}-${index}`}>

                            <td className="fw-medium">

                              {matiere.libelle || matiere.code || '-'}

                              {matiere.code && (

                                <small className="text-muted d-block">{matiere.code}</small>

                              )}

                            </td>

                            <td>{matiere.credit}</td>

                            <td>

                              {matiere.moyenne != null ? (

                                <span className={`fw-bold ${matiere.moyenne >= 10 ? 'text-success' : 'text-danger'}`}>

                                  {matiere.moyenne.toFixed(2)}/20

                                </span>

                              ) : (

                                '-'

                              )}

                            </td>

                            <td>{matiere.credit_obtenu}</td>

                            <td>

                              <Badge bg={matiere.statut === 'valide' ? 'success' : 'secondary'}>

                                {matiere.statut}

                              </Badge>

                            </td>

                          </tr>

                        ))}

                      </tbody>

                    </Table>

                  )}

                </Tab>



                <Tab eventKey="paiements" title={<><i className="bi bi-credit-card me-2"></i>Paiements</>}>

                  {financeError && (

                    <Alert variant="warning" className="mb-3">{financeError}</Alert>

                  )}

                  <h6 className="mb-3">Historique des paiements</h6>

                  {paiements.length === 0 ? (

                    <Alert variant="secondary">Aucun paiement enregistré.</Alert>

                  ) : (

                    <Table responsive hover>

                      <thead>

                        <tr>

                          <th>Date</th>

                          <th>Mode</th>

                          <th>Référence</th>

                          <th>Statut</th>

                          <th className="text-end">Montant</th>

                        </tr>

                      </thead>

                      <tbody>

                        {paiements.map((paiement) => (

                          <tr key={paiement.id}>

                            <td>{formatDate(paiement.date_paiement)}</td>

                            <td>{formatModePaiement(paiement.mode_paiement)}</td>

                            <td><code>{paiement.numero_paiement || paiement.numero_recu || '-'}</code></td>

                            <td>

                              <Badge bg={paiement.statut === 'valide' ? 'success' : 'secondary'}>

                                {paiement.statut}

                              </Badge>

                            </td>

                            <td className="text-end fw-medium text-success">

                              {formatCurrency(paiement.montant)}

                            </td>

                          </tr>

                        ))}

                      </tbody>

                      <tfoot>

                        <tr className="table-light">

                          <td colSpan={4} className="fw-bold">Total payé (factures)</td>

                          <td className="text-end fw-bold text-success">

                            {formatCurrency(financialStatus.totalPaid)}

                          </td>

                        </tr>

                      </tfoot>

                    </Table>

                  )}

                </Tab>



                <Tab eventKey="documents" title={<><i className="bi bi-folder me-2"></i>Documents</>}>

                  <h6 className="mb-3">Documents de l'étudiant</h6>

                  {(etudiant.documents || []).length === 0 ? (

                    <Alert variant="secondary">Aucun document enregistré.</Alert>

                  ) : (

                    <ListGroup>

                      {etudiant.documents.map((doc) => (

                        <ListGroup.Item key={doc.id} className="d-flex justify-content-between align-items-center">

                          <div>

                            <i className={`bi ${doc.format_fichier?.startsWith('image/') ? 'bi-file-earmark-image text-primary' : 'bi-file-earmark-pdf text-danger'} me-2`}></i>

                            {doc.libelle || doc.type_document}

                            {doc.statut && (

                              <Badge bg="secondary" className="ms-2">{doc.statut}</Badge>

                            )}

                          </div>

                          {doc.fichier_url ? (

                            <Button size="sm" variant="outline-primary" href={doc.fichier_url} target="_blank" rel="noreferrer">

                              <i className="bi bi-download"></i>

                            </Button>

                          ) : (

                            <Badge bg="light" text="dark">Métadonnées</Badge>

                          )}

                        </ListGroup.Item>

                      ))}

                    </ListGroup>

                  )}

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

