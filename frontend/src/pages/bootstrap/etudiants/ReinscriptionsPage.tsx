import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {

  Container, Row, Col, Card, Table, Button, Form, InputGroup, Badge, Modal, Alert, Spinner,

} from 'react-bootstrap';

import { AxiosError } from 'axios';

import { getEtudiants } from '../../../services/etudiantService';

import { createInscription, getInscriptions } from '../../../services/inscriptionService';

import { getFilieres } from '../../../services/filiereService';

import { getNiveaux } from '../../../services/niveauService';

import { anneeAcademiqueService } from '../../../services/anneeAcademiqueService';

import { resultatService } from '../../../services/resultatService';

import { handleApiError } from '../../../utils/errorHandler';

import {

  resolveReinscriptionDecision,

  type ReinscriptionStatut,

  type DecisionSource,

} from '../../../utils/reinscriptionDecision';

import type { Etudiant, Inscription } from '../../../types/etudiant';

import type { Filiere, Niveau } from '../../../types/reference';

import type { AnneeAcademique } from '../../../types/anneeAcademique';

import {

  DECISION_LABELS,

  type DecisionResultat,

  type ResultatAnnuel,

} from '../../../types/evaluation';



type DecisionDisplay = DecisionResultat | 'exclu' | '-';



interface ReinscriptionRow {

  id: number;

  matricule: string;

  nom: string;

  prenom: string;

  filiere: string;

  filiereId?: number;

  niveauActuel: string;

  niveauActuelId?: number;

  niveauSuivant: string;

  niveauSuivantId?: number;

  moyenne: number | null;

  decision: DecisionDisplay;

  reinscriptionStatut: ReinscriptionStatut;

  fraisPaye: boolean;

  lastInscriptionId?: number;

  decisionSource: DecisionSource;

  isEstimation: boolean;

  blockReinscription: boolean;

  blockReason?: string;

}



const extractErrorMessage = (error: unknown): string => {

  if (error instanceof AxiosError && Array.isArray(error.response?.data?.detail)) {

    return error.response.data.detail

      .map((item: { msg?: string }) => item.msg)

      .filter(Boolean)

      .join(', ');

  }

  return handleApiError(error);

};



const getNiveauLabel = (niveaux: Niveau[], id?: number): string => {

  if (!id) return '-';

  const niveau = niveaux.find((n) => n.id === id);

  return niveau?.libelle || niveau?.code || '-';

};



const getFiliereLabel = (filieres: Filiere[], id?: number): string => {

  if (!id) return '-';

  const filiere = filieres.find((f) => f.id === id);

  return filiere?.libelle || filiere?.code || '-';

};



const buildRows = (

  etudiants: Etudiant[],

  inscriptions: Inscription[],

  filieres: Filiere[],

  niveaux: Niveau[],

  activeYearCode: string,

  resultatByInscriptionId: Map<number, ResultatAnnuel>,

): ReinscriptionRow[] => {

  const byEtudiant = inscriptions.reduce<Record<number, Inscription[]>>((acc, ins) => {

    if (!acc[ins.etudiant_id]) acc[ins.etudiant_id] = [];

    acc[ins.etudiant_id].push(ins);

    return acc;

  }, {});



  return etudiants.map((etudiant) => {

    const studentInscriptions = byEtudiant[etudiant.id] || [];

    const activeInscription = studentInscriptions.find(

      (i) => i.annee_academique === activeYearCode && i.statut_inscription !== 'annulee',

    );

    const pastInscriptions = studentInscriptions

      .filter((i) => i.annee_academique !== activeYearCode && i.statut_inscription !== 'annulee')

      .sort((a, b) => (b.annee_academique || '').localeCompare(a.annee_academique || ''));



    const lastPast = pastInscriptions[0];

    const resultatAnnuel = lastPast

      ? resultatByInscriptionId.get(lastPast.id)

      : undefined;



    const resolved = resolveReinscriptionDecision({

      etudiant,

      activeInscription,

      lastPastInscription: lastPast,

      resultatAnnuel,

      niveaux,

    });



    const fraisPaye = activeInscription

      ? (activeInscription.frais_payes ?? 0) >= (activeInscription.frais_inscription ?? 0)

      : false;



    return {

      id: etudiant.id,

      matricule: etudiant.matricule || '-',

      nom: etudiant.nom,

      prenom: etudiant.prenom,

      filiere: getFiliereLabel(filieres, resolved.filiereId),

      filiereId: resolved.filiereId,

      niveauActuel: getNiveauLabel(niveaux, resolved.niveauActuelId),

      niveauActuelId: resolved.niveauActuelId,

      niveauSuivant: getNiveauLabel(niveaux, resolved.niveauSuivantId),

      niveauSuivantId: resolved.niveauSuivantId,

      moyenne: resolved.moyenne,

      decision: resolved.decision,

      reinscriptionStatut: resolved.reinscriptionStatut,

      fraisPaye,

      lastInscriptionId: resolved.lastInscriptionId,

      decisionSource: resolved.source,

      isEstimation: resolved.isEstimation,

      blockReinscription: resolved.blockReinscription,

      blockReason: resolved.blockReason,

    };

  });

};



const ReinscriptionsPage: React.FC = () => {

  const [etudiants, setEtudiants] = useState<ReinscriptionRow[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [actionLoading, setActionLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');

  const [filterStatut, setFilterStatut] = useState('');

  const [filterFiliere, setFilterFiliere] = useState('');

  const [showModal, setShowModal] = useState(false);

  const [selectedEtudiant, setSelectedEtudiant] = useState<ReinscriptionRow | null>(null);

  const [activeAnnee, setActiveAnnee] = useState<AnneeAcademique | null>(null);



  const inscriptionsAllowed = activeAnnee?.statut === 'ouverte';



  const loadData = useCallback(async () => {

    setLoading(true);

    setError(null);

    try {

      const [etudiantData, inscriptionData, filiereData, niveauData, anneeData] = await Promise.all([

        getEtudiants({ limit: 500 }),

        getInscriptions({ limit: 500 }),

        getFilieres(),

        getNiveaux(),

        anneeAcademiqueService.getActiveAnnee(),

      ]);



      setActiveAnnee(anneeData);



      const yearCode = anneeData?.code || anneeData?.libelle || '';



      const pastInscriptionIds = new Set<number>();

      const etudiantIdsForResults = new Set<number>();

      inscriptionData.forEach((ins) => {

        if (ins.annee_academique !== yearCode && ins.statut_inscription !== 'annulee') {

          pastInscriptionIds.add(ins.id);

          etudiantIdsForResults.add(ins.etudiant_id);

        }

      });



      const resultatByInscriptionId = new Map<number, ResultatAnnuel>();

      await Promise.all(

        [...etudiantIdsForResults].map(async (etudiantId) => {

          try {

            const annuels = await resultatService.getResultatsAnnuels(etudiantId);

            annuels.forEach((ra) => {

              if (pastInscriptionIds.has(ra.inscription_id)) {

                resultatByInscriptionId.set(ra.inscription_id, ra);

              }

            });

          } catch {

            // Pas de résultats pour cet étudiant - repli heuristique

          }

        }),

      );



      const rows = buildRows(

        etudiantData,

        inscriptionData,

        filiereData,

        niveauData,

        yearCode,

        resultatByInscriptionId,

      );

      setEtudiants(rows);

    } catch (err) {

      setError(extractErrorMessage(err));

    } finally {

      setLoading(false);

    }

  }, []);



  useEffect(() => {

    loadData();

  }, [loadData]);



  const filieresOptions = useMemo(

    () => [...new Set(etudiants.map((e) => e.filiere).filter((f) => f && f !== '-'))],

    [etudiants],

  );



  const filteredEtudiants = useMemo(() => {

    return etudiants.filter((e) => {

      const matchSearch = `${e.nom} ${e.prenom} ${e.matricule}`.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatut = !filterStatut || e.reinscriptionStatut === filterStatut;

      const matchFiliere = !filterFiliere || e.filiere === filterFiliere;

      return matchSearch && matchStatut && matchFiliere;

    });

  }, [etudiants, searchTerm, filterStatut, filterFiliere]);



  const handleReinscrire = async () => {

    if (!selectedEtudiant || !activeAnnee) return;



    if (selectedEtudiant.blockReinscription) {

      setError(selectedEtudiant.blockReason || 'Réinscription impossible pour cet étudiant.');

      return;

    }



    const yearCode = activeAnnee.code || activeAnnee.libelle;

    if (!inscriptionsAllowed) {

      setError('Aucune année académique ouverte - les réinscriptions sont bloquées.');

      return;

    }



    setActionLoading(true);

    setError(null);

    try {

      const isRedoublement = selectedEtudiant.niveauSuivantId === selectedEtudiant.niveauActuelId;

      await createInscription({

        etudiant_id: selectedEtudiant.id,

        filiere_id: selectedEtudiant.filiereId,

        niveau_id: selectedEtudiant.niveauSuivantId,

        annee_academique: yearCode,

        type_inscription: isRedoublement ? 'redoublement' : 'nouvelle',

      });

      setShowModal(false);

      setSelectedEtudiant(null);

      await loadData();

    } catch (err) {

      setError(extractErrorMessage(err));

    } finally {

      setActionLoading(false);

    }

  };



  const getDecisionBadge = (row: ReinscriptionRow) => {

    const { decision, isEstimation, decisionSource } = row;

    if (decision === '-') return <Badge bg="secondary">N/A</Badge>;



    const label =

      decision === 'exclu'

        ? 'Exclu'

        : DECISION_LABELS[decision as DecisionResultat] || decision;



    const variant =

      decision === 'admis'

        ? 'success'

        : decision === 'admis_avec_dette'

          ? 'info'

          : decision === 'ajourne' || decision === 'redouble'

            ? 'warning'

            : decision === 'exclus' || decision === 'exclu'

              ? 'danger'

              : 'secondary';



    return (

      <span className="d-inline-flex flex-column align-items-center gap-1">

        <Badge bg={variant}>{label}</Badge>

        {decisionSource === 'deliberation' && (

          <small className="text-muted">Délibération</small>

        )}

        {isEstimation && (

          <small className="text-warning">Estimation</small>

        )}

      </span>

    );

  };



  const getStatutBadge = (statut: ReinscriptionStatut) => {

    switch (statut) {

      case 'reinscrit': return <Badge bg="success">Réinscrit</Badge>;

      case 'eligible': return <Badge bg="info">Éligible</Badge>;

      case 'non_eligible': return <Badge bg="secondary">Non éligible</Badge>;

      default: return <Badge bg="secondary">{statut}</Badge>;

    }

  };



  const formatMoyenne = (value: number | null) =>

    value != null ? value.toFixed(2) : '-';



  const stats = {

    total: etudiants.length,

    reinscrits: etudiants.filter((e) => e.reinscriptionStatut === 'reinscrit').length,

    eligibles: etudiants.filter((e) => e.reinscriptionStatut === 'eligible').length,

    nonEligibles: etudiants.filter((e) => e.reinscriptionStatut === 'non_eligible').length,

  };



  if (loading) {

    return (

      <Container fluid className="py-5 text-center">

        <Spinner animation="border" variant="primary" />

      </Container>

    );

  }



  return (

    <Container fluid className="py-4">

      <Row className="mb-4">

        <Col>

          <div className="d-flex justify-content-between align-items-center">

            <div>

              <h2 className="mb-1 fw-bold">Réinscriptions</h2>

              <p className="text-muted mb-0">

                {activeAnnee

                  ? `Année cible : ${activeAnnee.libelle || activeAnnee.code} (${activeAnnee.statut})`

                  : 'Aucune année académique active configurée'}

              </p>

            </div>

          </div>

        </Col>

      </Row>



      {error && (

        <Alert variant="danger" dismissible onClose={() => setError(null)}>

          {error}

        </Alert>

      )}



      {!activeAnnee && (

        <Alert variant="warning">

          Aucune année académique active. Configurez une année dans la gestion LMD avant de réinscrire.

        </Alert>

      )}



      {activeAnnee && !inscriptionsAllowed && (

        <Alert variant="warning">

          L&apos;année <strong>{activeAnnee.libelle || activeAnnee.code}</strong> n&apos;est pas ouverte

          (statut : {activeAnnee.statut}). Les réinscriptions sont désactivées.

        </Alert>

      )}



      <Alert variant="info" className="mb-4">

        Passage de niveau basé sur <code>ResultatAnnuel</code> validé (

        <code>decision</code>, <code>passage_niveau_superieur</code>, <code>is_valide=true</code>).

        En l&apos;absence de délibération officialisée, une estimation locale (niveau suivant

        référentiel) s&apos;affiche clairement comme telle.

      </Alert>



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

          <Card className="border-0 shadow-sm bg-secondary text-white">

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

              <Form.Select value={filterFiliere} onChange={(e) => setFilterFiliere(e.target.value)}>

                <option value="">Toutes les filières</option>

                {filieresOptions.map((f) => <option key={f} value={f}>{f}</option>)}

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

              {filteredEtudiants.length === 0 ? (

                <tr>

                  <td colSpan={9} className="text-center text-muted py-4">Aucun étudiant trouvé</td>

                </tr>

              ) : (

                filteredEtudiants.map((etudiant) => (

                  <tr key={etudiant.id}>

                    <td className="px-4 py-3"><span className="fw-semibold text-primary">{etudiant.matricule}</span></td>

                    <td className="py-3"><div className="fw-semibold">{etudiant.nom} {etudiant.prenom}</div></td>

                    <td className="py-3">{etudiant.filiere}</td>

                    <td className="py-3 text-center"><Badge bg="secondary">{etudiant.niveauActuel}</Badge></td>

                    <td className="py-3 text-center">

                      {etudiant.niveauSuivant !== '-'

                        ? <Badge bg="primary">{etudiant.niveauSuivant}</Badge>

                        : <span className="text-muted">-</span>}

                    </td>

                    <td className="py-3 text-center">{formatMoyenne(etudiant.moyenne)}</td>

                    <td className="py-3 text-center">{getDecisionBadge(etudiant)}</td>

                    <td className="py-3 text-center">{getStatutBadge(etudiant.reinscriptionStatut)}</td>

                    <td className="py-3 text-end px-4">

                      {etudiant.reinscriptionStatut === 'eligible' && !etudiant.blockReinscription && (

                        <Button

                          variant="success"

                          size="sm"

                          disabled={!inscriptionsAllowed}

                          onClick={() => { setSelectedEtudiant(etudiant); setShowModal(true); }}

                        >

                          <i className="bi bi-check-lg me-1"></i>Réinscrire

                        </Button>

                      )}

                      {etudiant.reinscriptionStatut === 'eligible' && etudiant.blockReinscription && (

                        <small className="text-danger">{etudiant.blockReason || 'Bloqué'}</small>

                      )}

                      {etudiant.reinscriptionStatut === 'non_eligible' && etudiant.blockReason && (

                        <small className="text-muted d-block" style={{ maxWidth: 180 }}>{etudiant.blockReason}</small>

                      )}

                      {etudiant.reinscriptionStatut === 'reinscrit' && (

                        <Badge bg="light" text="dark">{etudiant.fraisPaye ? 'Frais OK' : 'Frais en attente'}</Badge>

                      )}

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </Table>

        </Card.Body>

      </Card>



      <Modal show={showModal} onHide={() => !actionLoading && setShowModal(false)}>

        <Modal.Header closeButton>

          <Modal.Title>Confirmer la réinscription</Modal.Title>

        </Modal.Header>

        <Modal.Body>

          {selectedEtudiant && activeAnnee && (

            <>

              {selectedEtudiant.isEstimation && (

                <Alert variant="warning" className="py-2">

                  Passage estimé (aucune délibération validée) - à confirmer avant validation définitive.

                </Alert>

              )}

              <p>Voulez-vous réinscrire l&apos;étudiant suivant pour <strong>{activeAnnee.libelle || activeAnnee.code}</strong> ?</p>

              <Card className="bg-light border-0">

                <Card.Body>

                  <p className="mb-1"><strong>Matricule:</strong> {selectedEtudiant.matricule}</p>

                  <p className="mb-1"><strong>Nom:</strong> {selectedEtudiant.nom} {selectedEtudiant.prenom}</p>

                  <p className="mb-1"><strong>Filière:</strong> {selectedEtudiant.filiere}</p>

                  <p className="mb-1"><strong>Passage:</strong> {selectedEtudiant.niveauActuel} → {selectedEtudiant.niveauSuivant}</p>

                  {selectedEtudiant.moyenne != null && (

                    <p className="mb-1"><strong>Moyenne annuelle:</strong> {formatMoyenne(selectedEtudiant.moyenne)}/20</p>

                  )}

                  <p className="mb-0">

                    <strong>Type:</strong>{' '}

                    {selectedEtudiant.niveauSuivantId === selectedEtudiant.niveauActuelId

                      ? 'Redoublement'

                      : selectedEtudiant.decision === 'admis_avec_dette'

                        ? 'Passage niveau supérieur (avec dettes)'

                        : 'Passage niveau supérieur'}

                  </p>

                </Card.Body>

              </Card>

            </>

          )}

        </Modal.Body>

        <Modal.Footer>

          <Button variant="secondary" onClick={() => setShowModal(false)} disabled={actionLoading}>Annuler</Button>

          <Button variant="success" onClick={handleReinscrire} disabled={actionLoading || !inscriptionsAllowed}>

            {actionLoading ? (

              <><Spinner animation="border" size="sm" className="me-2" />En cours...</>

            ) : (

              <><i className="bi bi-check-lg me-2"></i>Confirmer la réinscription</>

            )}

          </Button>

        </Modal.Footer>

      </Modal>

    </Container>

  );

};



export default ReinscriptionsPage;


