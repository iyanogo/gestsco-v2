import React, { useEffect, useState } from 'react';

import { Alert, Badge, Card, Spinner, Table } from 'react-bootstrap';

import { Link } from 'react-router-dom';

import { PageHeader } from '../../../components/layouts';

import { DataCard, SearchFilter } from '../../../components/ui';

import { getDocuments } from '../../../services/documentEtudiantService';

import type { DocumentEtudiant } from '../../../types/etudiant';



const STATUT_VARIANT: Record<string, string> = {

  en_attente: 'warning',

  valide: 'success',

  refuse: 'danger',

};



const DocumentsListPage: React.FC = () => {

  const [documents, setDocuments] = useState<DocumentEtudiant[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [searchValue, setSearchValue] = useState('');

  const [filterValues, setFilterValues] = useState<Record<string, string>>({});



  useEffect(() => {

    loadData();

  }, []);



  const loadData = async () => {

    setLoading(true);

    setError(null);

    try {

      const data = await getDocuments({ limit: 300, statut: filterValues.statut || undefined });

      setDocuments(data);

    } catch (err) {

      console.error(err);

      setError('Impossible de charger les documents administratifs.');

    } finally {

      setLoading(false);

    }

  };



  const filtered = documents.filter((doc) => {

    const q = searchValue.toLowerCase();

    const matchSearch =

      !q ||

      doc.libelle.toLowerCase().includes(q) ||

      doc.type_document.toLowerCase().includes(q) ||

      String(doc.etudiant_id).includes(q);

    const matchStatut = !filterValues.statut || doc.statut === filterValues.statut;

    return matchSearch && matchStatut;

  });



  return (

    <div className="fade-in">

      <PageHeader

        title="Documents administratifs"

        subtitle="Dossiers déposés par les étudiants (acte de naissance, bac, photo…)"

        breadcrumbs={[

          { label: 'Documents', path: '/admin/documents/liste' },

          { label: 'Dossiers' },

        ]}

        actions={

          <Link to="/admin/documents/templates" className="btn btn-outline-primary">

            <i className="bi bi-file-earmark-code me-2"></i>

            Templates PDF

          </Link>

        }

      />



      {error && (

        <Alert variant="danger" dismissible onClose={() => setError(null)}>

          {error}

        </Alert>

      )}



      <Alert variant="info" className="mb-4">

        <i className="bi bi-info-circle me-2"></i>

        L&apos;historique des <strong>documents générés</strong> (bulletins, attestations produits

        automatiquement) reste hors scope - consultez les modules Résultats et Templates.

      </Alert>



      <DataCard

        title={`Documents déposés (${filtered.length})`}

        actions={

          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={loadData}>

            <i className="bi bi-arrow-clockwise me-1"></i>

            Actualiser

          </button>

        }

      >

        <SearchFilter

          searchValue={searchValue}

          onSearchChange={setSearchValue}

          searchPlaceholder="Rechercher par libellé, type, étudiant…"

          filters={[

            {

              key: 'statut',

              label: 'Tous les statuts',

              type: 'select',

              options: [

                { value: 'en_attente', label: 'En attente' },

                { value: 'valide', label: 'Validé' },

                { value: 'refuse', label: 'Refusé' },

              ],

            },

          ]}

          filterValues={filterValues}

          onFilterChange={(key, value) => setFilterValues({ ...filterValues, [key]: value })}

          onReset={() => {

            setSearchValue('');

            setFilterValues({});

          }}

        />



        {loading ? (

          <div className="text-center py-5">

            <Spinner animation="border" variant="primary" />

          </div>

        ) : filtered.length === 0 ? (

          <p className="text-muted mb-0 py-4 text-center">Aucun document trouvé.</p>

        ) : (

          <Table responsive hover className="mb-0">

            <thead>

              <tr>

                <th>Étudiant</th>

                <th>Type</th>

                <th>Libellé</th>

                <th>Statut</th>

                <th>Dépôt</th>

                <th></th>

              </tr>

            </thead>

            <tbody>

              {filtered.map((doc) => (

                <tr key={doc.id}>

                  <td>

                    <Link to={`/admin/etudiants/${doc.etudiant_id}`}>#{doc.etudiant_id}</Link>

                  </td>

                  <td>{doc.type_document}</td>

                  <td>{doc.libelle}</td>

                  <td>

                    <Badge bg={STATUT_VARIANT[doc.statut] || 'secondary'}>{doc.statut}</Badge>

                  </td>

                  <td>{new Date(doc.created_at).toLocaleDateString('fr-FR')}</td>

                  <td>

                    {doc.fichier_url && (

                      <a href={doc.fichier_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary">

                        <i className="bi bi-download"></i>

                      </a>

                    )}

                  </td>

                </tr>

              ))}

            </tbody>

          </Table>

        )}

      </DataCard>

    </div>

  );

};



export default DocumentsListPage;

