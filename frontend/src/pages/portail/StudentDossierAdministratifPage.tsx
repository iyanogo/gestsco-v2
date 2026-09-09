import React, { useEffect, useState } from 'react';

import { Alert, Badge, Card, Spinner, Table } from 'react-bootstrap';

import { Link } from 'react-router-dom';

import { PageHeader } from '../../components/layouts';

import portalService from '../../services/portalService';

import type { DocumentEtudiant } from '../../types/etudiant';



const STATUT_LABEL: Record<string, string> = {

  en_attente: 'En attente de validation',

  valide: 'Validé',

  refuse: 'Refusé',

};



const STATUT_VARIANT: Record<string, string> = {

  en_attente: 'warning',

  valide: 'success',

  refuse: 'danger',

};



const StudentDossierAdministratifPage: React.FC = () => (

  <StudentDossierContent />

);



const StudentDossierContent: React.FC = () => {

  const [documents, setDocuments] = useState<DocumentEtudiant[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);



  useEffect(() => {

    const load = async () => {

      try {

        setLoading(true);

        setError(null);

        const data = await portalService.getMesDocuments();

        setDocuments(data);

      } catch (err: unknown) {

        const message =

          err && typeof err === 'object' && 'response' in err

            ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail

            : null;

        setError(typeof message === 'string' ? message : 'Impossible de charger votre dossier.');

      } finally {

        setLoading(false);

      }

    };

    load();

  }, []);



  return (

    <div className="fade-in">

      <PageHeader

        title="Mon dossier administratif"

        subtitle="Documents déposés pour votre inscription (lecture seule)"

        breadcrumbs={[

          { label: 'Mes documents', path: '/etudiant/documents' },

          { label: 'Dossier administratif' },

        ]}

      />



      {loading && (

        <div className="text-center py-5">

          <Spinner animation="border" variant="primary" />

        </div>

      )}



      {error && <Alert variant="danger">{error}</Alert>}



      {!loading && !error && (

        <Card className="border-0 shadow-sm">

          <Card.Body className="p-0">

            {documents.length === 0 ? (

              <p className="text-muted p-4 mb-0">

                Aucun document enregistré. Contactez la scolarité pour déposer vos pièces

                justificatives.

              </p>

            ) : (

              <Table responsive hover className="mb-0">

                <thead>

                  <tr>

                    <th>Type</th>

                    <th>Libellé</th>

                    <th>Statut</th>

                    <th>Commentaire</th>

                  </tr>

                </thead>

                <tbody>

                  {documents.map((doc) => (

                    <tr key={doc.id}>

                      <td>{doc.type_document}</td>

                      <td>{doc.libelle}</td>

                      <td>

                        <Badge bg={STATUT_VARIANT[doc.statut] || 'secondary'}>

                          {STATUT_LABEL[doc.statut] || doc.statut}

                        </Badge>

                      </td>

                      <td>{doc.commentaire || '-'}</td>

                    </tr>

                  ))}

                </tbody>

              </Table>

            )}

          </Card.Body>

        </Card>

      )}



      <div className="mt-3">

        <Link to="/etudiant/documents" className="btn btn-outline-secondary btn-sm">

          ← Retour aux documents

        </Link>

      </div>

    </div>

  );

};



export default StudentDossierAdministratifPage;

