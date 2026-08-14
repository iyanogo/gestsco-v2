/**
 * Page de gestion des stages.
 * Liste des stages avec filtres et actions selon le rôle.
 */

import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Badge, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layouts';
import { DataCard, DataTable, SearchFilter, Column } from '../../components/ui';
import stageService from '../../services/stageService';
import type { Stage } from '../../types/anneeAcademique';
import { TYPES_STAGE, STATUTS_STAGE } from '../../types/anneeAcademique';

const StagesPage: React.FC = () => {
  const navigate = useNavigate();
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  
  // Pour les statistiques
  const [stats, setStats] = useState<{
    total: number;
    en_cours: number;
    termines: number;
    valides: number;
  } | null>(null);

  useEffect(() => {
    loadStages();
  }, []);

  const loadStages = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await stageService.getStages();
      setStages(data);
      
      // Calculer les stats
      setStats({
        total: data.length,
        en_cours: data.filter(s => s.statut === 'en_cours').length,
        termines: data.filter(s => s.statut === 'termine').length,
        valides: data.filter(s => s.statut === 'valide').length,
      });
    } catch (err) {
      console.error('Erreur lors du chargement des stages:', err);
      setError('Impossible de charger les stages.');
    } finally {
      setLoading(false);
    }
  };

  const getStatutBadge = (statut: string) => {
    const statutInfo = STATUTS_STAGE.find(s => s.value === statut);
    const colors: Record<string, string> = {
      info: 'info',
      warning: 'warning',
      success: 'success',
      error: 'danger',
    };
    return (
      <Badge bg={colors[statutInfo?.color || 'secondary'] || 'secondary'}>
        {statutInfo?.label || statut}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeInfo = TYPES_STAGE.find(t => t.value === type);
    return (
      <Badge bg="light" text="dark">
        {typeInfo?.label || type}
      </Badge>
    );
  };

  const columns: Column<Stage>[] = [
    { 
      key: 'code', 
      header: 'Code', 
      width: '120px',
      render: (item) => <code className="text-primary">{item.code}</code>
    },
    { 
      key: 'etudiant_id', 
      header: 'Étudiant',
      render: (item) => (
        <div className="d-flex align-items-center">
          <div className="avatar-sm bg-primary bg-opacity-10 rounded-circle me-2 d-flex align-items-center justify-content-center">
            <i className="bi bi-person text-primary"></i>
          </div>
          <span>Étudiant #{item.etudiant_id}</span>
        </div>
      )
    },
    { 
      key: 'type_stage', 
      header: 'Type',
      render: (item) => getTypeBadge(item.type_stage)
    },
    { 
      key: 'entreprise_nom', 
      header: 'Entreprise'
    },
    { 
      key: 'theme', 
      header: 'Thème',
      render: (item) => (
        <span title={item.theme}>
          {item.theme.length > 50 ? `${item.theme.substring(0, 50)}...` : item.theme}
        </span>
      )
    },
    { 
      key: 'date_debut', 
      header: 'Période',
      render: (item) => (
        <small>
          {new Date(item.date_debut).toLocaleDateString('fr-FR')} - {new Date(item.date_fin).toLocaleDateString('fr-FR')}
        </small>
      )
    },
    { 
      key: 'statut', 
      header: 'Statut',
      render: (item) => getStatutBadge(item.statut)
    },
    { 
      key: 'note_finale', 
      header: 'Note',
      render: (item) => item.note_finale ? (
        <Badge bg={Number(item.note_finale) >= 10 ? 'success' : 'danger'}>
          {item.note_finale}/20
        </Badge>
      ) : '-'
    },
    { 
      key: 'actions', 
      header: 'Actions', 
      width: '100px',
      render: (item) => (
        <div className="d-flex gap-1">
          <Button 
            size="sm" 
            variant="outline-primary"
            onClick={() => navigate(`/stages/${item.id}`)}
          >
            <i className="bi bi-eye"></i>
          </Button>
        </div>
      )
    }
  ];

  const filteredStages = stages.filter(stage => {
    const matchSearch = !searchValue || 
      stage.code.toLowerCase().includes(searchValue.toLowerCase()) ||
      stage.entreprise_nom.toLowerCase().includes(searchValue.toLowerCase()) ||
      stage.theme.toLowerCase().includes(searchValue.toLowerCase());
    
    const matchType = !filterValues.type || stage.type_stage === filterValues.type;
    const matchStatut = !filterValues.statut || stage.statut === filterValues.statut;
    
    return matchSearch && matchType && matchStatut;
  });

  return (
    <div className="fade-in">
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <PageHeader
        title="Gestion des Stages"
        subtitle="Suivi des stages et soutenances"
        breadcrumbs={[
          { label: 'Stages' }
        ]}
        actions={
          <Button variant="primary" onClick={() => navigate('/stages/nouveau')}>
            <i className="bi bi-plus-lg me-2"></i>
            Nouveau stage
          </Button>
        }
      />

      {/* Statistiques */}
      {stats && (
        <Row className="g-3 mb-4">
          <Col sm={6} md={3}>
            <Card className="text-center h-100">
              <Card.Body>
                <h3 className="mb-0 text-primary">{stats.total}</h3>
                <small className="text-muted">Total stages</small>
              </Card.Body>
            </Card>
          </Col>
          <Col sm={6} md={3}>
            <Card className="text-center h-100">
              <Card.Body>
                <h3 className="mb-0 text-info">{stats.en_cours}</h3>
                <small className="text-muted">En cours</small>
              </Card.Body>
            </Card>
          </Col>
          <Col sm={6} md={3}>
            <Card className="text-center h-100">
              <Card.Body>
                <h3 className="mb-0 text-warning">{stats.termines}</h3>
                <small className="text-muted">Terminés</small>
              </Card.Body>
            </Card>
          </Col>
          <Col sm={6} md={3}>
            <Card className="text-center h-100">
              <Card.Body>
                <h3 className="mb-0 text-success">{stats.valides}</h3>
                <small className="text-muted">Validés</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <DataCard
        title={`Liste des stages (${filteredStages.length})`}
        actions={
          <Button variant="outline-secondary" size="sm" onClick={loadStages}>
            <i className="bi bi-arrow-clockwise me-1"></i>
            Actualiser
          </Button>
        }
      >
        <SearchFilter
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder="Rechercher un stage..."
          filters={[
            {
              key: 'type',
              label: 'Tous les types',
              type: 'select',
              options: TYPES_STAGE.map(t => ({ value: t.value, label: t.label }))
            },
            {
              key: 'statut',
              label: 'Tous les statuts',
              type: 'select',
              options: STATUTS_STAGE.map(s => ({ value: s.value, label: s.label }))
            }
          ]}
          filterValues={filterValues}
          onFilterChange={(key, value) => setFilterValues({ ...filterValues, [key]: value })}
          onReset={() => { setSearchValue(''); setFilterValues({}); }}
        />

        <DataTable
          columns={columns}
          data={filteredStages}
          loading={loading}
          emptyMessage="Aucun stage trouvé"
          onRowClick={(item) => navigate(`/stages/${item.id}`)}
        />
      </DataCard>
    </div>
  );
};

export default StagesPage;
