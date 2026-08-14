import React, { useState, useEffect } from 'react';
import { Row, Col, Button, Badge, Card } from 'react-bootstrap';
import { PageHeader } from '../../../components/layouts';
import { DataCard, DataTable, SearchFilter, Column } from '../../../components/ui';

interface Document {
  id: number;
  type: 'bulletin' | 'attestation' | 'certificat' | 'releve' | 'facture' | 'recu';
  titre: string;
  etudiant: string;
  matricule: string;
  dateGeneration: string;
  statut: 'genere' | 'en_attente' | 'erreur';
  taille: string;
}

const DocumentsListPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setTimeout(() => {
      setDocuments([
        { id: 1, type: 'bulletin', titre: 'Bulletin S1 2025-2026', etudiant: 'Amadou DIALLO', matricule: '2024-0125', dateGeneration: '06/01/2026 14:30', statut: 'genere', taille: '245 Ko' },
        { id: 2, type: 'attestation', titre: 'Attestation d\'inscription', etudiant: 'Fatou TRAORE', matricule: '2024-0126', dateGeneration: '05/01/2026 10:15', statut: 'genere', taille: '128 Ko' },
        { id: 3, type: 'certificat', titre: 'Certificat de scolarité', etudiant: 'Ibrahim KONE', matricule: '2024-0127', dateGeneration: '04/01/2026 16:45', statut: 'genere', taille: '156 Ko' },
        { id: 4, type: 'releve', titre: 'Relevé de notes S1', etudiant: 'Aïcha OUEDRAOGO', matricule: '2024-0128', dateGeneration: '03/01/2026 09:00', statut: 'en_attente', taille: '-' },
        { id: 5, type: 'facture', titre: 'Facture 2025-2026', etudiant: 'Moussa SANOGO', matricule: '2024-0129', dateGeneration: '02/01/2026 11:30', statut: 'genere', taille: '98 Ko' },
        { id: 6, type: 'recu', titre: 'Reçu de paiement', etudiant: 'Mariama BARRY', matricule: '2024-0130', dateGeneration: '01/01/2026 08:00', statut: 'genere', taille: '85 Ko' },
        { id: 7, type: 'bulletin', titre: 'Bulletin S1 2025-2026', etudiant: 'Seydou COULIBALY', matricule: '2024-0131', dateGeneration: '06/01/2026 15:00', statut: 'erreur', taille: '-' },
      ]);
      setLoading(false);
    }, 500);
  };

  const getTypeBadge = (type: string) => {
    const config: Record<string, { bg: string; icon: string; label: string }> = {
      bulletin: { bg: 'primary', icon: 'file-earmark-text', label: 'Bulletin' },
      attestation: { bg: 'success', icon: 'file-earmark-check', label: 'Attestation' },
      certificat: { bg: 'info', icon: 'award', label: 'Certificat' },
      releve: { bg: 'warning', icon: 'file-earmark-spreadsheet', label: 'Relevé' },
      facture: { bg: 'danger', icon: 'receipt', label: 'Facture' },
      recu: { bg: 'secondary', icon: 'cash-stack', label: 'Reçu' }
    };
    const c = config[type] || { bg: 'secondary', icon: 'file', label: type };
    return (
      <Badge bg={c.bg}>
        <i className={`bi bi-${c.icon} me-1`}></i>
        {c.label}
      </Badge>
    );
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'genere':
        return <Badge bg="success"><i className="bi bi-check-circle me-1"></i>Généré</Badge>;
      case 'en_attente':
        return <Badge bg="warning"><i className="bi bi-hourglass-split me-1"></i>En attente</Badge>;
      case 'erreur':
        return <Badge bg="danger"><i className="bi bi-x-circle me-1"></i>Erreur</Badge>;
      default:
        return <Badge bg="secondary">{statut}</Badge>;
    }
  };

  const columns: Column<Document>[] = [
    { key: 'type', header: 'Type', render: (item) => getTypeBadge(item.type) },
    { key: 'titre', header: 'Document', render: (item) => (
      <div>
        <div className="fw-medium">{item.titre}</div>
        <small className="text-muted">{item.taille}</small>
      </div>
    )},
    { key: 'etudiant', header: 'Étudiant', render: (item) => (
      <div>
        <div>{item.etudiant}</div>
        <small className="text-muted">{item.matricule}</small>
      </div>
    )},
    { key: 'dateGeneration', header: 'Date génération' },
    { key: 'statut', header: 'Statut', render: (item) => getStatutBadge(item.statut) },
    { key: 'actions', header: 'Actions', width: '150px', render: (item) => (
      <div className="d-flex gap-1">
        {item.statut === 'genere' && (
          <>
            <Button size="sm" variant="outline-primary" title="Télécharger">
              <i className="bi bi-download"></i>
            </Button>
            <Button size="sm" variant="outline-info" title="Aperçu">
              <i className="bi bi-eye"></i>
            </Button>
          </>
        )}
        {item.statut === 'erreur' && (
          <Button size="sm" variant="outline-warning" title="Régénérer">
            <i className="bi bi-arrow-clockwise"></i>
          </Button>
        )}
        <Button size="sm" variant="outline-danger" title="Supprimer">
          <i className="bi bi-trash"></i>
        </Button>
      </div>
    )}
  ];

  const filteredData = documents.filter(item => {
    const matchSearch = 
      item.titre.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.etudiant.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.matricule.toLowerCase().includes(searchValue.toLowerCase());
    const matchType = !filterValues.type || item.type === filterValues.type;
    const matchStatut = !filterValues.statut || item.statut === filterValues.statut;
    return matchSearch && matchType && matchStatut;
  });

  // Statistiques par type
  const stats = {
    bulletins: documents.filter(d => d.type === 'bulletin').length,
    attestations: documents.filter(d => d.type === 'attestation' || d.type === 'certificat').length,
    finances: documents.filter(d => d.type === 'facture' || d.type === 'recu').length,
    erreurs: documents.filter(d => d.statut === 'erreur').length
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Documents générés"
        subtitle="Historique des documents générés"
        breadcrumbs={[
          { label: 'Documents', path: '/admin/documents' },
          { label: 'Liste' }
        ]}
        actions={
          <div className="d-flex gap-2">
            <Button variant="outline-primary">
              <i className="bi bi-file-earmark-plus me-2"></i>
              Générer un document
            </Button>
          </div>
        }
      />

      {/* Statistiques rapides */}
      <Row className="g-3 mb-4">
        <Col sm={6} md={3}>
          <Card className="border-0 shadow-sm h-100 bg-primary bg-opacity-10">
            <Card.Body className="d-flex align-items-center gap-3">
              <div className="bg-primary rounded p-2">
                <i className="bi bi-file-earmark-text fs-4 text-white"></i>
              </div>
              <div>
                <div className="fs-4 fw-bold">{stats.bulletins}</div>
                <small className="text-muted">Bulletins</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={6} md={3}>
          <Card className="border-0 shadow-sm h-100 bg-success bg-opacity-10">
            <Card.Body className="d-flex align-items-center gap-3">
              <div className="bg-success rounded p-2">
                <i className="bi bi-award fs-4 text-white"></i>
              </div>
              <div>
                <div className="fs-4 fw-bold">{stats.attestations}</div>
                <small className="text-muted">Attestations/Certificats</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={6} md={3}>
          <Card className="border-0 shadow-sm h-100 bg-info bg-opacity-10">
            <Card.Body className="d-flex align-items-center gap-3">
              <div className="bg-info rounded p-2">
                <i className="bi bi-receipt fs-4 text-white"></i>
              </div>
              <div>
                <div className="fs-4 fw-bold">{stats.finances}</div>
                <small className="text-muted">Factures/Reçus</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={6} md={3}>
          <Card className="border-0 shadow-sm h-100 bg-danger bg-opacity-10">
            <Card.Body className="d-flex align-items-center gap-3">
              <div className="bg-danger rounded p-2">
                <i className="bi bi-exclamation-triangle fs-4 text-white"></i>
              </div>
              <div>
                <div className="fs-4 fw-bold">{stats.erreurs}</div>
                <small className="text-muted">Erreurs</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <DataCard
        title={`Documents (${filteredData.length})`}
        actions={
          <Button variant="outline-secondary" size="sm" onClick={loadData}>
            <i className="bi bi-arrow-clockwise me-1"></i>
            Actualiser
          </Button>
        }
      >
        <SearchFilter
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder="Rechercher par titre, étudiant..."
          filters={[
            {
              key: 'type',
              label: 'Tous les types',
              type: 'select',
              options: [
                { value: 'bulletin', label: 'Bulletin' },
                { value: 'attestation', label: 'Attestation' },
                { value: 'certificat', label: 'Certificat' },
                { value: 'releve', label: 'Relevé' },
                { value: 'facture', label: 'Facture' },
                { value: 'recu', label: 'Reçu' }
              ]
            },
            {
              key: 'statut',
              label: 'Tous les statuts',
              type: 'select',
              options: [
                { value: 'genere', label: 'Généré' },
                { value: 'en_attente', label: 'En attente' },
                { value: 'erreur', label: 'Erreur' }
              ]
            }
          ]}
          filterValues={filterValues}
          onFilterChange={(key, value) => setFilterValues({ ...filterValues, [key]: value })}
          onReset={() => { setSearchValue(''); setFilterValues({}); }}
        />

        <DataTable
          columns={columns}
          data={filteredData}
          loading={loading}
          emptyMessage="Aucun document trouvé"
        />
      </DataCard>
    </div>
  );
};

export default DocumentsListPage;
